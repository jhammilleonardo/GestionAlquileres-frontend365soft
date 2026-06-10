import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  ArrowLeft,
  Home,
  User,
  CalendarDays,
  Play,
  CheckCheck,
  MapPin,
  ExternalLink,
  Phone,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import {
  CreateMessageDto,
  MaintenanceMessage,
  MaintenanceRequest,
  MaintenanceStatus,
} from '../../../core/models/maintenance-request.model';
import { VendorMaintenanceService } from '../../../core/services/vendor/vendor-maintenance.service';
import { VendorAuthService } from '../../../core/services/vendor/vendor-auth.service';
import { getApiErrorMessage } from '../../../core/http/http-error.util';
import { AppButtonComponent } from '../../../shared/ui/button/button.component';
import { TenantDatePipe } from '../../../shared/pipes/tenant-date.pipe';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { TenantMaintenanceConversationComponent } from '../../tenant-portal/maintenance/components/tenant-maintenance-conversation.component';

@Component({
  selector: 'app-vendor-order-detail',
  standalone: true,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    TenantDatePipe,
    AppButtonComponent,
    TenantMaintenanceConversationComponent,
  ],
  providers: [provideTranslocoScope({ scope: 'vendorPortal', alias: 'vendorPortal' })],
  templateUrl: './vendor-order-detail.component.html',
  styleUrl: './vendor-order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrderDetailComponent {
  readonly request = input.required<MaintenanceRequest>();
  readonly closed = output<void>();
  readonly statusAdvanced = output<MaintenanceRequest>();

  private readonly maintenance = inject(VendorMaintenanceService);
  private readonly vendorAuth = inject(VendorAuthService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ArrowLeft = ArrowLeft;
  readonly Home = Home;
  readonly User = User;
  readonly CalendarDays = CalendarDays;
  readonly Play = Play;
  readonly CheckCheck = CheckCheck;
  readonly MapPin = MapPin;
  readonly ExternalLink = ExternalLink;
  readonly Phone = Phone;

  readonly MaintenanceStatus = MaintenanceStatus;

  readonly messages = signal<MaintenanceMessage[]>([]);
  readonly isLoadingMessages = signal(false);
  readonly isAdvancing = signal(false);
  readonly isSendingNote = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly scrollVersion = signal(0);
  readonly sentVersion = signal(0);

  /** Marca los mensajes propios del proveedor (alineados a la derecha). */
  readonly isMyMessage = (message: MaintenanceMessage): boolean =>
    message.user_id === (this.vendorAuth.currentVendor()?.id ?? -1);

  /** Dirección legible de la propiedad, si está disponible. */
  readonly fullAddress = computed(() => {
    const p = this.request().property;
    if (!p) return '';
    const parts = [p.address, p.city, p.state, p.country].filter(
      (part): part is string => !!part && part.trim().length > 0,
    );
    return parts.join(', ');
  });

  /** Enlace a Google Maps: usa coordenadas si existen, si no la dirección. */
  readonly mapUrl = computed(() => {
    const p = this.request().property;
    if (!p) return '';
    if (p.latitude != null && p.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`;
    }
    const address = this.fullAddress();
    if (!address) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  });

  /** Próxima etapa: NEW→IN_PROGRESS, IN_PROGRESS→COMPLETED, si no, null. */
  readonly nextStatus = computed<MaintenanceStatus | null>(() => {
    switch (this.request().status) {
      case MaintenanceStatus.NEW:
        return MaintenanceStatus.IN_PROGRESS;
      case MaintenanceStatus.IN_PROGRESS:
        return MaintenanceStatus.COMPLETED;
      default:
        return null;
    }
  });

  constructor() {
    // El input requerido no puede leerse en el constructor; el effect corre
    // tras asignarse y recarga si se abre otra orden sin recrear el componente.
    effect(() => {
      const id = this.request().id;
      this.loadMessages(id);
    });
  }

  private loadMessages(requestId: number): void {
    this.isLoadingMessages.set(true);
    this.maintenance
      .getMessages(requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.isLoadingMessages.set(false);
          this.scrollVersion.update((v) => v + 1);
        },
        error: () => this.isLoadingMessages.set(false),
      });
  }

  advanceStage(): void {
    const next = this.nextStatus();
    if (!next) return;

    this.isAdvancing.set(true);
    this.maintenance
      .updateStatus(this.request().id, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.isAdvancing.set(false);
          const label =
            updated.status === MaintenanceStatus.IN_PROGRESS
              ? this.transloco.translate('vendorPortal.detail.started')
              : this.transloco.translate('vendorPortal.detail.completed');
          this.toast.success(label);
          this.statusAdvanced.emit(updated);
        },
        error: (err: unknown) => {
          this.isAdvancing.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('vendorPortal.detail.errorAdvance')),
          );
        },
      });
  }

  addFiles(files: File[]): void {
    const images = files.filter((f) => f.type.startsWith('image/'));
    this.selectedFiles.update((current) => [...current, ...images].slice(0, 3));
  }

  removeFileAt(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  onMessageSubmitted(text: string): void {
    const files = this.selectedFiles();
    if (!text.trim() && files.length === 0) return;

    this.isSendingNote.set(true);

    if (files.length > 0) {
      this.maintenance
        .uploadFiles(this.request().id, files)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (attachments) =>
            this.persistNote(
              text,
              attachments.map((a) => a.file_url),
            ),
          error: (err: unknown) => {
            this.isSendingNote.set(false);
            this.toast.error(
              getApiErrorMessage(err, this.transloco.translate('vendorPortal.detail.errorUpload')),
            );
          },
        });
    } else {
      this.persistNote(text, []);
    }
  }

  private persistNote(text: string, fileUrls: string[]): void {
    const dto: CreateMessageDto = {
      message: text,
      send_to_resident: true,
      ...(fileUrls.length > 0 && { files: fileUrls }),
    };
    this.maintenance
      .addMessage(this.request().id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          // Inserción optimista: agregar el mensaje devuelto (ya trae adjuntos)
          // sin recargar toda la lista, para no parpadear ni saltar el scroll.
          this.messages.update((msgs) => [...msgs, message]);
          this.selectedFiles.set([]);
          this.isSendingNote.set(false);
          this.sentVersion.update((version) => version + 1);
          this.scrollVersion.update((v) => v + 1);
        },
        error: (err: unknown) => {
          this.isSendingNote.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('vendorPortal.detail.errorNote')),
          );
        },
      });
  }
}
