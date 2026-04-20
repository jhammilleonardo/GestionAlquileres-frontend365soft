import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, UserPlus, RefreshCw, UserCog } from 'lucide-angular';
import { catchError, EMPTY } from 'rxjs';
import { EmployeesService } from '../../core/services/admin/employees.service';
import { SlugService } from '../../core/services/slug.service';
import type { Employee } from '../../core/models/employee.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { EmployeePanelComponent } from './components/employee-panel/employee-panel.component';
import { CreateEmployeeDialogComponent } from './components/create-employee-dialog/create-employee-dialog.component';
import { TenantDatePipe } from '../../shared/pipes/tenant-date.pipe';

@Component({
  selector: 'app-empleados',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'empleados', alias: 'employees' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LucideAngularModule,
    TranslocoModule,
    EmployeePanelComponent,
    TenantDatePipe,
  ],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.scss',
})
export class EmpleadosComponent {
  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  // Icons
  readonly UserPlusIcon = UserPlus;
  readonly RefreshCwIcon = RefreshCw;
  readonly UserCogIcon = UserCog;

  // State
  employees = signal<Employee[]>([]);
  selectedEmployee = signal<Employee | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  isPanelOpen = computed(() => this.selectedEmployee() !== null);

  readonly displayedColumns = ['avatar', 'name', 'email', 'status', 'lastConnection', 'actions'];

  constructor() {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .findAll(slug)
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message ?? 'Error al cargar los empleados');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.employees.set(list);
        this.isLoading.set(false);
      });
  }

  selectEmployee(employee: Employee): void {
    // Toggle: si se hace click en el mismo, cierra el panel
    if (this.selectedEmployee()?.id === employee.id) {
      this.selectedEmployee.set(null);
    } else {
      this.selectedEmployee.set(employee);
    }
  }

  closePanel(): void {
    this.selectedEmployee.set(null);
  }

  onPermissionsSaved(updated: Employee): void {
    this.employees.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    this.selectedEmployee.set(updated);
  }

  onEmployeeStatusChanged(updated: Employee): void {
    this.employees.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
    this.selectedEmployee.set(updated);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateEmployeeDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((newEmployee: Employee | null) => {
      if (!newEmployee) return;
      this.employees.update((list) => [...list, newEmployee]);
      this.snackBar.open(
        this.transloco.translate('employees.createdSuccess', { name: newEmployee.name }),
        undefined,
        { duration: 3000, panelClass: ['snack-success'] },
      );
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
