import { Component, inject, signal, ChangeDetectionStrategy, output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY } from 'rxjs';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { RentalOwnersService } from '../../../../core/services/admin/rental-owners.service';
import { SlugService } from '../../../../core/services/slug.service';
import type { RentalOwner } from '../../../../core/models/rental-owner.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';
import { getApiErrorMessage } from '../../../../core/http/http-error.util';

@Component({
  selector: 'app-create-owner-dialog',
  standalone: true,
  providers: [provideTranslocoScope({ scope: 'propietarios', alias: 'rentalOwners' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule, AppButtonComponent, AppTextFieldComponent],
  templateUrl: './create-owner-dialog.component.html',
  styleUrl: './create-owner-dialog.component.scss',
})
export class CreateOwnerDialogComponent {
  private fb = inject(FormBuilder);
  private rentalOwnersService = inject(RentalOwnersService);
  private slugService = inject(SlugService);
  private transloco = inject(TranslocoService);

  ownerCreated = output<RentalOwner>();
  dialogClosed = output<void>();

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    primary_email: ['', [Validators.required, Validators.email]],
    phone_number: ['', [Validators.required]],
    company_name: [''],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, primary_email, phone_number, company_name } = this.form.getRawValue();
    const slug = this.slugService.getSlug()!;
    const companyName = company_name.trim();

    this.rentalOwnersService
      .create(slug, {
        name,
        primary_email,
        phone_number,
        company_name: companyName || undefined,
        is_company: companyName.length > 0,
      })
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(err, this.transloco.translate('rentalOwners.dialog.createError')),
          );
          return EMPTY;
        }),
      )
      .subscribe((owner: RentalOwner) => {
        this.isLoading.set(false);
        this.ownerCreated.emit(owner);
      });
  }

  cancel(): void {
    this.dialogClosed.emit();
  }
}
