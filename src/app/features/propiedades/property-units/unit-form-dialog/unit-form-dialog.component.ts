import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule, X, Save, Building2 } from 'lucide-angular';
import { UnitService } from '../../../../core/services/admin/unit.service';
import { Unit, UnitStatus, RentalType, UnitDialogData } from '../../../../core/models/unit.model';

@Component({
  selector: 'app-unit-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LucideAngularModule,
  ],
  templateUrl: './unit-form-dialog.component.html',
  styleUrls: ['./unit-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitFormDialogComponent {
  readonly X = X;
  readonly Save = Save;
  readonly Building2 = Building2;

  readonly UnitStatus = UnitStatus;
  readonly RentalType = RentalType;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UnitFormDialogComponent>);
  readonly data: UnitDialogData = inject(MAT_DIALOG_DATA);
  private unitService = inject(UnitService);
  private snackBar = inject(MatSnackBar);

  isSaving = signal(false);
  isEditMode = computed(() => !!this.data.unit);

  form = this.fb.group({
    unit_number: [
      this.data.unit?.unit_number ?? '',
      [Validators.required, Validators.maxLength(20)],
    ],
    floor: [this.data.unit?.floor ?? (null as number | null)],
    bedrooms: [this.data.unit?.bedrooms ?? (null as number | null), [Validators.min(0)]],
    bathrooms: [this.data.unit?.bathrooms ?? (null as number | null), [Validators.min(0)]],
    square_meters: [this.data.unit?.square_meters ?? (null as number | null), [Validators.min(1)]],
    status: [this.data.unit?.status ?? UnitStatus.AVAILABLE, [Validators.required]],
    rental_type: [this.data.unit?.rental_type ?? (null as RentalType | null)],
    price_per_month: [
      this.data.unit?.price_per_month ?? (null as number | null),
      [Validators.min(0)],
    ],
    price_per_night: [
      this.data.unit?.price_per_night ?? (null as number | null),
      [Validators.min(0)],
    ],
    deposit_amount: [
      this.data.unit?.deposit_amount ?? (null as number | null),
      [Validators.min(0)],
    ],
  });

  get statusOptions() {
    return [
      { value: UnitStatus.AVAILABLE, label: 'Disponible' },
      { value: UnitStatus.OCCUPIED, label: 'Ocupada' },
      { value: UnitStatus.MAINTENANCE, label: 'Mantenimiento' },
      { value: UnitStatus.RESERVED, label: 'Reservada' },
    ];
  }

  get rentalTypeOptions() {
    return [
      { value: RentalType.LONG_TERM, label: 'Largo Plazo' },
      { value: RentalType.SHORT_TERM, label: 'Corto Plazo' },
      { value: RentalType.BOTH, label: 'Ambos' },
    ];
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();

    const dto = {
      unit_number: raw.unit_number!,
      floor: raw.floor ?? undefined,
      bedrooms: raw.bedrooms ?? undefined,
      bathrooms: raw.bathrooms ?? undefined,
      square_meters: raw.square_meters ?? undefined,
      status: raw.status as UnitStatus,
      rental_type: raw.rental_type ?? undefined,
      price_per_month: raw.price_per_month ?? undefined,
      price_per_night: raw.price_per_night ?? undefined,
      deposit_amount: raw.deposit_amount ?? undefined,
    };

    const request$ = this.isEditMode()
      ? this.unitService.update(this.data.propertyId, this.data.unit!.id, dto)
      : this.unitService.create(this.data.propertyId, dto);

    request$.subscribe({
      next: (unit: Unit) => {
        this.isSaving.set(false);
        this.dialogRef.close(unit);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        const msg = err?.error?.message ?? 'Error al guardar la unidad';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
