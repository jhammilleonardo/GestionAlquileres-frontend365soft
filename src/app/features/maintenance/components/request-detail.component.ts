import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { interval } from 'rxjs';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  ArrowLeft,
  User,
  Home,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Wrench,
  AlertCircle,
  Send,
  Lock,
  Settings,
  FileText,
  Paperclip,
  Image,
  Star,
  type LucideIconData,
} from 'lucide-angular';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceMessage,
  MaintenanceAttachment,
  CreateMessageDto,
} from '../../../core/models/maintenance-request.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { MaintenanceService } from '../../../core/services/admin/maintenance.service';
import {
  AdminUserService,
  User as AdminUser,
} from '../../../core/services/admin/admin-user.service';
import { VendorService } from '../../../core/services/admin/vendor.service';
import { Vendor } from '../../../core/models/vendor.model';
import { MaintenanceReadStateService } from '../../../core/services/maintenance/maintenance-read-state.service';
import { SecureFileService } from '../../../core/services/secure-file.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantMaintenanceConversationComponent } from '../../tenant-portal/maintenance/components/tenant-maintenance-conversation.component';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AppDatePickerComponent } from '../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/ui/select/select.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    TenantMaintenanceConversationComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'mantenimiento', alias: 'maintenance' })],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss',
})
export class RequestDetailComponent implements OnInit {
  readonly initialRequest = input.required<MaintenanceRequest>();
  readonly closed = output<void>();
  readonly changed = output<MaintenanceRequest>();
  readonly deleted = output<void>();

  @ViewChild('msgContainer') msgContainer!: ElementRef<HTMLElement>;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  // Icons
  readonly X = X;
  readonly Paperclip = Paperclip;
  readonly Image = Image;
  readonly User = User;
  readonly Home = Home;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly DollarSign = DollarSign;
  readonly MessageSquare = MessageSquare;
  readonly Wrench = Wrench;
  readonly AlertCircle = AlertCircle;
  readonly Send = Send;
  readonly Lock = Lock;
  readonly ArrowLeft = ArrowLeft;
  readonly Settings = Settings;
  readonly FileText = FileText;
  readonly Star = Star;
  readonly stars = [1, 2, 3, 4, 5];

  // Enums
  MaintenanceStatus = MaintenanceStatus;
  MaintenancePriority = MaintenancePriority;
  MaintenanceCategory = MaintenanceCategory;

