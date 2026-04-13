import {
  Component,
  inject,
  signal,
  effect,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { EmployeesService } from '../../../../core/services/admin/employees.service';
import { SlugService } from '../../../../core/services/slug.service';
import type {
  Employee,
  ModulePermission,
  AvailableModule,
} from '../../../../core/models/employee.model';
import { PERMISSION_MODULES, mergePermissions } from '../../../../core/models/employee.model';

/** Diálogo de confirmación para desactivar un empleado */
@Component({
  selector: 'app-confirm-deactivate-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Desactivar empleado</h2>
    <mat-dialog-content>
      <p>
        ¿Desactivar a <strong>{{ data.name }}</strong
        >?
      </p>
      <p class="warning-text">El empleado ya no podrá acceder al sistema.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Desactivar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning-text {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
      mat-dialog-content {
        min-width: min(360px, 90vw);
      }
    `,
  ],
})
export class ConfirmDeactivateDialogComponent {
  data = inject<{ name: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-employee-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    LucideAngularModule,
  ],
  templateUrl: './employee-panel.component.html',
  styleUrl: './employee-panel.component.scss',
})
export class EmployeePanelComponent {
  // Inputs / Outputs
  employee = input.required<Employee>();
  panelClosed = output<void>();
  permissionsSaved = output<Employee>();
  employeeStatusChanged = output<Employee>();

  // Services
  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Icons
  readonly XIcon = X;
  readonly ShieldIcon = Shield;
  readonly EyeIcon = Eye;
  readonly PenLineIcon = PenLine;
  readonly Trash2Icon = Trash2;
  readonly PlusIcon = Plus;
  readonly UserCheckIcon = UserCheck;
  readonly UserXIcon = UserX;

  // State
  isSaving = signal(false);
  isTogglingStatus = signal(false);
  permissions = signal<ModulePermission[]>([]);

  readonly PERMISSION_MODULES = PERMISSION_MODULES;

  constructor() {
    // Sincronizar permisos locales cuando cambia el empleado recibido
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

        // Desactivar can_view → deshabilita todas las otras acciones
        if (action === 'can_view' && !value) {
          return { ...updated, can_create: false, can_edit: false, can_delete: false };
        }

        // Activar cualquier otra acción → activa can_view automáticamente
        if (action !== 'can_view' && value) {
          return { ...updated, can_view: true };
        }

        return updated;
      }),
    );
  }

  savePermissions(): void {
    this.isSaving.set(true);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .updatePermissions(slug, this.employee().id, this.permissions())
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isSaving.set(false);
          this.snackBar.open(err.error?.message ?? 'Error al guardar los permisos', 'Cerrar', {
            duration: 4000,
          });
          return EMPTY;
        }),
      )
      .subscribe((updated) => {
        this.isSaving.set(false);
        this.snackBar.open('Permisos actualizados', undefined, {
          duration: 3000,
          panelClass: ['snack-success'],
        });
        this.permissionsSaved.emit(updated);
      });
  }

  openDeactivateDialog(): void {
    const ref = this.dialog.open(ConfirmDeactivateDialogComponent, {
      data: { name: this.employee().name },
      width: '400px',
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.deactivate();
    });
  }

  private deactivate(): void {
    this.isTogglingStatus.set(true);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .remove(slug, this.employee().id)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isTogglingStatus.set(false);
          this.snackBar.open(err.error?.message ?? 'Error al desactivar', 'Cerrar', {
            duration: 4000,
          });
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isTogglingStatus.set(false);
        this.snackBar.open('Empleado desactivado', undefined, {
          duration: 3000,
          panelClass: ['snack-success'],
        });
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
          this.snackBar.open(err.error?.message ?? 'Error al activar', 'Cerrar', {
            duration: 4000,
          });
          return EMPTY;
        }),
      )
      .subscribe((updated) => {
        this.isTogglingStatus.set(false);
        this.snackBar.open('Empleado activado', undefined, {
          duration: 3000,
          panelClass: ['snack-success'],
        });
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
