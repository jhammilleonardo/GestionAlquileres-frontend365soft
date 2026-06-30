import { TestBed } from '@angular/core/testing';
import { AppLedgerTableComponent, AppLedgerLine } from './ledger-table.component';
import { FormatService } from '../../../core/services/format.service';

describe('AppLedgerTableComponent', () => {
  function mount(lines: AppLedgerLine[]) {
    TestBed.configureTestingModule({
      imports: [AppLedgerTableComponent],
      providers: [
        {
          provide: FormatService,
          useValue: { formatCurrency: (v: number) => `$${v}` },
        },
      ],
    });
    const fixture = TestBed.createComponent(AppLedgerTableComponent);
    fixture.componentRef.setInput('lines', lines);
    fixture.componentRef.setInput('emptyLabel', 'Sin movimientos');
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el mensaje vacío cuando no hay líneas', () => {
    const fixture = mount([]);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ledger-empty')?.textContent).toContain('Sin movimientos');
    expect(el.querySelector('table')).toBeNull();
  });

  it('renderiza una fila por línea de movimiento', () => {
    const fixture = mount([
      { date: '2026-01-05', concept: 'RENT', amount: 100, balance: 100 },
      { date: '2026-02-05', concept: 'RENT', amount: 50, balance: 150 },
    ]);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
  });
});
