import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { AppButtonComponent } from '../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../shared/ui/dialog/dialog.component';
import { AppEmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AppLoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AppPageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

import { getApiErrorMessage } from '../../core/http/http-error.util';
@Component({
  selector: 'app-employees',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'empleados', alias: 'employees' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    TranslocoModule,
    EmployeePanelComponent,
    CreateEmployeeDialogComponent,
    TenantDatePipe,
    AppButtonComponent,
    AppDialogComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent {
  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  // Icons
  readonly UserPlusIcon = UserPlus;
  readonly RefreshCwIcon = RefreshCw;
  readonly UserCogIcon = UserCog;

  // State
  employees = signal<Employee[]>([]);
  selectedEmployee = signal<Employee | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  isCreateDialogOpen = signal(false);
  editingEmployee = signal<Employee | null>(null);
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  isPanelOpen = computed(() => this.selectedEmployee() !== null);

  readonly filteredEmployees = computed(() => {
    const status = this.statusFilter();
    const list = this.employees();
    if (status === 'all') return list;
    const wantActive = status === 'active';
    return list.filter((employee) => employee.is_active === wantActive);
  });

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
          this.errorMessage.set(getApiErrorMessage(err, 'Error al cargar los empleados'));
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
    this.editingEmployee.set(null);
    this.isCreateDialogOpen.set(true);
  }

  openEditDialog(employee: Employee): void {
    this.editingEmployee.set(employee);
    this.isCreateDialogOpen.set(true);
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen.set(false);
    this.editingEmployee.set(null);
  }

  setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(status);
  }

  onEmployeeCreated(newEmployee: Employee): void {
    this.employees.update((list) => [...list, newEmployee]);
    this.closeCreateDialog();
    this.toast.success(
      this.transloco.translate('employees.createdSuccess', { name: newEmployee.name }),
    );
  }

  onEmployeeUpdated(updated: Employee): void {
    this.employees.update((list) =>
      list.map((employee) => (employee.id === updated.id ? { ...employee, ...updated } : employee)),
    );
    if (this.selectedEmployee()?.id === updated.id) {
      this.selectedEmployee.update((prev) => (prev ? { ...prev, ...updated } : prev));
    }
    this.closeCreateDialog();
    this.toast.success(
      this.transloco.translate('employees.updatedSuccess', { name: updated.name }),
    );
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
