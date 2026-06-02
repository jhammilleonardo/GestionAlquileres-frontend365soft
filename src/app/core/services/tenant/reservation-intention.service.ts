import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SlugService } from '../slug.service';

export interface ReservationIntention {
  propertyId: number;
  propertyTitle: string;
  unitId: number;
  unitNumber?: string;
  checkinDate: string;
  checkoutDate: string;
  timestamp: string;
}

type ReservationIntentionInput = Omit<ReservationIntention, 'timestamp'>;

@Injectable({
  providedIn: 'root',
})
export class ReservationIntentionService {
  private readonly router = inject(Router);
  private readonly slugService = inject(SlugService);
  private readonly storageKey = 'reservation_intention';
  private readonly maxAgeHours = 24;

  readonly intention = signal<ReservationIntention | null>(null);
  readonly hasIntention = computed(() => this.intention() !== null);

  constructor() {
    this.loadIntention();
  }

  setIntention(input: ReservationIntentionInput): void {
    const intention: ReservationIntention = {
      ...input,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(intention));
    this.intention.set(intention);
  }

  getIntention(): ReservationIntention | null {
    return this.intention();
  }

  clearIntention(): void {
    localStorage.removeItem(this.storageKey);
    this.intention.set(null);
  }

  navigateToLogin(slug: string): void {
    void this.router.navigate(['/', slug, 'login'], {
      queryParams: { reservation: 'true' },
    });
  }

  navigateToRegister(slug: string): void {
    void this.router.navigate(['/', slug, 'register'], {
      queryParams: { reservation: 'true' },
    });
  }

  navigateToReservation(slug: string): void {
    this.slugService.setSlug(slug);
    void this.router.navigate(['/', slug, 'portal', 'new-application'], {
      queryParams: { reservation: 'true' },
      replaceUrl: true,
    });
  }

  private loadIntention(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;

      const intention = JSON.parse(stored) as Partial<ReservationIntention>;
      if (!this.isValidIntention(intention)) {
        this.clearIntention();
        return;
      }

      const createdAt = new Date(intention.timestamp);
      const ageHours = (Date.now() - createdAt.getTime()) / 3_600_000;
      if (!Number.isFinite(ageHours) || ageHours > this.maxAgeHours) {
        this.clearIntention();
        return;
      }

      this.intention.set(intention);
    } catch {
      this.clearIntention();
    }
  }

  private isValidIntention(value: Partial<ReservationIntention>): value is ReservationIntention {
    return (
      typeof value.propertyId === 'number' &&
      value.propertyId > 0 &&
      typeof value.propertyTitle === 'string' &&
      value.propertyTitle.trim().length > 0 &&
      typeof value.unitId === 'number' &&
      value.unitId > 0 &&
      this.isIsoDate(value.checkinDate) &&
      this.isIsoDate(value.checkoutDate) &&
      typeof value.timestamp === 'string'
    );
  }

  private isIsoDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
