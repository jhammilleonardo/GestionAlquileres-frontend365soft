import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule, provideTranslocoScope } from '@jsverse/transloco';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';

import { AvailabilityStatus } from '../../../core/services/reservation.service';

interface CalendarCell {
  date: Date | null;
  iso: string;
  status: AvailabilityStatus | 'past';
  inRange: boolean;
  isCheckin: boolean;
  isCheckout: boolean;
  disabled: boolean;
}

interface CalendarMonth {
  key: string;
  label: string;
  cells: CalendarCell[];
}

/**
 * Grilla visual de disponibilidad (dos meses, colores por estado, navegación y
 * selección de día). Componente presentacional puro: no consulta datos ni decide
 * la lógica de selección — recibe el mes visible, el mapa de disponibilidad y el
 * rango marcado, y emite la navegación y el día elegido. Lo comparten el
 * calendario de reserva del catálogo y el diálogo de extensión del portal.
 */
@Component({
  selector: 'app-availability-calendar-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, LucideAngularModule],
  providers: [provideTranslocoScope({ scope: 'portal-publico', alias: 'public' })],
  templateUrl: './availability-calendar-grid.component.html',
  styleUrl: './availability-calendar-grid.component.scss',
})
export class AvailabilityCalendarGridComponent {
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  readonly viewDate = input.required<Date>();
  readonly availability = input<Map<string, AvailabilityStatus>>(new Map());
  readonly checkin = input<Date | null>(null);
  readonly checkout = input<Date | null>(null);
  /** Fecha mínima seleccionable; los días anteriores quedan deshabilitados. */
  readonly minDate = input<Date | null>(null);
  readonly locale = input('es');
  /**
   * Si es true, el día marcado como `checkin` se pinta como "ancla" (un punto de
   * partida fijo, p. ej. la salida actual al extender) y no como un extremo
   * seleccionado por el usuario.
   */
  readonly anchorStart = input(false);

  readonly monthChange = output<number>();
  readonly daySelected = output<Date>();

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  readonly visibleMonths = computed<CalendarMonth[]>(() => {
    const first = this.monthStart(this.viewDate());
    const second = new Date(first.getFullYear(), first.getMonth() + 1, 1);
    return [first, second].map((monthDate) => ({
      key: this.monthKey(monthDate),
      label: this.formatMonth(monthDate),
      cells: this.buildCells(monthDate),
    }));
  });

  readonly monthRangeLabel = computed(() =>
    this.visibleMonths()
      .map((month) => month.label)
      .join(' - '),
  );

  onDayClick(cell: CalendarCell): void {
    if (cell.date && !cell.disabled) {
      this.daySelected.emit(cell.date);
    }
  }

  private buildCells(view: Date): CalendarCell[] {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    // Lunes = 0
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const floor = this.minDate();
    const ci = this.checkin();
    const co = this.checkout();
    const avail = this.availability();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < offset; i++) {
      cells.push({
        date: null,
        iso: `pad-${i}`,
        status: 'past',
        inRange: false,
        isCheckin: false,
        isCheckout: false,
        disabled: true,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = this.iso(date);
      let status: AvailabilityStatus | 'past' = avail.get(iso) ?? 'available';
      if (date < today) status = 'past';
      const beforeFloor = !!floor && date < floor;
      const disabled =
        beforeFloor || status === 'past' || status === 'blocked' || status === 'booked';
      cells.push({
        date,
        iso,
        status,
        inRange: !!ci && !!co && date > ci && date < co,
        isCheckin: !!ci && this.iso(ci) === iso,
        isCheckout: !!co && this.iso(co) === iso,
        disabled,
      });
    }
    return cells;
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private formatMonth(date: Date): string {
    return date.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
  }
}
