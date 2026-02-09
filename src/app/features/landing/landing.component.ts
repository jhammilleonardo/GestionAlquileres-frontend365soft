import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule, Building2, Users, BarChart3, Shield, CheckCircle, ArrowRight, LogIn } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    LucideAngularModule
  ],
  template: `
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <div class="logo">
            <lucide-icon [img]="Building2" [size]="64"></lucide-icon>
          </div>
          <h1>365Soft</h1>
          <h2>Sistema de Gestión de Alquileres</h2>
          <p class="hero-description">
            La solución completa para administrar propiedades, inquilinos, contratos y pagos
            de manera eficiente y profesional.
          </p>
          <div class="hero-actions">
            <button
              mat-raised-button
              color="primary"
              size="large"
              routerLink="/register"
              class="cta-button">
              <span>Comenzar Gratis</span>
              <lucide-icon [img]="ArrowRight" [size]="20"></lucide-icon>
            </button>
            <button
              mat-stroked-button
              size="large"
              routerLink="/login"
              class="login-button">
              <lucide-icon [img]="LogIn" [size]="20"></lucide-icon>
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="dashboard-preview">
            <div class="preview-header">
              <div class="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="preview-content">
              <div class="chart-mock">
                <div class="bar" style="height: 60%"></div>
                <div class="bar" style="height: 80%"></div>
                <div class="bar" style="height: 45%"></div>
                <div class="bar" style="height: 90%"></div>
                <div class="bar" style="height: 70%"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="section-header">
          <h2>Todo lo que necesitas en un solo lugar</h2>
          <p>Herramientas poderosas para gestionar tu negocio inmobiliario</p>
        </div>

        <div class="features-grid">
          <mat-card class="feature-card">
            <mat-card-content>
              <div class="feature-icon">
                <lucide-icon [img]="Building2" [size]="32"></lucide-icon>
              </div>
              <h3>Gestión de Propiedades</h3>
              <p>Administra todas tus propiedades con información detallada, imágenes y documentación completa.</p>
              <ul class="feature-list">
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Catálogo digital</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Control de disponibilidad</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Historial de ocupación</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <div class="feature-icon">
                <lucide-icon [img]="Users" [size]="32"></lucide-icon>
              </div>
              <h3>Portal de Inquilinos</h3>
              <p>Tus inquilinos pueden acceder a su portal personal para ver pagos, documentos y solicitar mantenimiento.</p>
              <ul class="feature-list">
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Acceso 24/7</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Comunicación directa</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Documentos en línea</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <div class="feature-icon">
                <lucide-icon [img]="BarChart3" [size]="32"></lucide-icon>
              </div>
              <h3>Reportes y Métricas</h3>
              <p>Visualiza el rendimiento de tu negocio con dashboards interactivos y reportes detallados.</p>
              <ul class="feature-list">
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Ingresos mensuales</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Tasa de ocupación</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Pagos pendientes</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <mat-card class="feature-card">
            <mat-card-content>
              <div class="feature-icon">
                <lucide-icon [img]="Shield" [size]="32"></lucide-icon>
              </div>
              <h3>Seguro y Confiable</h3>
              <p>Tus datos están protegidos con los más altos estándares de seguridad y encriptación.</p>
              <ul class="feature-list">
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Encriptación SSL</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Backups automáticos</li>
                <li><lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Control de acceso</li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-content">
          <h2>¿Listo para comenzar?</h2>
          <p>Únete a cientos de inmobiliarias que ya confían en 365Soft</p>
          <button
            mat-raised-button
            color="primary"
            size="large"
            routerLink="/register"
            class="cta-button-large">
            Crear Mi Cuenta
            <lucide-icon [img]="ArrowRight" [size]="20"></lucide-icon>
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <p>&copy; 2026 365Soft. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .landing-page {
      min-height: 100vh;
      background: #ffffff;
    }

    /* Hero Section */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      padding: 80px 60px;
      min-height: 80vh;
      align-items: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .hero-content {
      max-width: 540px;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      color: white;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
    }

    .hero-content h1 {
      font-size: 3.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px;
      letter-spacing: -1px;
    }

    .hero-content h2 {
      font-size: 1.5rem;
      font-weight: 500;
      color: #64748b;
      margin: 0 0 24px;
    }

    .hero-description {
      font-size: 1.125rem;
      line-height: 1.7;
      color: #475569;
      margin: 0 0 40px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .cta-button {
      height: 52px;
      padding: 0 32px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .login-button {
      height: 52px;
      padding: 0 32px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Dashboard Preview */
    .hero-visual {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .dashboard-preview {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .preview-header {
      height: 40px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }

    .preview-dots {
      display: flex;
      gap: 8px;
    }

    .preview-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #cbd5e1;
    }

    .preview-dots span:first-child {
      background: #f87171;
    }

    .preview-dots span:nth-child(2) {
      background: #fbbf24;
    }

    .preview-dots span:last-child {
      background: #34d399;
    }

    .preview-content {
      padding: 32px;
    }

    .chart-mock {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 200px;
    }

    .chart-mock .bar {
      flex: 1;
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 8px 8px 0 0;
      animation: grow 1s ease-out;
    }

    @keyframes grow {
      from {
        height: 0;
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Features Section */
    .features {
      padding: 100px 60px;
      background: white;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px;
    }

    .section-header p {
      font-size: 1.125rem;
      color: #64748b;
      margin: 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .feature-card {
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border-color: #3b82f6;
    }

    .feature-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      color: #2563eb;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 12px;
    }

    .feature-card p {
      font-size: 0.9375rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 20px;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: #475569;
    }

    .feature-list li lucide-icon {
      color: #10b981;
    }

    /* CTA Section */
    .cta-section {
      padding: 100px 60px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      text-align: center;
    }

    .cta-content h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      margin: 0 0 16px;
    }

    .cta-content p {
      font-size: 1.125rem;
      color: #94a3b8;
      margin: 0 0 40px;
    }

    .cta-button-large {
      height: 56px;
      padding: 0 48px;
      font-size: 1.125rem;
      font-weight: 600;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* Footer */
    .footer {
      padding: 40px 60px;
      background: #0f172a;
      border-top: 1px solid #1e293b;
    }

    .footer-content {
      text-align: center;
    }

    .footer-content p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .hero {
        grid-template-columns: 1fr;
        padding: 60px 40px;
        text-align: center;
      }

      .hero-content {
        max-width: 100%;
      }

      .hero-actions {
        justify-content: center;
      }

      .hero-visual {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding: 40px 20px;
      }

      .hero-content h1 {
        font-size: 2.5rem;
      }

      .hero-content h2 {
        font-size: 1.25rem;
      }

      .hero-actions {
        flex-direction: column;
      }

      .cta-button,
      .demo-button {
        width: 100%;
      }

      .features {
        padding: 60px 20px;
      }

      .section-header h2 {
        font-size: 2rem;
      }

      .cta-section {
        padding: 60px 20px;
      }

      .cta-content h2 {
        font-size: 2rem;
      }
    }
  `]
})
export class LandingComponent {
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly BarChart3 = BarChart3;
  readonly Shield = Shield;
  readonly CheckCircle = CheckCircle;
  readonly ArrowRight = ArrowRight;
  readonly LogIn = LogIn;
}
