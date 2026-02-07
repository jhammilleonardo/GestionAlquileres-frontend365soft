import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div class="max-w-2xl w-full">
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="p-8">
            <div class="text-center mb-8">
              <div class="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">Registrar Organización</h1>
              <p class="text-gray-600 mt-2">Crea tu cuenta de administrador y organización</p>
            </div>

            <div *ngIf="errorMessage()" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ errorMessage() }}</p>
            </div>

            <form (ngSubmit)="register()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Organización *</label>
                  <input
                    type="text"
                    [(ngModel)]="companyName"
                    name="companyName"
                    required
                    placeholder="Mi Inmobiliaria S.A."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Slug (Identificador único)</label>
                  <input
                    type="text"
                    [(ngModel)]="slug"
                    name="slug"
                    placeholder="Se generará automáticamente si se deja vacío"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                  <p class="mt-1 text-xs text-gray-500">Ejemplo: mi-inmobiliaria (solo letras, números y guiones)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Tu Nombre *</label>
                  <input
                    type="text"
                    [(ngModel)]="name"
                    name="name"
                    required
                    placeholder="Juan Pérez"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    placeholder="admin@example.com"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    [(ngModel)]="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                  <p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    [(ngModel)]="phone"
                    name="phone"
                    placeholder="+5491112345678"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    [(ngModel)]="currency"
                    name="currency"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()">
                    <option value="USD">USD ($)</option>
                    <option value="BOB">BOB (Bs)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                  <select
                    [(ngModel)]="locale"
                    name="locale"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [disabled]="isLoading()">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6">
                <span *ngIf="!isLoading()">Crear Cuenta</span>
                <span *ngIf="isLoading()">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </span>
              </button>
            </form>

            <div class="mt-6 text-center">
              <button
                type="button"
                (click)="goToLogin()"
                class="text-blue-600 hover:text-blue-700 font-medium text-sm">
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>

          <div class="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              Al registrarte, aceptas nuestros términos de servicio y política de privacidad
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RegisterComponent {
  companyName = '';
  slug = '';
  name = '';
  email = '';
  password = '';
  phone = '';
  currency = 'USD';
  locale = 'es';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private router: Router
  ) { }

  register(): void {
    if (!this.companyName || !this.name || !this.email || !this.password) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const data = {
      company_name: this.companyName,
      slug: this.slug || undefined,
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone || undefined,
      currency: this.currency,
      locale: this.locale
    };

    this.authService.registerAdmin(data).subscribe({
      next: (response) => {
        // Configurar el slug del tenant en PropertyService
        this.propertyService.setTenantSlug(response.tenant.slug);

        this.isLoading.set(false);
        alert(`¡Organización "${response.tenant.company_name}" creada exitosamente!`);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Register error:', error);
        this.errorMessage.set(error.message || 'Error al registrar. Intenta nuevamente.');
        this.isLoading.set(false);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
