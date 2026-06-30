import {
  Component,
  inject,
  signal,
  effect,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { catchError, EMPTY } from 'rxjs';
import {
  LucideAngularModule,
  X,
  Shield,
  Eye,
  PenLine,
  Trash2,
  Plus,
  UserCheck,
  UserX,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { EmployeesService } from '../../../../core/services/admin/employees.service';
import { SlugService } from '../../../../core/services/slug.service';
import type {
  Employee,
  ModulePermission,
  AvailableModule,
} from '../../../../core/models/employee.model';
import { PERMISSION_MODULES, mergePermissions } from '../../../../core/models/employee.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

import { getApiErrorMessage } from '../../../../core/http/http-error.util';
@Component({
  selector: 'app-employee-panel',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'empleados', alias: 'employees' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TranslocoModule, AppButtonComponent],
  templateUrl: './employee-panel.component.html',
  styleUrl: './employee-panel.component.scss',
})
export class EmployeePanelComponent {
  employee = input.required<Employee>();
  panelClosed = output<void>();
  permissionsSaved = output<Employee>();
  employeeStatusChanged = output<Employee>();
  editRequested = output<Employee>();

  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  readonly XIcon = X;
  readonly ShieldIcon = Shield;
  readonly EyeIcon = Eye;
  readonly PenLineIcon = PenLine;
  readonly Trash2Icon = Trash2;
  readonly PlusIcon = Plus;
  readonly UserCheckIcon = UserCheck;
  readonly UserXIcon = UserX;

  isSaving = signal(false);
  isTogglingStatus = signal(false);
  permissions = signal<ModulePermission[]>([]);

  readonly PERMISSION_MODULES = PERMISSION_MODULES;

  constructor() {
    effect(() => {
      this.permissions.set(mergePermissions(this.employee().permissions));
    });
  }

  getPermission(moduleKey: AvailableModule): ModulePermission {
    return (
      this.permissions().find((p) => p.module === moduleKey) ?? {
        module: moduleKey,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      }
    );
  }

  toggleAction(
    moduleKey: AvailableModule,
    action: keyof Omit<ModulePermission, 'module'>,
    value: boolean,
  ): void {
    this.permissions.update((perms) =>
      perms.map((p) => {
        if (p.module !== moduleKey) return p;

        const updated = { ...p, [action]: value };

        if (action === 'can_view' && !value) {
          return { ...updated, can_create: false, can_edit: false, can_delete: false };
        }

        if (action !== 'can_view' && value) {
          return { ...updated, can_view: true };
        }

        return updated;
      }),
    );
  }

  toggleActionFromEvent(
    moduleKey: AvailableModule,
    action: keyof Omit<ModulePermission, 'module'>,
    event: Event,
  ): void {
    this.toggleAction(moduleKey, action, (event.target as HTMLInputElement).checked);
  }

  savePermissions(): void {
    this.isSaving.set(true);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .updatePermissions(slug, this.employee().id, this.permissions())
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isSaving.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('employees.panel.saveError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((updated) => {
        this.isSaving.set(false);
        this.toast.success(this.transloco.translate('employees.panel.saveSuccess'));
        this.permissionsSaved.emit(updated);
      });
  }

  async openDeactivateDialog(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.transloco.translate('employees.panel.confirmDeactivateTitle'),
      message: `${this.transloco.translate('employees.panel.confirmDeactivateMessage', {
        name: this.employee().name,
      })}\n${this.transloco.translate('employees.panel.confirmDeactivateWarning')}`,
      confirmLabel: this.transloco.translate('employees.panel.deactivate'),
      cancelLabel: this.transloco.translate('common.cancel'),
      variant: 'danger',
    });

    if (confirmed) {
      this.deactivate();
    }
  }

  private deactivate(): void {
    this.isTogglingStatus.set(true);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .remove(slug, this.employee().id)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isTogglingStatus.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('employees.panel.deactivateError')),
          );
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isTogglingStatus.set(false);
        this.toast.success(this.transloco.translate('employees.panel.deactivateSuccess'));
        this.employeeStatusChanged.emit({ ...this.employee(), is_active: false });
      });
  }

  activate(): void {
    this.isTogglingStatus.set(true);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .update(slug, this.employee().id, { is_active: true })
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isTogglingStatus.set(false);
          this.toast.error(
            getApiErrorMessage(err, this.transloco.translate('employees.panel.activateError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((updated) => {
        this.isTogglingStatus.set(false);
        this.toast.success(this.transloco.translate('employees.panel.activateSuccess'));
        this.employeeStatusChanged.emit(updated);
      });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
