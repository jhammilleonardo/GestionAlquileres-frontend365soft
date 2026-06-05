import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, ChevronLeft, ChevronRight, Lock, LockOpen } from 'lucide-angular';

import {
  AvailabilityStatus,
  ReservationService,
} from '../../../../core/services/reservation.service';
import { Unit } from '../../../../core/models/unit.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { getApiErrorMessage } from '../../../../core/http/http-error.util';

interface CalendarCell {
  date: Date | null;
  iso: string;
  status: AvailabilityStatus | 'past';
  selected: boolean;
}

/**
 * Panel admin para bloquear/desbloquear fechas de una unidad de alquiler de
 * corto plazo. Las fechas bloqueadas dejan de estar disponibles en el catálogo.
 */
@Component({
  selector: 'app-block-dates-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, AppDialogComponent, AppButtonComponent, TranslocoPipe],
  templateUrl: './block-dates-dialog.component.html',
  styleUrl: './block-dates-dialog.component.scss',
})
export class BlockDatesDialogComponent {
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Lock = Lock;
  readonly LockOpen = LockOpen;

  readonly open = input(false);
  readonly propertyId = input.required<number>();
  readonly unit = input<Unit | null>(null);

  readonly closed = output<void>();
  readonly changed = output<void>();

  private readonly reservationService = inject(ReservationService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  readonly viewDate = signal(new Date());
  readonly availability = signal<Map<string, AvailabilityStatus>>(new Map());
  readonly selected = signal<Set<string>>(new Set());
  readonly loading = signal(false);
  readonly submitting = signal(false);

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  readonly monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('es', { month: 'long', year: 'numeric' }),
  );

  readonly selectedCount = computed(() => this.selected().size);

  readonly cells = computed<CalendarCell[]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const avail = this.availability();
    const selected = this.selected();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < offset; i++) {
      cells.push({ date: null, iso: `pad-${i}`, status: 'past', selected: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = this.iso(date);
      let status: AvailabilityStatus | 'past' = avail.get(iso) ?? 'available';
      if (date < today) status = 'past';
      cells.push({ date, iso, status, selected: selected.has(iso) });
    }
    return cells;
  });

  constructor() {
    // Cargar el mes cada vez que se abre el diálogo con una unidad válida.
    effect(() => {
      if (this.open() && this.unit()) {
        this.viewDate.set(new Date());
        this.selected.set(new Set());
        this.loadMonth();
      }
    });
  }

  private iso(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  loadMonth(): void {
    const unit = this.unit();
    if (!unit) return;
    const view = this.viewDate();
    const month = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`;
    this.loading.set(true);
    this.reservationService.getAvailability(this.propertyId(), month, unit.id).subscribe({
      next: (days) => {
        this.availability.set(new Map(days.map((d) => [d.date.slice(0, 10), d.status])));
        this.loading.set(false);
      },
      error: () => {
        this.availability.set(new Map());
        this.loading.set(false);
      },
    });
  }

  prevMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
    this.loadMonth();
  }

  nextMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
    this.loadMonth();
  }

  toggleDay(cell: CalendarCell): void {
    // No se pueden seleccionar días pasados ni con reserva confirmada.
    if (!cell.date || cell.status === 'past' || cell.status === 'booked') {
      return;
    }
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(cell.iso)) {
        next.delete(cell.iso);
      } else {
        next.add(cell.iso);
      }
      return next;
    });
  }

  apply(block: boolean): void {
    const unit = this.unit();
    const dates = Array.from(this.selected());
    if (!unit || dates.length === 0) return;
    this.submitting.set(true);
    this.reservationService.blockDates(this.propertyId(), unit.id, dates, block).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(
          this.transloco.translate(
            block ? 'propiedades.units.datesBlocked' : 'propiedades.units.datesUnblocked',
          ),
        );
        this.selected.set(new Set());
        this.loadMonth();
        this.changed.emit();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.toast.error(
          getApiErrorMessage(err, this.transloco.translate('propiedades.units.datesUpdateError')),
        );
      },
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