  private transloco = inject(TranslocoService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  /** Scroll-to-bottom trigger para el chat reutilizado. */
  readonly scrollVersion = signal(0);
  readonly sentVersion = signal(0);

  /** Marca los mensajes propios del admin logueado (alineados a la derecha). */
  readonly isMyMessage = (message: MaintenanceMessage): boolean =>
    Number(this.authService.currentUser()?.id) === message.user_id;

  addFiles(files: File[]): void {
    this.selectedFiles.update((current) => [...current, ...files].slice(0, 3));
  }

  onNewMessagesOpened(): void {
    this.newMessagesCount.set(0);
    this.scrollVersion.update((v) => v + 1);
    setTimeout(() => this.pollingNewFromId.set(0), 2500);
  }

  onConversationAtBottom(atBottom: boolean): void {
    if (atBottom) {
      this.newMessagesCount.set(0);
      this.pollingNewFromId.set(0);
    }
  }

  // State
  request!: MaintenanceRequest;
  messages = signal<MaintenanceMessage[]>([]);
  newMessage = signal('');
  isInternalNote = signal(false);
  isLoadingMessages = signal(false);
  isSendingMessage = signal(false);
  isUpdating = signal(false);
  selectedFiles = signal<File[]>([]);

  // Unread tracking
  firstUnreadMessageId = 0;
  unreadCountFromHere = 0;

  private readonly destroyRef = inject(DestroyRef);

  // Polling
  private lastMessageId = 0;
  newMessagesCount = signal(0);
  pollingNewFromId = signal(0);

  readonly staffMembers = signal<AdminUser[]>([]);

  readonly statusOptions: AppSelectOption<MaintenanceStatus>[] = Object.values(
    MaintenanceStatus,
  ).map((value) => ({
    value,
    label: this.transloco.translate(`maintenance.status.${value}`),
  }));

  readonly priorityOptions: AppSelectOption<MaintenancePriority>[] = Object.values(
    MaintenancePriority,
  ).map((value) => ({
    value,
    label: this.transloco.translate(`maintenance.priority.${value}`),
  }));

  readonly staffOptions = signal<AppSelectOption<number>[]>([]);

  // Getter/setter for the date input (HTML date inputs require YYYY-MM-DD strings)
  get dueDateString(): string {
    if (!this.request.due_date) return '';
    const d = new Date(this.request.due_date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  set dueDateString(value: string) {
    if (!value) {
      this.request.due_date = null;
    } else {
      // Parse as local date components to avoid UTC timezone shifting
      const [year, month, day] = value.split('-').map(Number);
      this.request.due_date = new Date(year, month - 1, day);
    }
  }

  private readonly maintenanceService = inject(MaintenanceService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly vendorService = inject(VendorService);
  private readonly readState = inject(MaintenanceReadStateService);
  private readonly secureFile = inject(SecureFileService);

  // Proveedores externos para asignación
  readonly vendors = signal<Vendor[]>([]);
  readonly vendorOptions = signal<AppSelectOption<number>[]>([]);

  // Modal de calificación del proveedor al cerrar la orden
  readonly ratingDialogOpen = signal(false);
  readonly ratingValue = signal(0);
  readonly ratingComment = signal('');
  readonly attachmentObjectUrls = signal<Record<string, string>>({});

  textareaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }
  readonly ratingSaving = signal(false);

  constructor() {
    this.loadStaffMembers();
    this.loadVendors();
  }

  ngOnInit(): void {
    this.request = { ...this.initialRequest() };
    this.loadMessages();
  }

  private loadStaffMembers(): void {
    this.adminUserService.listUsers().subscribe({
      next: (users) => {
        // Solo personal que ejecuta/coordina el trabajo en campo. ADMIN y
        // SUPERADMIN gestionan desde el panel y no se asignan como ejecutores;
        // para externos existe el campo "Proveedor externo".
        const staff = users.filter((user) => user.role === 'TECNICO' || user.role === 'EMPLEADO');
        this.staffMembers.set(staff);
        this.staffOptions.set(
          staff.map((user) => ({
            value: user.id,
            label: `${user.name} · ${user.role}`,
          })),
        );
      },
      error: () => {
        this.staffMembers.set([]);
        this.staffOptions.set([]);
      },
    });
  }

  private loadVendors(): void {
    this.vendorService.list().subscribe({
      next: (vendors) => {
        this.vendors.set(vendors);
        this.vendorOptions.set(
          vendors.map((v) => ({
            value: v.id,
            label: `${v.name} · ${this.transloco.translate('vendors.specialty.' + v.specialty)}`,
          })),
        );
      },
      error: () => this.vendorOptions.set([]),
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.msgContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  private isNearBottom(): boolean {
    const el = this.msgContainer?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  private startPolling(): void {
    const requestId = this.request.id;
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.hidden) return;
        this.maintenanceService.getMessages(requestId).subscribe({
          next: (messages) => {
            const newLastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
            if (newLastId !== this.lastMessageId) {
              const oldLastId = this.lastMessageId;
              const incoming = messages.length - this.messages().length;
              this.lastMessageId = newLastId;
              const atBottom = this.isNearBottom();
              const firstNew = messages.find((m) => m.id > oldLastId);
              if (firstNew) this.pollingNewFromId.set(firstNew.id);
              this.messages.set(messages);
              this.prepareAttachmentPreviews(messages);
              if (atBottom) {
                this.scrollToBottom();
                this.newMessagesCount.set(0);
                setTimeout(() => this.pollingNewFromId.set(0), 2000);
              } else {
                this.newMessagesCount.update((c) => c + (incoming > 0 ? incoming : 1));
              }
            }
          },
          error: () => undefined,
        });
      });
  }

  isFirstPollingNew(msg: MaintenanceMessage): boolean {
    return this.pollingNewFromId() > 0 && msg.id === this.pollingNewFromId();
  }

  scrollToNewMessages(): void {
    this.newMessagesCount.set(0);
    this.scrollToBottom();
    setTimeout(() => this.pollingNewFromId.set(0), 2500);
  }

  onMessagesScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      this.newMessagesCount.set(0);
      this.pollingNewFromId.set(0);
    }
  }

  private getLastReadId(): number {
    return this.readState.getAdminLastReadId(this.request.id);
  }

  private computeUnread(messages: MaintenanceMessage[], lastReadId: number): void {
    if (lastReadId === 0) {
      this.firstUnreadMessageId = 0;
      this.unreadCountFromHere = 0;
      return;
    }
    const unread = messages.filter((m) => this.isFromTenant(m) && m.id > lastReadId);
    this.unreadCountFromHere = unread.length;
    this.firstUnreadMessageId = unread.length > 0 ? unread[0].id : 0;
  }

  private markAllAsRead(messages: MaintenanceMessage[]): void {
    this.readState.markAdminMessagesRead(this.request.id, messages);
  }

  isFirstUnread(msg: MaintenanceMessage): boolean {
    return this.firstUnreadMessageId > 0 && msg.id === this.firstUnreadMessageId;
  }

  loadMessages(): void {
    const lastReadId = this.getLastReadId();
    this.isLoadingMessages.set(true);
    this.maintenanceService.getMessages(this.request.id).subscribe({
      next: (messages) => {
        this.computeUnread(messages, lastReadId);
        this.lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        this.messages.set(messages);
        this.isLoadingMessages.set(false);
        this.markAllAsRead(messages);
        this.scrollVersion.update((v) => v + 1);
        this.startPolling();
      },
      error: () => {
        this.toast.error(this.transloco.translate('maintenance.errorLoadMessages'));
        this.isLoadingMessages.set(false);
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    this.isUpdating.set(true);
    this.maintenanceService
      .updateRequest(this.request.id, {
        status: this.request.status,
        priority: this.request.priority,
        assigned_to: this.request.assigned_to,
        due_date: this.request.due_date
          ? this.formatDateForBackend(this.request.due_date)
          : undefined,
      })
      .subscribe({
        next: (updated) => {
          this.request = { ...this.request, ...updated };
          this.isUpdating.set(false);
          this.changed.emit(this.request);
          // Al cerrar una orden asignada a un proveedor externo aún sin calificar,
          // pedimos la calificación antes de salir.
          if (this.shouldPromptRating()) {
            this.openRatingDialog();
          } else {
            this.closed.emit();
          }
        },
        error: () => {
          this.toast.error(this.transloco.translate('maintenance.errorUpdateRequest'));
          this.isUpdating.set(false);
        },
      });
  }

  async delete(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('common.delete'),
      message: this.transloco.translate('maintenance.confirmDeleteRequest', {
        title: this.request.title,
      }),
      confirmLabel: this.transloco.translate('common.delete'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.maintenanceService.deleteRequest(this.request.id).subscribe({
      next: () => {
        this.deleted.emit();
      },
      error: () => {
        this.toast.error(this.transloco.translate('maintenance.errorDeleteRequest'));
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const newFiles = Array.from(input.files);
    const remaining = 3 - this.selectedFiles().length;
    this.selectedFiles.update((files) => [...files, ...newFiles.slice(0, remaining)]);
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  getFileUrl(url: string): string {
    return this.attachmentObjectUrls()[url] ?? environment.apiUrl.replace(/\/$/, '') + url;
  }

  isImageAttachment(fileType: string): boolean {
    return fileType === 'image';
  }

  openAttachment(attachment: MaintenanceAttachment): void {
    this.secureFile.open(attachment.file_url, 'admin');
  }

  downloadAttachment(attachment: MaintenanceAttachment): void {
    this.secureFile.download(attachment.file_url, attachment.file_name, 'admin');
  }

  sendMessage(text: string): void {
    const messageText = text.trim();
    const files = this.selectedFiles();

    if (!messageText && files.length === 0) return;

    this.isSendingMessage.set(true);

    const send = (fileUrls: string[]) => {
      const dto: CreateMessageDto = {
        message: messageText,
        send_to_resident: !this.isInternalNote(),
        ...(fileUrls.length > 0 && { files: fileUrls }),
      };
      this.maintenanceService.addMessage(this.request.id, dto).subscribe({
        next: (message) => {
          // Inserción optimista: el mensaje devuelto ya trae adjuntos y remitente.
          this.messages.update((msgs) => [...msgs, message]);
          this.lastMessageId = message.id;
          this.newMessage.set('');
          this.isInternalNote.set(false);
          this.selectedFiles.set([]);
          this.isSendingMessage.set(false);
          this.sentVersion.update((version) => version + 1);
          this.scrollVersion.update((v) => v + 1);
        },
        error: () => {
          this.toast.error(this.transloco.translate('maintenance.errorSendMessage'));
          this.isSendingMessage.set(false);
        },
      });
    };

    if (files.length > 0) {
      this.maintenanceService.uploadFiles(this.request.id, files).subscribe({
        next: (attachments) => send(attachments.map((a) => a.file_url)),
        error: () => {
          this.toast.error(this.transloco.translate('maintenance.errorUploadFiles'));
          this.isSendingMessage.set(false);
        },
      });
    } else {
      send([]);
    }
  }

  getStaffName(staffId: number): string {
    const staff = this.staffMembers().find((s) => s.id === staffId);
    return staff ? staff.name : `Staff #${staffId}`;
  }

  onStaffAssignment(staffId: number | null): void {
    if (!staffId) {
      this.request.assigned_to = null;
      return;
    }
    this.isUpdating.set(true);
    this.maintenanceService.assignVendor(this.request.id, { assigned_to: staffId }).subscribe({
      next: (updated) => {
        this.request = {
          ...this.request,
          ...updated,
          assigned_to: staffId,
          vendor_id: null,
          vendor_name: null,
        };
        this.isUpdating.set(false);
        this.changed.emit(this.request);
        this.toast.success(
          this.transloco.translate('maintenance.staffAssigned', {
            name: this.getStaffName(staffId),
          }),
        );
      },
      error: () => {
        this.isUpdating.set(false);
        this.toast.error(this.transloco.translate('maintenance.errorUpdateRequest'));
      },
    });
  }

  getVendorName(vendorId: number): string {
    return this.vendors().find((v) => v.id === vendorId)?.name ?? `Proveedor #${vendorId}`;
  }

  onVendorAssignment(vendorId: number | null): void {
    if (!vendorId) return;
    this.maintenanceService.assignVendor(this.request.id, { vendor_id: vendorId }).subscribe({
      next: (updated) => {
        this.request = { ...this.request, ...updated };
        // Proveedor externo excluye al técnico interno
        this.request.assigned_to = null;
        this.request.vendor_id = vendorId;
        this.request.vendor_name = this.getVendorName(vendorId);
        this.changed.emit(this.request);
        this.toast.success(
          this.transloco.translate('maintenance.vendorAssigned', {
            name: this.getVendorName(vendorId),
          }),
        );
      },
      error: () => this.toast.error(this.transloco.translate('maintenance.errorUpdateRequest')),
    });
  }

  canSendConversationMessage(): boolean {
    return (
      (this.newMessage().trim().length > 0 || this.selectedFiles().length > 0) &&
      !this.isSendingMessage()
    );
  }

  private prepareAttachmentPreviews(messages: MaintenanceMessage[]): void {
    const imageAttachments = messages.flatMap((message) =>
      (message.attachments ?? []).filter((attachment) =>
        this.isImageAttachment(attachment.file_type),
      ),
    );

    for (const attachment of imageAttachments) {
      if (this.attachmentObjectUrls()[attachment.file_url]) {
        continue;
      }

      this.secureFile.getObjectUrl(attachment.file_url, 'admin').subscribe({
        next: (objectUrl) => {
          this.attachmentObjectUrls.update((urls) => ({
            ...urls,
            [attachment.file_url]: objectUrl,
          }));
        },
        error: () => undefined,
      });
    }
  }

  private shouldPromptRating(): boolean {
    return (
      this.request.status === MaintenanceStatus.COMPLETED &&
      !!this.request.vendor_id &&
      !this.request.vendor_rating
    );
  }

  openRatingDialog(): void {
    this.ratingValue.set(0);
    this.ratingComment.set('');
    this.ratingDialogOpen.set(true);
  }

  setRating(value: number): void {
    this.ratingValue.set(value);
  }

  closeRatingDialog(): void {
    this.ratingDialogOpen.set(false);
    this.closed.emit();
  }

  submitRating(): void {
    if (this.ratingValue() < 1) {
      this.toast.error(this.transloco.translate('maintenance.ratingRequired'));
      return;
    }
    this.ratingSaving.set(true);
    this.maintenanceService
      .rateVendor(this.request.id, {
        rating: this.ratingValue(),
        comment: this.ratingComment().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.ratingSaving.set(false);
          this.ratingDialogOpen.set(false);
          this.toast.success(this.transloco.translate('maintenance.ratingSaved'));
          this.closed.emit();
        },
        error: () => {
          this.ratingSaving.set(false);
          this.toast.error(this.transloco.translate('maintenance.ratingError'));
        },
      });
  }

  updateStatus(status: MaintenanceStatus): void {
    this.request.status = status;
  }

  updatePriority(priority: MaintenancePriority): void {
    this.request.priority = priority;
  }

  getStatusColor(status: MaintenanceStatus): string {
    switch (status) {
      case MaintenanceStatus.NEW:
        return 'status-new';
      case MaintenanceStatus.IN_PROGRESS:
        return 'status-in-progress';
      case MaintenanceStatus.COMPLETED:
        return 'status-completed';
      case MaintenanceStatus.DEFERRED:
        return 'status-deferred';
      case MaintenanceStatus.CLOSED:
        return 'status-closed';
      default:
        return '';
    }
  }

  getPriorityColor(priority: MaintenancePriority): string {
    switch (priority) {
      case MaintenancePriority.LOW:
        return 'priority-low';
      case MaintenancePriority.NORMAL:
        return 'priority-normal';
      case MaintenancePriority.HIGH:
        return 'priority-high';
      default:
        return '';
    }
  }

  formatDateForBackend(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusValues(): MaintenanceStatus[] {
    return Object.values(MaintenanceStatus);
  }

  getPriorityValues(): MaintenancePriority[] {
    return Object.values(MaintenancePriority);
  }

  isMessageInternal(message: MaintenanceMessage): boolean {
    return !message.send_to_resident;
  }

  private readonly STAFF_ROLES = ['ADMIN', 'EMPLEADO', 'TECNICO', 'SUPERADMIN'];

  isFromTenant(message: MaintenanceMessage): boolean {
    return message.user_id === this.request.tenant_id;
  }

  /** Mensaje del personal interno (admin/empleado/técnico) → lado derecho. */
  isFromStaff(message: MaintenanceMessage): boolean {
    if (message.sender_role) {
      return this.STAFF_ROLES.includes(message.sender_role);
    }
    // Sin rol (datos antiguos): si no es del inquilino, asumir staff.
    return !this.isFromTenant(message);
  }

  getSenderName(message: MaintenanceMessage): string {
    return (
      message.sender_name ??
      (this.isFromTenant(message) ? this.request.tenant?.name : null) ??
      `Usuario #${message.user_id}`
    );
  }

  getSenderInitial(message: MaintenanceMessage): string {
    const name = message.sender_name ?? this.request.tenant?.name ?? 'U';
    return name.charAt(0).toUpperCase();
  }

  /** Etiqueta de rol traducida para el badge del remitente. */
  getSenderRoleText(message: MaintenanceMessage): string {
    return this.senderRoleLabel(message.sender_role);
  }

  /** Clase de color del badge según el rol del remitente. */
  getSenderRoleClass(message: MaintenanceMessage): string {
    switch (message.sender_role) {
      case 'VENDOR':
        return 'role-vendor';
      case 'INQUILINO':
        return 'role-tenant';
      case 'PROPIETARIO':
        return 'role-owner';
      default:
        return 'role-staff';
    }
  }

  private senderRoleLabel(role: string | null | undefined): string {
    if (!role) return '';
    const key = `maintenance.senderRole.${role}`;
    const label = this.transloco.translate(key);
    return label === key ? '' : label;
  }

  getMessageIcon(message: MaintenanceMessage): LucideIconData {
    return this.isMessageInternal(message) ? this.Lock : this.MessageSquare;
  }
}
