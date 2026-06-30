import {
  Component,
  inject,
  signal,
  computed,
  effect,
  input,
  ChangeDetectionStrategy,
  output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY } from 'rxjs';
import { TranslocoModule, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';

import { RentalOwnersService } from '../../../../core/services/admin/rental-owners.service';
import { SlugService } from '../../../../core/services/slug.service';
import type { RentalOwner, RentalOwnerSummary } from '../../../../core/models/rental-owner.model';
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

  /** Si se pasa un propietario, el diálogo opera en modo edición. */
  readonly editingOwner = input<RentalOwnerSummary | null>(null);

  ownerCreated = output<RentalOwner>();
  ownerUpdated = output<RentalOwner>();
  dialogClosed = output<void>();

  readonly isEdit = computed(() => this.editingOwner() !== null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    primary_email: ['', [Validators.required, Validators.email]],
    phone_number: ['', [Validators.required]],
    company_name: [''],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const owner = this.editingOwner();
      if (owner) {
        this.form.reset({
          name: owner.name,
          primary_email: owner.primary_email,
          phone_number: owner.phone_number,
          company_name: owner.company_name ?? '',
        });
      }
    });
  }

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
    const dto = {
      name,
      primary_email,
      phone_number,
      company_name: companyName || undefined,
      is_company: companyName.length > 0,
    };

    const editing = this.editingOwner();
    const request$ = editing
      ? this.rentalOwnersService.update(slug, editing.id, dto)
      : this.rentalOwnersService.create(slug, dto);

    request$
      .pipe(
        catchError((err: { error?: { message?: string } }) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            getApiErrorMessage(
              err,
              this.transloco.translate(
                editing ? 'rentalOwners.dialog.updateError' : 'rentalOwners.dialog.createError',
              ),
            ),
          );
          return EMPTY;
        }),
      )
      .subscribe((owner: RentalOwner) => {
        this.isLoading.set(false);
        if (editing) {
          this.ownerUpdated.emit(owner);
        } else {
          this.ownerCreated.emit(owner);
        }
      });
  }

  cancel(): void {
    this.dialogClosed.emit();
  }
}
