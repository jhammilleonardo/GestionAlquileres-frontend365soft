import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { LucideAngularModule, Plus, Trash2 } from 'lucide-angular';

import type { ChartAccount, CreateJournalEntry } from '../../../../core/models/accounting.model';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent } from '../../../../shared/ui/select/select.component';
import type { AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';

/**
 * Diálogo de asiento contable manual (GJE). Permite líneas dinámicas debe/haber
 * sobre cuentas del plan y valida el cuadre en vivo antes de habilitar el guardado.
 * El backend revalida el balance exacto en centavos; aquí es solo guía de UX.
 */
@Component({
  selector: 'app-journal-entry-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    AppButtonComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextFieldComponent,
    TenantCurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './journal-entry-dialog.component.html',
  styleUrl: './journal-entry-dialog.component.scss',
})
export class JournalEntryDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  // Recalcula etiquetas al cargar el scope lazy o cambiar el idioma.
  private readonly translationsReady = toSignal(
    this.transloco.events$.pipe(
      filter((event) => event.type === 'translationLoadSuccess' || event.type === 'langChanged'),
    ),
  );

  readonly open = input(false);
  readonly accounts = input<ChartAccount[]>([]);
  readonly currency = input<string>('BOB');
  readonly saving = input(false);

  readonly closed = output<void>();
  readonly saved = output<CreateJournalEntry>();

  readonly Plus = Plus;
  readonly Trash2 = Trash2;

  readonly form = this.fb.group({
    entryDate: [new Date().toISOString().slice(0, 10), Validators.required],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    basis: ['accrual' as 'cash' | 'accrual', Validators.required],
    lines: this.fb.array([this.createLine(), this.createLine()]),
  });

  readonly basisOptions = computed<AppSelectOption<string>[]>(() => {
    this.translationsReady();
    return [
      { value: 'accrual', label: this.transloco.translate('accounting.journalEntry.basisAccrual') },
      { value: 'cash', label: this.transloco.translate('accounting.journalEntry.basisCash') },
    ];
  });

  readonly accountOptions = computed<AppSelectOption<string>[]>(() =>
    this.accounts()
      .filter((account) => account.is_active)
      .map((account) => ({
        value: account.code,
        label: `${account.code} · ${account.name}`,
      })),
  );

  // Recalcula los totales en cada cambio del formulario.
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly totalDebit = computed(() => {
    this.formValue();
    return this.sumColumn('debit');
  });

  readonly totalCredit = computed(() => {
    this.formValue();
    return this.sumColumn('credit');
  });

  readonly isBalanced = computed(() => {
    const debit = Math.round(this.totalDebit() * 100);
    const credit = Math.round(this.totalCredit() * 100);
    return debit === credit && debit > 0;
  });

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lines.length <= 2) return;
    this.lines.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid || !this.isBalanced()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const dto: CreateJournalEntry = {
      entryDate: raw.entryDate!,
      description: raw.description!,
      basis: raw.basis!,
      lines: (raw.lines as RawLine[]).map((line) => ({
        accountCode: line.accountCode,
        debit: this.toAmount(line.debit),
        credit: this.toAmount(line.credit),
        memo: line.memo?.trim() || undefined,
      })),
    };
    this.saved.emit(dto);
  }

  private createLine() {
    return this.fb.group({
      accountCode: ['', Validators.required],
      debit: [null as number | null],
      credit: [null as number | null],
      memo: [''],
    });
  }

  private sumColumn(column: 'debit' | 'credit'): number {
    return (this.form.getRawValue().lines as RawLine[]).reduce(
      (sum, line) => sum + (Number(line[column]) || 0),
      0,
    );
  }

  private toAmount(value: number | null): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }
}

interface RawLine {
  accountCode: string;
  debit: number | null;
  credit: number | null;
  memo: string;
}
