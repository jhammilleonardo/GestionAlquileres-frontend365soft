import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { JournalEntryDialogComponent } from './journal-entry-dialog.component';
import type { CreateJournalEntry } from '../../../../core/models/accounting.model';

describe('JournalEntryDialogComponent', () => {
  function build(): JournalEntryDialogComponent {
    TestBed.configureTestingModule({
      imports: [JournalEntryDialogComponent],
      providers: [
        { provide: TranslocoService, useValue: { translate: (k: string) => k, events$: EMPTY } },
      ],
    }).overrideComponent(JournalEntryDialogComponent, { set: { template: '' } });
    return TestBed.createComponent(JournalEntryDialogComponent).componentInstance;
  }

  function fillLine(
    component: JournalEntryDialogComponent,
    i: number,
    code: string,
    field: 'debit' | 'credit',
    amount: number,
  ): void {
    const line = component.lines.at(i);
    line.get('accountCode')?.setValue(code);
    line.get(field)?.setValue(amount);
  }

  it('arranca con 2 líneas y descuadrado', () => {
    const component = build();
    expect(component.lines.length).toBe(2);
    expect(component.isBalanced()).toBe(false);
  });

  it('detecta el cuadre cuando debe = haber', () => {
    const component = build();
    fillLine(component, 0, '1100', 'debit', 100);
    fillLine(component, 1, '4100', 'credit', 100);
    expect(component.totalDebit()).toBe(100);
    expect(component.totalCredit()).toBe(100);
    expect(component.isBalanced()).toBe(true);
  });

  it('no permite quitar por debajo de 2 líneas y agrega/quita por encima', () => {
    const component = build();
    component.removeLine(0);
    expect(component.lines.length).toBe(2);
    component.addLine();
    expect(component.lines.length).toBe(3);
    component.removeLine(2);
    expect(component.lines.length).toBe(2);
  });

  it('submit emite el asiento cuando está cuadrado', () => {
    const component = build();
    component.form.get('description')?.setValue('Ajuste');
    fillLine(component, 0, '1100', 'debit', 100);
    fillLine(component, 1, '4100', 'credit', 100);

    let emitted: CreateJournalEntry | undefined;
    component.saved.subscribe((dto) => (emitted = dto));
    component.submit();

    expect(emitted).toBeDefined();
    expect(emitted?.description).toBe('Ajuste');
    expect(emitted?.lines).toEqual([
      { accountCode: '1100', debit: 100, credit: undefined, memo: undefined },
      { accountCode: '4100', debit: undefined, credit: 100, memo: undefined },
    ]);
  });

  it('submit NO emite si está descuadrado', () => {
    const component = build();
    component.form.get('description')?.setValue('Ajuste');
    fillLine(component, 0, '1100', 'debit', 100);
    fillLine(component, 1, '4100', 'credit', 90);

    const saved = vi.fn();
    component.saved.subscribe(saved);
    component.submit();

    expect(saved).not.toHaveBeenCalled();
  });
});
