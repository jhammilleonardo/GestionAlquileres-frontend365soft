import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  LucideAngularModule,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  LogIn,
  Home,
  Star,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, LucideAngularModule],
  template: `
    <div class="landing-page">
      <!-- Top Bar -->
      <nav class="top-bar">
        <div class="container">
          <div class="logo-section">
            <div class="logo-icon">
              <lucide-icon [img]="Home" [size]="22"></lucide-icon>
            </div>
            <span class="brand-name">365Soft</span>
          </div>
          <div class="top-actions">
            <button mat-button routerLink="/login" class="login-link">
              <lucide-icon [img]="LogIn" [size]="18"></lucide-icon>
              Iniciar Sesión
            </button>
            <button mat-raised-button color="primary" routerLink="/register" class="signup-btn">
              Comenzar Gratis
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
          <div class="grid-overlay"></div>
        </div>
        <div class="container hero-container">
          <div class="hero-content">
            <div class="hero-badge reveal">
              <lucide-icon [img]="Zap" [size]="14"></lucide-icon>
              La plataforma #1 para gestión de alquileres
            </div>
            <h1 class="reveal">
              Gestiona tus propiedades<br />
              <span class="gradient-text">sin complicaciones</span>
            </h1>
            <p class="hero-subtitle reveal">
              Administra propiedades, inquilinos, contratos y pagos desde una sola plataforma.
              Automatiza tu negocio inmobiliario y ahorra tiempo.
            </p>
            <div class="hero-cta reveal">
              <button mat-raised-button color="primary" routerLink="/register" class="cta-large">
                Comenzar Ahora — Es Gratis
                <lucide-icon [img]="ArrowRight" [size]="20"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- 3D Dashboard Mockup -->
          <div class="hero-visual reveal-right">
            <div class="dashboard-3d">
              <div class="dashboard-card card-main">
                <div class="d-card-header">
                  <div class="d-dot red"></div>
                  <div class="d-dot yellow"></div>
                  <div class="d-dot green"></div>
                </div>
                <div class="d-card-body">
                  <div class="d-stat-row">
                    <div class="d-stat">
                      <span class="d-num">24</span><span class="d-lbl">Propiedades</span>
                    </div>
                    <div class="d-stat">
                      <span class="d-num">18</span><span class="d-lbl">Inquilinos</span>
                    </div>
                    <div class="d-stat">
                      <span class="d-num">Bs 42k</span><span class="d-lbl">Ingresos</span>
                    </div>
                  </div>
                  <div class="d-bar-group">
                    <div class="d-bar" style="height:60%"></div>
                    <div class="d-bar" style="height:80%"></div>
                    <div class="d-bar" style="height:45%"></div>
                    <div class="d-bar" style="height:90%"></div>
                    <div class="d-bar" style="height:70%"></div>
                    <div class="d-bar" style="height:55%"></div>
                  </div>
                </div>
              </div>
              <div class="dashboard-card card-small card-s1">
                <lucide-icon [img]="CheckCircle" [size]="18" class="cs-icon green"></lucide-icon>
                <span>Pago aprobado</span>
                <strong>Bs 2,500</strong>
              </div>
              <div class="dashboard-card card-small card-s2">
                <lucide-icon [img]="Wrench" [size]="18" class="cs-icon orange"></lucide-icon>
                <span>Solicitud nueva</span>
                <strong>Plomería</strong>
              </div>
              <div class="dashboard-card card-small card-s3">
                <lucide-icon [img]="FileText" [size]="18" class="cs-icon blue"></lucide-icon>
                <span>Contrato firmado</span>
                <strong>Apto 4B</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Strip -->
      <section class="stats-strip">
        <div class="container">
          <div class="stats-row">
            <div class="stat-item reveal">
              <span class="stat-num">500+</span>
              <span class="stat-desc">Propiedades gestionadas</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item reveal">
              <span class="stat-num">1,200+</span>
              <span class="stat-desc">Inquilinos activos</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item reveal">
              <span class="stat-num">98%</span>
              <span class="stat-desc">Satisfacción de clientes</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item reveal">
              <span class="stat-num">Bs 5M+</span>
              <span class="stat-desc">Pagos procesados</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Modules Section -->
      <section class="modules">
        <div class="container">
          <div class="section-header reveal">
            <div class="section-tag">Módulos</div>
            <h2>Todo lo que necesitas para<br />administrar tu negocio</h2>
            <p>Módulos potentes diseñados para propietarios e inmobiliarias</p>
          </div>

          <div class="modules-grid">
            <div class="module-card reveal" style="--delay: 0ms">
              <div class="module-icon-wrap properties">
                <lucide-icon [img]="Building2" [size]="28"></lucide-icon>
              </div>
              <h3>Propiedades</h3>
              <p>
                Gestiona tu portafolio completo de propiedades con información detallada, imágenes y
                documentos.
              </p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Catálogo digital con
                  imágenes
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Control de
                  disponibilidad
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Historial de
                  mantenimiento
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Portal público de
                  alquiler
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>

            <div class="module-card reveal" style="--delay: 80ms">
              <div class="module-icon-wrap tenants">
                <lucide-icon [img]="Users" [size]="28"></lucide-icon>
              </div>
              <h3>Inquilinos</h3>
              <p>
                Administra toda la información de tus inquilinos y su comunicación desde un solo
                lugar.
              </p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Base de datos
                  centralizada
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Portal de autogestión
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Mensajería integrada
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Documentos digitales
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>

            <div class="module-card reveal" style="--delay: 160ms">
              <div class="module-icon-wrap leases">
                <lucide-icon [img]="FileText" [size]="28"></lucide-icon>
              </div>
              <h3>Contratos</h3>
              <p>Crea, gestiona y renueva contratos de arrendamiento de forma digital.</p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Generación automática
                  PDF
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Firma digital de
                  inquilinos
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Alertas de vencimiento
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Renovación automática
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>

            <div class="module-card reveal" style="--delay: 240ms">
              <div class="module-icon-wrap payments">
                <lucide-icon [img]="DollarSign" [size]="28"></lucide-icon>
              </div>
              <h3>Pagos y Finanzas</h3>
              <p>Registra pagos, aprueba comprobantes y mantén tu contabilidad al día.</p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Registro de pagos en
                  línea
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Aprobación de
                  comprobantes
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Recordatorios
                  automáticos
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Reportes financieros
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>

            <div class="module-card reveal" style="--delay: 320ms">
              <div class="module-icon-wrap maintenance">
                <lucide-icon [img]="Wrench" [size]="28"></lucide-icon>
              </div>
              <h3>Mantenimiento</h3>
              <p>Gestiona solicitudes de mantenimiento y da seguimiento hasta su resolución.</p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Portal de solicitudes
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Asignación de personal
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Seguimiento en tiempo
                  real
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Historial de
                  reparaciones
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>

            <div class="module-card reveal" style="--delay: 400ms">
              <div class="module-icon-wrap reports">
                <lucide-icon [img]="BarChart3" [size]="28"></lucide-icon>
              </div>
              <h3>Reportes y Analytics</h3>
              <p>Visualiza el rendimiento de tu negocio con dashboards en tiempo real.</p>
              <ul class="module-features">
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Dashboard interactivo
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Ingresos y gastos
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Tasa de ocupación
                </li>
                <li>
                  <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon> Exportación a Excel
                </li>
              </ul>
              <div class="card-shine"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works">
        <div class="container">
          <div class="section-header reveal">
            <div class="section-tag">Proceso</div>
            <h2>Empieza en minutos</h2>
            <p>Configura tu cuenta y comienza a gestionar tus propiedades</p>
          </div>

          <div class="steps">
            <div class="step reveal-left" style="--delay: 0ms">
              <div class="step-number">1</div>
              <div class="step-line"></div>
              <div class="step-content">
                <h3>Crea tu cuenta</h3>
                <p>Regístrate y configura tu organización en el sistema en menos de 2 minutos.</p>
              </div>
            </div>
            <div class="step reveal-left" style="--delay: 100ms">
              <div class="step-number">2</div>
              <div class="step-line"></div>
              <div class="step-content">
                <h3>Agrega tus propiedades</h3>
                <p>Importa o carga tus propiedades con fotos, descripciones y detalles.</p>
              </div>
            </div>
            <div class="step reveal-left" style="--delay: 200ms">
              <div class="step-number">3</div>
              <div class="step-line"></div>
              <div class="step-content">
                <h3>Invita a tus inquilinos</h3>
                <p>Crea contratos digitales e invita a tus inquilinos al portal.</p>
              </div>
            </div>
            <div class="step reveal-left" style="--delay: 300ms">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Gestiona todo en un lugar</h3>
                <p>Administra pagos, mantenimiento y comunicaciones desde una sola plataforma.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="final-cta">
        <div class="cta-orb cta-orb-1"></div>
        <div class="cta-orb cta-orb-2"></div>
        <div class="container">
          <div class="cta-box reveal">
            <div class="cta-stars">
              <lucide-icon [img]="Star" [size]="16"></lucide-icon>
              <lucide-icon [img]="Star" [size]="16"></lucide-icon>
              <lucide-icon [img]="Star" [size]="16"></lucide-icon>
              <lucide-icon [img]="Star" [size]="16"></lucide-icon>
              <lucide-icon [img]="Star" [size]="16"></lucide-icon>
              <span>Confiado por cientos de propietarios</span>
            </div>
            <h2>¿Listo para gestionar tus propiedades de manera profesional?</h2>
            <p>Simplifica la administración de tus alquileres con una plataforma completa</p>
            <button mat-raised-button color="primary" routerLink="/register" class="cta-button-xl">
              Crear Cuenta Gratis
              <lucide-icon [img]="ArrowRight" [size]="24"></lucide-icon>
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-brand">
              <div class="footer-logo">
                <div class="logo-icon small">
                  <lucide-icon [img]="Home" [size]="16"></lucide-icon>
                </div>
                <span>365Soft</span>
              </div>
              <p>La plataforma completa para gestión de propiedades en alquiler</p>
            </div>
            <div class="footer-links">
              <div class="footer-section">
                <h4>Producto</h4>
                <a href="#">Características</a>
                <a href="#">Precios</a>
                <a href="#">Demo</a>
              </div>
              <div class="footer-section">
                <h4>Soporte</h4>
                <a href="#">Centro de Ayuda</a>
                <a href="#">Contacto</a>
                <a href="#">Estado del Sistema</a>
              </div>
              <div class="footer-section">
                <h4>Empresa</h4>
                <a href="#">Sobre Nosotros</a>
                <a href="#">Blog</a>
                <a href="#">Términos</a>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 365Soft. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      * {
        box-sizing: border-box;
      }

      .landing-page {
        min-height: 100vh;
        background: #fff;
        overflow-x: hidden;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }

      /* ── Scroll Reveal ── */
      .reveal,
      .reveal-left,
      .reveal-right {
        opacity: 0;
        transition:
          opacity 0.75s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.75s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .reveal {
        transform: translateY(48px);
      }
      .reveal-left {
        transform: translateX(-48px);
      }
      .reveal-right {
        transform: translateX(48px);
      }

      .reveal.visible,
      .reveal-left.visible,
      .reveal-right.visible {
        opacity: 1;
        transform: translate(0);
        transition-delay: var(--delay, 0ms);
      }

      /* ── Top Bar ── */
      .top-bar {
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        padding: 14px 0;
        position: sticky;
        top: 0;
        z-index: 200;
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
      }
      .top-bar .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .logo-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .logo-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      .logo-icon.small {
        width: 32px;
        height: 32px;
        border-radius: 8px;
      }
      .brand-name {
        font-size: 1.4rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.5px;
      }
      .top-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .login-link {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .signup-btn {
        font-weight: 700 !important;
        border-radius: 8px !important;
      }

      /* ── Hero ── */
      .hero {
        position: relative;
        padding: 100px 0 80px;
        background: #0b1120;
        overflow: hidden;
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.35;
      }
      .orb-1 {
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, #3b82f6, transparent 70%);
        top: -200px;
        left: -100px;
        animation: orbFloat 8s ease-in-out infinite;
      }
      .orb-2 {
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, #8b5cf6, transparent 70%);
        top: 50px;
        right: -100px;
        animation: orbFloat 10s ease-in-out infinite reverse;
      }
      .orb-3 {
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, #06b6d4, transparent 70%);
        bottom: -100px;
        left: 40%;
        animation: orbFloat 12s ease-in-out infinite;
      }
      .grid-overlay {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 48px 48px;
      }

      .hero-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 60px;
        align-items: center;
        position: relative;
        z-index: 1;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #93c5fd;
        padding: 6px 16px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 20px;
        width: fit-content;
      }

      .hero h1 {
        font-size: 3.6rem;
        font-weight: 800;
        color: white;
        margin: 0 0 24px;
        line-height: 1.1;
        letter-spacing: -1.5px;
      }
      .gradient-text {
        background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .hero-subtitle {
        font-size: 1.15rem;
        color: #94a3b8;
        line-height: 1.7;
        margin: 0 0 40px;
      }
      .hero-cta {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      .cta-large {
        height: 56px !important;
        padding: 0 32px !important;
        font-size: 1rem !important;
        font-weight: 700 !important;
        border-radius: 12px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4) !important;
      }

      /* ── 3D Dashboard Mockup ── */
      .hero-visual {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .dashboard-3d {
        position: relative;
        width: 380px;
        height: 320px;
        transform: perspective(1000px) rotateY(-8deg) rotateX(4deg);
        transform-style: preserve-3d;
        animation: dashFloat 6s ease-in-out infinite;
      }
      @keyframes dashFloat {
        0%,
        100% {
          transform: perspective(1000px) rotateY(-8deg) rotateX(4deg) translateY(0);
        }
        50% {
          transform: perspective(1000px) rotateY(-8deg) rotateX(4deg) translateY(-12px);
        }
      }

      .dashboard-card {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        backdrop-filter: blur(16px);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      }
      .card-main {
        position: absolute;
        top: 0;
        left: 0;
        width: 280px;
        padding: 16px;
      }
      .d-card-header {
        display: flex;
        gap: 6px;
        margin-bottom: 16px;
      }
      .d-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .d-dot.red {
        background: #ef4444;
      }
      .d-dot.yellow {
        background: #f59e0b;
      }
      .d-dot.green {
        background: #10b981;
      }

      .d-stat-row {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }
      .d-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 10px 8px;
      }
      .d-num {
        font-size: 1.2rem;
        font-weight: 700;
        color: white;
      }
      .d-lbl {
        font-size: 0.65rem;
        color: #94a3b8;
        font-weight: 500;
      }
      .d-bar-group {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 60px;
      }
      .d-bar {
        flex: 1;
        border-radius: 4px 4px 0 0;
        background: linear-gradient(to top, #3b82f6, #60a5fa);
        animation: barPulse 3s ease-in-out infinite;
      }
      .d-bar:nth-child(2) {
        animation-delay: 0.3s;
      }
      .d-bar:nth-child(3) {
        animation-delay: 0.6s;
      }
      .d-bar:nth-child(4) {
        animation-delay: 0.9s;
      }
      .d-bar:nth-child(5) {
        animation-delay: 1.2s;
      }
      .d-bar:nth-child(6) {
        animation-delay: 1.5s;
      }
      @keyframes barPulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .card-small {
        position: absolute;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 140px;
        animation: cardFloat 4s ease-in-out infinite;
      }
      .card-small span {
        font-size: 0.7rem;
        color: #94a3b8;
      }
      .card-small strong {
        font-size: 0.9rem;
        color: white;
        font-weight: 700;
      }
      .cs-icon {
        margin-bottom: 2px;
      }
      .cs-icon.green {
        color: #10b981;
      }
      .cs-icon.orange {
        color: #f59e0b;
      }
      .cs-icon.blue {
        color: #3b82f6;
      }

      .card-s1 {
        top: 60px;
        right: 0;
        animation-delay: 0s;
      }
      .card-s2 {
        top: 170px;
        right: 20px;
        animation-delay: 0.8s;
      }
      .card-s3 {
        bottom: 0;
        left: 60px;
        animation-delay: 1.6s;
      }

      @keyframes cardFloat {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }

      /* ── Stats Strip ── */
      .stats-strip {
        padding: 48px 0;
        background: white;
        border-bottom: 1px solid #e2e8f0;
      }
      .stats-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0;
        flex-wrap: wrap;
      }
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 0 60px;
      }
      .stat-num {
        font-size: 2.5rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -1px;
      }
      .stat-desc {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
      }
      .stat-divider {
        width: 1px;
        height: 60px;
        background: #e2e8f0;
        flex-shrink: 0;
      }

      /* ── Modules ── */
      .modules {
        padding: 100px 0;
        background: #f8fafc;
      }
      .section-header {
        text-align: center;
        margin-bottom: 64px;
      }
      .section-tag {
        display: inline-block;
        background: #dbeafe;
        color: #2563eb;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 4px 14px;
        border-radius: 999px;
        margin-bottom: 16px;
      }
      .section-header h2 {
        font-size: 2.75rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 16px;
        letter-spacing: -1px;
        line-height: 1.15;
      }
      .section-header p {
        font-size: 1.125rem;
        color: #64748b;
        margin: 0;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px;
      }

      /* 3D Card */
      .module-card {
        background: white;
        border-radius: 20px;
        padding: 32px;
        border: 1px solid #e2e8f0;
        position: relative;
        overflow: hidden;
        cursor: default;
        transition:
          transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
          box-shadow 0.45s ease,
          border-color 0.3s ease;
        transform-style: preserve-3d;
      }
      .module-card:hover {
        transform: translateY(-10px) rotateX(3deg) rotateY(-2deg) scale(1.02);
        box-shadow:
          0 30px 60px rgba(59, 130, 246, 0.15),
          0 10px 20px rgba(0, 0, 0, 0.06),
          inset 0 0 0 1px rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.3);
      }

      /* Shine effect */
      .card-shine {
        position: absolute;
        top: 0;
        left: -100%;
        width: 60%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transform: skewX(-20deg);
        transition: left 0.6s ease;
        pointer-events: none;
      }
      .module-card:hover .card-shine {
        left: 150%;
      }

      .module-icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        color: white;
      }
      .module-icon-wrap.properties {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
      }
      .module-icon-wrap.tenants {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
      }
      .module-icon-wrap.leases {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
      }
      .module-icon-wrap.payments {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }
      .module-icon-wrap.maintenance {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
      }
      .module-icon-wrap.reports {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
      }

      .module-card h3 {
        font-size: 1.35rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 10px;
      }
      .module-card > p {
        font-size: 0.95rem;
        color: #64748b;
        line-height: 1.6;
        margin: 0 0 20px;
      }
      .module-features {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .module-features li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        color: #475569;
      }
      .module-features li lucide-icon {
        color: #10b981;
        flex-shrink: 0;
      }

      /* ── How It Works ── */
      .how-it-works {
        padding: 100px 0;
        background: white;
      }
      .steps {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-top: 60px;
        position: relative;
      }
      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
      }
      .step-number {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 800;
        color: white;
        margin-bottom: 8px;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
        position: relative;
        z-index: 1;
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
      }
      .step:hover .step-number {
        transform: scale(1.1) translateY(-4px);
        box-shadow: 0 16px 32px rgba(59, 130, 246, 0.4);
      }
      .step-line {
        position: absolute;
        top: 32px;
        left: calc(50% + 32px);
        width: calc(100% - 64px);
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #bfdbfe);
        z-index: 0;
      }
      .step:last-child .step-line {
        display: none;
      }
      .step-content {
        margin-top: 16px;
      }
      .step-content h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 8px;
      }
      .step-content p {
        font-size: 0.9rem;
        color: #64748b;
        line-height: 1.6;
        margin: 0;
      }

      /* ── Final CTA ── */
      .final-cta {
        padding: 120px 0;
        background: linear-gradient(135deg, #0b1120 0%, #1e1b4b 50%, #0b1120 100%);
        position: relative;
        overflow: hidden;
      }
      .cta-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.3;
        pointer-events: none;
      }
      .cta-orb-1 {
        width: 500px;
        height: 500px;
        background: #3b82f6;
        top: -200px;
        left: -100px;
        animation: orbFloat 9s ease-in-out infinite;
      }
      .cta-orb-2 {
        width: 400px;
        height: 400px;
        background: #8b5cf6;
        bottom: -150px;
        right: -50px;
        animation: orbFloat 7s ease-in-out infinite reverse;
      }
      @keyframes orbFloat {
        0%,
        100% {
          transform: translate(0, 0);
        }
        50% {
          transform: translate(20px, -20px);
        }
      }

      .cta-box {
        text-align: center;
        max-width: 700px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }
      .cta-stars {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-bottom: 20px;
        color: #f59e0b;
      }
      .cta-stars span {
        color: #94a3b8;
        font-size: 0.875rem;
        margin-left: 8px;
      }
      .cta-box h2 {
        font-size: 2.75rem;
        font-weight: 800;
        color: white;
        margin: 0 0 16px;
        letter-spacing: -1px;
        line-height: 1.2;
      }
      .cta-box > p {
        font-size: 1.125rem;
        color: #94a3b8;
        margin: 0 0 40px;
        line-height: 1.6;
      }
      .cta-button-xl {
        height: 60px !important;
        padding: 0 48px !important;
        font-size: 1.15rem !important;
        font-weight: 700 !important;
        border-radius: 14px !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 12px !important;
        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5) !important;
      }

      /* ── Footer ── */
      .footer {
        padding: 60px 0 24px;
        background: #0b1120;
        color: white;
      }
      .footer-content {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: 60px;
        margin-bottom: 40px;
      }
      .footer-brand {
        max-width: 300px;
      }
      .footer-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .footer-brand p {
        font-size: 0.875rem;
        color: #64748b;
        line-height: 1.6;
        margin: 0;
      }
      .footer-links {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 40px;
      }
      .footer-section h4 {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 16px;
        color: #cbd5e1;
      }
      .footer-section a {
        display: block;
        font-size: 0.875rem;
        color: #64748b;
        text-decoration: none;
        margin-bottom: 12px;
        transition: color 0.2s;
      }
      .footer-section a:hover {
        color: #3b82f6;
      }
      .footer-bottom {
        padding-top: 24px;
        border-top: 1px solid #1e293b;
        text-align: center;
      }
      .footer-bottom p {
        font-size: 0.875rem;
        color: #475569;
        margin: 0;
      }

      /* ── Responsive ── */
      @media (max-width: 1024px) {
        .hero-container {
          grid-template-columns: 1fr;
        }
        .hero-visual {
          display: none;
        }
        .hero h1 {
          font-size: 2.8rem;
        }
        .modules-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .steps {
          grid-template-columns: repeat(2, 1fr);
        }
        .step-line {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .hero {
          padding: 60px 0;
        }
        .hero h1 {
          font-size: 2.2rem;
        }
        .section-header h2 {
          font-size: 2rem;
        }
        .modules-grid {
          grid-template-columns: 1fr;
        }
        .steps {
          grid-template-columns: 1fr;
        }
        .stats-row {
          flex-direction: column;
          gap: 32px;
        }
        .stat-divider {
          display: none;
        }
        .stat-item {
          padding: 0;
        }
        .footer-content {
          grid-template-columns: 1fr;
          gap: 40px;
        }
        .footer-links {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .cta-box h2 {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class LandingComponent implements AfterViewInit {
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly DollarSign = DollarSign;
  readonly Wrench = Wrench;
  readonly BarChart3 = BarChart3;
  readonly Shield = Shield;
  readonly CheckCircle = CheckCircle;
  readonly ArrowRight = ArrowRight;
  readonly LogIn = LogIn;
  readonly Home = Home;
  readonly Star = Star;
  readonly TrendingUp = TrendingUp;
  readonly Clock = Clock;
  readonly Zap = Zap;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    document
      .querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach((el) => observer.observe(el));
  }
}
