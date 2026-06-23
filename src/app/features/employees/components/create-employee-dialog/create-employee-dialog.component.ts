import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { EmployeesService } from '../../../../core/services/admin/employees.service';
import { SlugService } from '../../../../core/services/slug.service';
import type { Employee } from '../../../../core/models/employee.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

import { getApiErrorMessage } from '../../../../core/http/http-error.util';
@Component({
  selector: 'app-create-employee-dialog',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'empleados', alias: 'employees' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule, AppButtonComponent, AppTextFieldComponent],
  templateUrl: './create-employee-dialog.component.html',
  styleUrl: './create-employee-dialog.component.scss',
})
export class CreateEmployeeDialogComponent {
  private fb = inject(FormBuilder);
  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  employeeCreated = output<Employee>();
  dialogClosed = output<void>();

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password, phone } = this.form.getRawValue();
    const slug = this.slugService.getSlug()!;

    this.employeesService
      .create(slug, { name, email, password, phone: phone || undefined })
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(err, this.transloco.translate('employees.dialog.createError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((employee: Employee) => {
        this.isLoading.set(false);
        this.employeeCreated.emit(employee);
      });
  }

  cancel(): void {
    this.dialogClosed.emit();
  }
}
