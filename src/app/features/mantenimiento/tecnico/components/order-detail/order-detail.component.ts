import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  CalendarDays,
  User,
  Play,
  CheckCheck,
  Send,
  Paperclip,
  X,
  Image,
  Lock,
  MessageSquare,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { environment } from '../../../../../../environments/environment';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceMessage,
  CreateMessageDto,
} from '../../../../../core/models/maintenance-request.model';
import { MaintenanceService } from '../../../../../core/services/admin/maintenance.service';
import { TenantDatePipe } from '../../../../../shared/pipes/tenant-date.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  providers: [provideTranslocoScope('tecnico')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent {
  // Inputs / Outputs
  readonly request = input.required<MaintenanceRequest>();
  readonly closed = output<void>();
  readonly statusAdvanced = output<MaintenanceRequest>();

  // Services
  private maintenanceService = inject(MaintenanceService);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly AlertCircleIcon = AlertCircle;
  readonly HomeIcon = Home;
  readonly CalendarDaysIcon = CalendarDays;
  readonly UserIcon = User;
  readonly PlayIcon = Play;
  readonly CheckCheckIcon = CheckCheck;
  readonly SendIcon = Send;
  readonly PaperclipIcon = Paperclip;
  readonly XIcon = X;
  readonly ImageIcon = Image;
  readonly LockIcon = Lock;
  readonly MessageSquareIcon = MessageSquare;

  // Enums
  readonly MaintenanceStatus = MaintenanceStatus;

  // State
  messages = signal<MaintenanceMessage[]>([]);
  noteText = signal('');
  selectedFiles = signal<File[]>([]);
  previewUrls = signal<string[]>([]);
  isLoadingMessages = signal(false);
  isSendingNote = signal(false);
  isAdvancingStage = signal(false);

  // Computed
  readonly canAdvance = computed(() => {
    const status = this.request().status;
    return status === MaintenanceStatus.NEW || status === MaintenanceStatus.IN_PROGRESS;
  });

  readonly advanceLabel = computed(() =>
    this.request().status === MaintenanceStatus.NEW
      ? this.transloco.translate('tecnico.startWork')
      : this.transloco.translate('tecnico.markCompleted'),
  );

  readonly nextStatus = computed(() =>
    this.request().status === MaintenanceStatus.NEW
      ? MaintenanceStatus.IN_PROGRESS
      : MaintenanceStatus.COMPLETED,
  );

  constructor() {
    // Load messages reactively when request input is set
    this.loadMessages();
  }

  loadMessages(): void {
    this.isLoadingMessages.set(true);
    this.maintenanceService
      .getMessages(this.request().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.isLoadingMessages.set(false);
        },
        error: () => {
          this.isLoadingMessages.set(false);
        },
      });
  }

  advanceStage(): void {
    this.isAdvancingStage.set(true);
    this.maintenanceService
      .updateStatus(this.request().id, this.nextStatus())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.isAdvancingStage.set(false);
          const label =
            updated.status === MaintenanceStatus.IN_PROGRESS
              ? this.transloco.translate('tecnico.orderStarted')
              : this.transloco.translate('tecnico.orderCompleted');
          this.snackBar.open(label, undefined, {
            duration: 3000,
            panelClass: ['snack-success'],
          });
          this.statusAdvanced.emit(updated);
        },
        error: (err: { error?: { message?: string } }) => {
          this.isAdvancingStage.set(false);
          this.snackBar.open(
            err.error?.message ?? this.transloco.translate('tecnico.errorUpdateStatus'),
            this.transloco.translate('common.close'),
            { duration: 4000 },
          );
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const current = this.selectedFiles();
    const remaining = 3 - current.length;
    const newFiles = Array.from(input.files).slice(0, remaining);

    this.selectedFiles.update((files) => [...files, ...newFiles]);

    // Generate previews
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.update((urls) => [...urls, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrls.update((urls) => [...urls, '']);
      }
    });

    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
    this.previewUrls.update((urls) => urls.filter((_, i) => i !== index));
  }

  sendNote(): void {
    const text = this.noteText().trim();
    if (!text) return;

    this.isSendingNote.set(true);

    const doSend = (fileUrls: string[]) => {
      const dto: CreateMessageDto = {
        message: text,
        send_to_resident: true,
        ...(fileUrls.length > 0 && { files: fileUrls }),
      };
      this.maintenanceService
        .addMessage(this.request().id, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (msg) => {
            this.messages.update((msgs) => [...msgs, msg]);
            this.noteText.set('');
            this.selectedFiles.set([]);
            this.previewUrls.set([]);
            this.isSendingNote.set(false);
            this.snackBar.open(this.transloco.translate('tecnico.noteSent'), undefined, {
              duration: 2500,
              panelClass: ['snack-success'],
            });
          },
          error: (err: { error?: { message?: string } }) => {
            this.isSendingNote.set(false);
            this.snackBar.open(
              err.error?.message ?? this.transloco.translate('tecnico.errorSendNote'),
              this.transloco.translate('common.close'),
              { duration: 4000 },
            );
          },
        });
    };

    if (this.selectedFiles().length > 0) {
      this.maintenanceService
        .uploadFiles(this.request().id, this.selectedFiles())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (attachments) => doSend(attachments.map((a) => a.file_url)),
          error: (err: { error?: { message?: string } }) => {
            this.isSendingNote.set(false);
            this.snackBar.open(
              err.error?.message ?? this.transloco.translate('tecnico.errorUploadFiles'),
              this.transloco.translate('common.close'),
              { duration: 4000 },
            );
          },
        });
    } else {
      doSend([]);
    }
  }

  getFileUrl(url: string): string {
    return environment.apiUrl.replace(/\/$/, '') + url;
  }

  isInternal(msg: MaintenanceMessage): boolean {
    return !msg.send_to_resident;
  }
}
