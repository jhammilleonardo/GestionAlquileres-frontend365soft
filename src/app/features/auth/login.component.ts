import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div class="max-w-md w-full">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div class="p-8">
            <!-- Logo & Title -->
            <div class="text-center mb-8">
              <div class="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">Gestión de Alquileres</h1>
              <p class="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage()" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ errorMessage() }}</p>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="login()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Tenant / Organización
                </label>
                <input
                  type="text"
                  [(ngModel)]="slug"
                  name="slug"
                  required
                  placeholder="mi-inmobiliaria"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [disabled]="isLoading()" />
                <p class="mt-1 text-xs text-gray-500">El identificador de tu organización</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="admin@example.com"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [disabled]="isLoading()" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  [disabled]="isLoading()" />
              </div>

              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span *ngIf="!isLoading()">Iniciar Sesión</span>
                <span *ngIf="isLoading()">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando...
                </span>
              </button>
            </form>

            <!-- Divider -->
            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">¿Primera vez aquí?</span>
              </div>
            </div>

            <!-- Register Link -->
            <div class="text-center">
              <button
                type="button"
                (click)="goToRegister()"
                class="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Registrar nueva organización
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              Sistema de Gestión de Alquileres - 365 Soft © 2026
            </p>
          </div>
        </div>

        <!-- Quick Access Info -->
        <div class="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p class="text-white text-sm text-center">
            💡 <strong>Desarrollo:</strong> Usa slug: "mi-inmobiliaria" para testing
          </p>
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
export class LoginComponent {
  slug = 'mi-inmobiliaria';
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private router: Router
  ) { }

  login(): void {
    if (!this.slug || !this.email || !this.password) {
      this.errorMessage.set('Por favor complete todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.slug, this.email, this.password).subscribe({
      next: (response) => {
        // Configurar el slug del tenant en PropertyService
        this.propertyService.setTenantSlug(this.slug);

        this.isLoading.set(false);
        // Redirigir a la ruta correcta con el slug del tenant
        this.router.navigate([`/${this.slug}/admin/dashboard`]);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage.set(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        this.isLoading.set(false);
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
