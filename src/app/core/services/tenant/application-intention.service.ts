import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SlugService } from '../slug.service';

/**
 * Servicio para gestionar la intención de aplicar a una propiedad
 * Se usa para guardar la propiedad seleccionada antes del login/registro
 * y recuperarla después de que el usuario se autentique
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationIntentionService {
  private readonly INTENTION_KEY = 'application_intention';

  // Signals para reactitud
  readonly hasIntention = signal<boolean>(false);
  readonly intendedPropertyId = signal<number | null>(null);
  readonly intendedPropertyTitle = signal<string | null>(null);

  constructor(
    private router: Router,
    private slugService: SlugService,
  ) {
    // Cargar intención guardada al iniciar
    this.loadIntention();
  }

  /**
   * Guardar la intención de aplicar a una propiedad
   */
  setIntention(propertyId: number, propertyTitle: string): void {
    const intention = {
      propertyId,
      propertyTitle,
      timestamp: new Date().toISOString(),
    };

    // Guardar en localStorage
    localStorage.setItem(this.INTENTION_KEY, JSON.stringify(intention));

    // Actualizar signals
    this.intendedPropertyId.set(propertyId);
    this.intendedPropertyTitle.set(propertyTitle);
    this.hasIntention.set(true);
  }

  /**
   * Obtener la intención guardada
   */
  getIntention(): { propertyId: number; propertyTitle: string } | null {
    const propertyId = this.intendedPropertyId();
    const propertyTitle = this.intendedPropertyTitle();

    if (propertyId && propertyTitle) {
      return { propertyId, propertyTitle };
    }

    return null;
  }

  /**
   * Limpiar la intención después de usarla
   */
  clearIntention(): void {
    localStorage.removeItem(this.INTENTION_KEY);
    this.intendedPropertyId.set(null);
    this.intendedPropertyTitle.set(null);
    this.hasIntention.set(false);
  }

  /**
   * Redirigir al formulario de aplicación con la intención guardada
   */
  navigateToApplication(_slug: string): void {
    const intention = this.getIntention();

    if (intention) {
      // Redirigir al wizard de aplicación con la propiedad
      this.slugService.navigateTo([
        'portal',
        'application-wizard',
        intention.propertyId.toString(),
      ]);
    } else {
      // Si no hay intención, redirigir al catálogo de nuevas aplicaciones
      this.slugService.navigateTo(['portal', 'new-application']);
    }
  }

  /**
   * Redirigir al login guardando la intención
   */
  navigateToLoginWithIntention(slug: string, propertyId: number, propertyTitle: string): void {
    this.setIntention(propertyId, propertyTitle);
    this.slugService.navigateTo(['portal', 'login']);
  }

  /**
   * Cargar intención desde localStorage
   */
  private loadIntention(): void {
    try {
      const stored = localStorage.getItem(this.INTENTION_KEY);

      if (stored) {
        const intention = JSON.parse(stored);

        // Verificar que la intención no sea muy vieja (24 horas máximo)
        const intentionTime = new Date(intention.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - intentionTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          this.intendedPropertyId.set(intention.propertyId);
          this.intendedPropertyTitle.set(intention.propertyTitle);
          this.hasIntention.set(true);
        } else {
          // Intención expirada, limpiar
          this.clearIntention();
        }
      }
    } catch {
      this.clearIntention();
    }
  }
}
