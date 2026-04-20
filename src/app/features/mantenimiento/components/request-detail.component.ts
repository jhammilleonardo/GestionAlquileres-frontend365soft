import {
  Component,
  Inject,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
} from 'lucide-angular';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceMessage,
  CreateMessageDto,
} from '../../../core/models/maintenance-request.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { MaintenanceService } from '../../../core/services/admin/maintenance.service';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    MatChipsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
  ],
  providers: [provideTranslocoScope({ scope: 'mantenimiento', alias: 'maintenance' })],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss',
})
export class RequestDetailComponent implements OnInit, OnDestroy {
  @ViewChild('msgContainer') msgContainer!: ElementRef;
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

  // Enums
  MaintenanceStatus = MaintenanceStatus;
  MaintenancePriority = MaintenancePriority;
  MaintenanceCategory = MaintenanceCategory;

  private transloco = inject(TranslocoService);

  // State
  request: MaintenanceRequest;
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

  // Polling
  private pollingSub: Subscription | null = null;
  private lastMessageId = 0;
  newMessagesCount = signal(0);
  pollingNewFromId = signal(0);

  // Staff members (TODO: should come from API)
  staffMembers = [
    { id: 1, name: 'Juan Electricista' },
    { id: 2, name: 'Pedro Técnico' },
    { id: 3, name: 'Miguel Constructor' },
    { id: 4, name: 'Control Plagas Pro' },
    { id: 5, name: 'Ana Plomera' },
  ];

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

  constructor(
    public dialogRef: MatDialogRef<RequestDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { request: MaintenanceRequest },
    private maintenanceService: MaintenanceService,
  ) {
    this.request = { ...data.request };
  }

  ngOnInit(): void {
    this.loadMessages();
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
    this.pollingSub?.unsubscribe();
    const requestId = this.request.id;
    this.pollingSub = interval(5000).subscribe(() => {
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
            if (atBottom) {
              this.scrollToBottom();
              this.newMessagesCount.set(0);
              setTimeout(() => this.pollingNewFromId.set(0), 2000);
            } else {
              this.newMessagesCount.update((c) => c + (incoming > 0 ? incoming : 1));
            }
          }
        },
        error: () => {},
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

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  private getLastReadId(): number {
    return parseInt(localStorage.getItem(`admin_mnt_lastread_${this.request.id}`) ?? '0', 10);
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
    if (messages.length > 0) {
      const lastId = Math.max(...messages.map((m) => m.id));
      localStorage.setItem(`admin_mnt_lastread_${this.request.id}`, String(lastId));
    }
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
        this.scrollToBottom();
        this.startPolling();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
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
          this.request = updated;
          this.isUpdating.set(false);
          this.dialogRef.close(this.request);
        },
        error: (error) => {
          console.error('Error updating request:', error);
          alert('Error al actualizar la solicitud');
          this.isUpdating.set(false);
        },
      });
  }

  delete(): void {
    if (confirm(`¿Estás seguro de eliminar la solicitud "${this.request.title}"?`)) {
      this.maintenanceService.deleteRequest(this.request.id).subscribe({
        next: () => {
          this.dialogRef.close({ deleted: true });
        },
        error: (error) => {
          console.error('Error deleting request:', error);
          alert('Error al eliminar la solicitud');
        },
      });
    }
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
    return environment.apiUrl.replace(/\/$/, '') + url;
  }

  isImageAttachment(fileType: string): boolean {
    return fileType === 'image';
  }

  addMessage(): void {
    const messageText = this.newMessage().trim();
    if (!messageText) return;

    this.isSendingMessage.set(true);

    const send = (fileUrls: string[]) => {
      const dto: CreateMessageDto = {
        message: messageText,
        send_to_resident: !this.isInternalNote(),
        ...(fileUrls.length > 0 && { files: fileUrls }),
      };
      this.maintenanceService.addMessage(this.request.id, dto).subscribe({
        next: (message) => {
          this.messages.update((msgs) => [...msgs, message]);
          this.lastMessageId = message.id;
          this.newMessage.set('');
          this.isInternalNote.set(false);
          this.selectedFiles.set([]);
          this.isSendingMessage.set(false);
          this.scrollToBottom();
        },
        error: () => {
          alert('Error al enviar el mensaje');
          this.isSendingMessage.set(false);
        },
      });
    };

    if (this.selectedFiles().length > 0) {
      this.maintenanceService.uploadFiles(this.request.id, this.selectedFiles()).subscribe({
        next: (attachments) => send(attachments.map((a) => a.file_url)),
        error: () => {
          alert('Error al subir los archivos');
          this.isSendingMessage.set(false);
        },
      });
    } else {
      send([]);
    }
  }

  getStaffName(staffId: number): string {
    const staff = this.staffMembers.find((s) => s.id === staffId);
    return staff ? staff.name : `Staff #${staffId}`;
  }

  onStaffAssignment(staffId: number | null): void {
    if (!staffId) {
      this.request.assigned_to = null;
      return;
    }
    this.request.assigned_to = staffId;
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

  isFromTenant(message: MaintenanceMessage): boolean {
    return message.user_id === this.request.tenant_id;
  }

  getSenderName(message: MaintenanceMessage): string {
    if (this.isFromTenant(message)) {
      return this.request.tenant?.name ?? `Inquilino #${this.request.tenant_id}`;
    }
    return 'Tú (Admin)';
  }

  getMessageIcon(message: MaintenanceMessage): any {
    return this.isMessageInternal(message) ? this.Lock : this.MessageSquare;
  }
}
