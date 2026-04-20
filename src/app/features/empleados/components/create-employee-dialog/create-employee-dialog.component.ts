import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoScope } from '@jsverse/transloco';
import { EmployeesService } from '../../../../core/services/admin/employees.service';
import { SlugService } from '../../../../core/services/slug.service';
import type { Employee } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-create-employee-dialog',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'empleados', alias: 'employees' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslocoModule,
  ],
  templateUrl: './create-employee-dialog.component.html',
  styleUrl: './create-employee-dialog.component.scss',
})
export class CreateEmployeeDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateEmployeeDialogComponent>);
  private employeesService = inject(EmployeesService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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
            err.error?.message ?? this.transloco.translate('employees.dialog.createError'),
          );
          return EMPTY;
        }),
      )
      .subscribe((employee: Employee) => {
        this.isLoading.set(false);
        this.dialogRef.close(employee);
      });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
