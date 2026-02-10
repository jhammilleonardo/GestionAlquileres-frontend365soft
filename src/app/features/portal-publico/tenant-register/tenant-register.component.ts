import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SlugService } from '../../../core/services/slug.service';

interface RegisterResponse {
  access_token?: string;
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  tenant_id: number;
  created_at: string;
}

@Component({
  selector: 'app-tenant-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenant-register.component.html',
  styleUrls: ['./tenant-register.component.scss']
})
export class TenantRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private slugService = inject(SlugService);

  registerForm: FormGroup;
  slug: string | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get slug from URL
    this.slug = this.route.snapshot.paramMap.get('slug');

    if (!this.slug) {
      this.errorMessage = 'No se pudo identificar la organización. Por favor, use un enlace válido.';
      return;
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.slug) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { name, email, password, phone } = this.registerForm.value;

    this.http.post<RegisterResponse>(
      `${environment.apiUrl}auth/${this.slug}/register`,
      { name, email, password, phone }
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Set slug in SlugService
        this.slugService.setSlug(this.slug);

        // If API returns access_token, save it and redirect to dashboard
        if (response.access_token) {
          // Save token and user data
          localStorage.setItem('tenant_access_token', response.access_token);
          localStorage.setItem('tenant_user', JSON.stringify(response));

          this.successMessage = '¡Registro exitoso! Redirigiendo a tu panel...';

          // Redirect to tenant dashboard after 1 second
          setTimeout(() => {
            this.router.navigate(['/', this.slug, 'portal', 'dashboard']);
          }, 1000);
        } else {
          // No token returned, redirect to login
          this.successMessage = '¡Registro exitoso! Ahora puedes iniciar sesión.';

          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/', this.slug, 'login'], {
              queryParams: { registered: 'true' }
            });
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al registrarse. Por favor, intenta nuevamente.';
      }
    });
  }

  goToLogin(): void {
    if (this.slug) {
      this.router.navigate(['/', this.slug, 'login']);
    }
  }
}
