# FRONTEND-PROYECTO — GestionAlquileres 365Soft

Documentación técnica completa del frontend de la plataforma de gestión de alquileres desarrollada para **365Soft**.

---

## Índice

1. [Descripción General](#descripción-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Sistema Multi-Tenancy](#sistema-multi-tenancy)
5. [Enrutamiento (Routing)](#enrutamiento-routing)
6. [Autenticación y Seguridad](#autenticación-y-seguridad)
7. [Módulo Core](#módulo-core)
8. [Features (Funcionalidades)](#features-funcionalidades)
9. [Shared (Componentes Compartidos)](#shared-componentes-compartidos)
10. [Modelos de Datos](#modelos-de-datos)
11. [Servicios](#servicios)
12. [Estilos y UI](#estilos-y-ui)
13. [Configuración del Entorno](#configuración-del-entorno)
14. [Cómo correr el proyecto](#cómo-correr-el-proyecto)

---

## Descripción General

**GestionAlquileres 365Soft** es una plataforma SaaS de gestión de alquileres inmobiliarios con arquitectura **multi-tenant**. Permite que múltiples empresas (tenants) usen la misma aplicación de forma aislada, cada una accediendo a través de su propio **slug** único en la URL.

La aplicación tiene **tres perfiles de usuario** diferenciados:

| Perfil | Descripción | Ruta Base |
|---|---|---|
| **Administrador** | Gestor de la empresa (landlord/admin) | `/:slug/dashboard` |
| **Inquilino** | Portal del arrendatario | `/:slug/portal/dashboard` |
| **Público** | Visitante (buscar propiedades) | `/:slug/publico` |

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Angular** | 21.x | Framework principal |
| **TypeScript** | ~5.9 | Lenguaje base |
| **Angular Material** | 21.x | Componentes UI (dialogs, forms, tables) |
| **Tailwind CSS** | 4.x | Utilidades de estilo y layout |
| **RxJS** | ~7.8 | Programación reactiva y manejo de observables |
| **Angular Signals** | (nativo 21) | Estado reactivo local y global |
| **Lucide Angular** | ^0.563 | Librería de iconos SVG |
| **Angular CDK** | 21.x | Overlay, a11y, drag & drop |
| **Vitest** | ^4.x | Testing unitario |
| **ESLint** | ^9.x | Linting de código |

---

## Arquitectura del Proyecto

El proyecto sigue una arquitectura **feature-based** con separación clara en tres capas:

```
src/
└── app/
    ├── core/           → Guards, Interceptores, Servicios globales, Modelos
    ├── features/       → Módulos funcionales (páginas y vistas)
    └── shared/         → Layouts reutilizables y Pipes
```

### Directrices Arquitectónicas

- **Standalone components** en toda la aplicación (sin NgModules).
- **Lazy loading** en el portal del inquilino y el portal público.
- **Signals** de Angular para el estado reactivo en los servicios de autenticación y slug.
- **Functional interceptors y guards** (nuevo patrón Angular 15+).
- `provideHttpClient()` con interceptores funcionales centralizados en `app.config.ts`.

---

## Sistema Multi-Tenancy

El corazón de la arquitectura es el `SlugService`. Cada empresa tiene un identificador único (`slug`) que se extrae de la URL en cada navegación.

### Cómo funciona

**URL Pattern:**
```
https://app.365soft.com/:slug/dashboard
https://app.365soft.com/:slug/portal/dashboard
https://app.365soft.com/:slug/publico
```

**Flujo:**
1. El usuario accede a `/:slug/...`
2. El Guard (`authGuard` o `tenantAuthGuard`) lee el `:slug` del `paramMap`.
3. Llama a `slugService.setSlug(slug)` para:
   - Guardar el slug en `localStorage` (`tenant_slug`).
   - Validar el tenant contra el backend (`GET /tenants/:slug`).
   - Cachear el resultado en un `Map` interno.
4. `SlugService` expone el slug y los datos del tenant como **Signals de solo lectura** para que cualquier componente o servicio pueda consumirlos reactivamente.

```typescript
// En cualquier componente:
const slugService = inject(SlugService);
const slug = slugService.currentSlug();          // Signal<string | null>
const tenant = slugService.currentTenant();      // Signal<TenantInfo | null>
const loading = slugService.isLoading();         // Signal<boolean>
```

---

## Enrutamiento (Routing)

El archivo `app.routes.ts` define tres zonas diferenciadas:

### Zona 1 — Rutas Públicas (sin slug)

```
/                   → LandingComponent          (página de inicio global)
/login              → LoginComponent            (login del administrador)
/register           → RegisterComponent         (registro de nueva empresa)
/forgot-password    → ForgotPasswordComponent   (recuperar contraseña)
```

### Zona 2 — Rutas con Slug

Todas las rutas de trabajo viven bajo el patrón `/:slug/...`

#### Auth del Inquilino
```
/:slug/login        → TenantLoginComponent     (lazy)
/:slug/register     → TenantRegisterComponent
```

#### Portal Público (lazy-loaded)
```
/:slug/publico/...  → PORTAL_PUBLICO_ROUTES    (módulo lazy)
```

#### Portal del Inquilino (lazy-loaded, protegido por `tenantAuthGuard`)
```
/:slug/portal/dashboard
/:slug/portal/mantenimiento
/:slug/portal/mantenimiento/nueva
/:slug/portal/mantenimiento/:id
/:slug/portal/pagos
/:slug/portal/pagos/nuevo
/:slug/portal/documentos
/:slug/portal/documentos/contratos
/:slug/portal/documentos/contratos/:id
/:slug/portal/mensajes
/:slug/portal/notificaciones
/:slug/portal/perfil
```

#### Panel Administrador (protegido por `authGuard`, renderizado dentro de `MainLayoutComponent`)
```
/:slug/dashboard
/:slug/propiedades
/:slug/propiedades/:id
/:slug/inquilinos
/:slug/contratos
/:slug/contratos/nuevo
/:slug/contratos/:id
/:slug/contratos/:id/editar
/:slug/pagos
/:slug/mantenimiento
/:slug/notificaciones
/:slug/perfil
/:slug/configuracion
/:slug/componentes
```

### Estrategia de Redirección

- Cualquier ruta desconocida (`**`) redirige a `/`.
- Los guards usan `replaceUrl: true` para no contaminar el historial del navegador.
- Al refrescar la página, `AuthService` y `TenantAuthService` restauran el slug desde `localStorage` automáticamente.

---

## Autenticación y Seguridad

### Dos sesiones independientes

La app mantiene **dos sesiones en paralelo** con claves distintas en `localStorage`:

| Sesión | Token Key | User Key | Servicio |
|---|---|---|---|
| Administrador | `admin_access_token` | `admin_user` | `AuthService` |
| Inquilino | `tenant_access_token` | `tenant_user` | `TenantAuthService` |

### Guards

#### `authGuard` (Administrador)
- Lee el `:slug` del `paramMap`.
- Llama a `slugService.setSlug()`.
- Verifica `authService.isAuth()` y `authService.getToken()`.
- Si no autenticado → redirige a `/login?returnUrl=...`

#### `adminLoginGuard` (Previene doble login)
- Si el admin ya está autenticado, lo redirige a `/:slug/dashboard` en vez de mostrar el formulario de login.

#### `tenantAuthGuard` (Inquilino)
- Igual que `authGuard` pero usando `TenantAuthService`.
- Redirige a `/:slug/login?returnUrl=...`

#### `tenantLoginGuard` (Previene doble login del inquilino)
- Si ya está autenticado, redirige a `/:slug/portal/dashboard`.

### Interceptor HTTP (`authInterceptor`)

Todos los requests HTTP pasan por un **functional interceptor** que añade el header `Authorization: Bearer <token>`.

**Lógica de selección de token:**
1. Si el request ya trae un header `Authorization` (seteado manualmente por un servicio), se respeta sin modificar.
2. Si la URL contiene `/tenant/` → usa el token del inquilino (`tenant_access_token`). Si no existe, usa el del admin como fallback.
3. Para cualquier otra ruta → usa el token del admin. Si no existe, usa el del inquilino como fallback.

### Estado Reactivo con Signals

Tanto `AuthService` como `TenantAuthService` exponen su estado mediante Signals:

```typescript
authService.currentUser()       // Signal<User | null>
authService.isLoading()         // Signal<boolean>
authService.error()             // Signal<string | null>
authService.isAuthenticated()   // ComputedSignal<boolean>
```

---

## Módulo Core

### Estructura

```
core/
├── guards/
│   ├── auth.guard.ts          → authGuard, adminLoginGuard
│   └── tenant-auth.guard.ts   → tenantAuthGuard, tenantLoginGuard
├── interceptors/
│   └── auth.interceptor.ts    → Añade JWT a todos los requests
├── models/
│   ├── contract.model.ts
│   ├── document.model.ts
│   ├── maintenance-request.model.ts
│   ├── message.model.ts
│   ├── payment.model.ts
│   ├── property.model.ts
│   ├── tenant-user.model.ts
│   └── user.model.ts
└── services/
    ├── api.service.ts              → CRUD genérico (get/post/put/patch/delete)
    ├── api-http.service.ts         → HTTP avanzado (form-data, headers custom)
    ├── auth.service.ts             → Sesión del administrador
    ├── tenant-auth.service.ts      → Sesión del inquilino
    ├── slug.service.ts             → Gestión del slug y tenant activo
    ├── sidebar.service.ts          → Estado del sidebar (abierto/cerrado)
    ├── property.service.ts         → CRUD propiedades (admin)
    ├── contract.service.ts         → CRUD contratos (admin)
    ├── payment.service.ts          → CRUD pagos (admin)
    ├── maintenance.service.ts      → CRUD mantenimiento (admin)
    ├── notification.service.ts     → Notificaciones del admin
    ├── admin-user.service.ts       → Gestión de usuarios admin
    ├── admin-contract.service.ts   → Contratos (versión admin avanzada)
    ├── tenant-auth.service.ts      → (duplicado de arriba, sesión inquilino)
    ├── tenant-contract.service.ts  → Contratos del inquilino
    ├── tenant-document.service.ts  → Documentos del inquilino
    ├── tenant-maintenance.service.ts → Mantenimiento del inquilino
    ├── tenant-message.service.ts   → Mensajería del inquilino
    ├── tenant-notification.service.ts → Notificaciones del inquilino
    ├── tenant-payment.service.ts   → Pagos del inquilino
    ├── tenant-property.service.ts  → Propiedades visibles para el inquilino
    └── tenant-user.service.ts      → Perfil y datos del inquilino
```

---

## Features (Funcionalidades)

### Panel Administrador

#### `auth/`
Tres componentes de autenticación para el administrador:
- **`LoginComponent`** — Login con email y contraseña. Obtiene el slug del `localStorage` o `queryParams`.
- **`RegisterComponent`** — Registro de nueva empresa/tenant. Crea simultáneamente un tenant y un usuario admin.
- **`ForgotPasswordComponent`** — Recuperación de contraseña por email.

#### `dashboard/`
Vista principal del administrador con resumen de métricas:
- Propiedades activas, contratos vigentes, pagos pendientes, solicitudes de mantenimiento abiertas.
- Widgets de acceso rápido a cada sección.

#### `propiedades/`
Gestión completa del catálogo de inmuebles:
- **Listado** con filtros por tipo, estado y disponibilidad.
- **Detalle admin** (`PropertyDetailAdminComponent`) — Imágenes, amenidades, reglas, datos financieros (cuenta bancaria, depósito), coordenadas geográficas.
- Soporte para tipos (`PropertyType`) y subtipos (`PropertySubtype`).

#### `contratos/`
CRUD completo de contratos de arrendamiento:
- **`ContratosComponent`** — Listado con estados (`BORRADOR`, `ACTIVO`, `FINALIZADO`).
- **`ContractCreateComponent`** — Wizard/formulario de creación: selección de propiedad, inquilino, fechas, monto, condiciones.
- **`ContractDetailComponent`** — Vista completa del contrato con propietario, inquilino y propiedad.
- **`ContractEditComponent`** — Edición de contrato existente.

#### `inquilinos/`
Gestión del directorio de arrendatarios:
- Listado con búsqueda y filtros.
- Ficha del inquilino: datos personales, historial de contratos y pagos.
- Creación y edición de perfiles de inquilino.

#### `pagos/`
Registro y seguimiento de pagos:
- Soporte multi-moneda: USD, EUR, GBP, MXN, BRL, COP, ARS, CLP, PEN, BOB, CAD, AUD.
- Múltiples métodos de pago: ACH, SEPA, Zelle, Venmo, tarjetas, PayPal, transferencia, efectivo, etc.
- Estados: `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `FAILED`, `REFUNDED`, `REVERSED`, `DISPUTED`.
- Tipos: renta, depósito, mora, utilidades, HOA, mascotas, estacionamiento, etc.

#### `mantenimiento/`
Solicitudes de mantenimiento (de parte del admin):
- Listado con prioridad y estado.
- Asignación a proveedores.
- Seguimiento del estado de resolución.

#### `notificaciones/`
Centro de notificaciones del administrador.

#### `perfil/`
Perfil del administrador (`AdminPerfilComponent`): datos personales, cambio de contraseña.

#### `configuracion/`
Configuración general del tenant: nombre de empresa, moneda, datos de contacto.

#### `componentes/`
Kitchhen sink / design system playground para el equipo de desarrollo.

#### `landing/`
Página de marketing pública (`/`) visible para cualquier visitante.

---

### Portal del Inquilino (`tenant-portal/`)

Módulo **completamente lazy-loaded**. Todos sus componentes se cargan solo cuando el inquilino navega a `/:slug/portal/...`.

| Ruta | Componente | Descripción |
|---|---|---|
| `portal/dashboard` | `TenantDashboardComponent` | Resumen del contrato activo y actividad reciente |
| `portal/mantenimiento` | `TenantMaintenanceListComponent` | Historial de solicitudes |
| `portal/mantenimiento/nueva` | `TenantCreateRequestComponent` | Crear nueva solicitud |
| `portal/mantenimiento/:id` | `TenantRequestDetailComponent` | Detalle y seguimiento |
| `portal/pagos` | `TenantPaymentsListComponent` | Historial de pagos |
| `portal/pagos/nuevo` | `TenantCreatePaymentComponent` | Registrar nuevo pago |
| `portal/documentos` | `TenantDocumentsComponent` | Documentos disponibles |
| `portal/documentos/contratos` | `TenantContractListComponent` | Contratos del inquilino |
| `portal/documentos/contratos/:id` | `TenantContractDetailComponent` | Detalle del contrato |
| `portal/mensajes` | `TenantMessagesComponent` | Chat/mensajería con el gestor |
| `portal/notificaciones` | `TenantNotificationsComponent` | Notificaciones del inquilino |
| `portal/perfil` | `TenantProfileComponent` | Perfil y contraseña |

---

### Portal Público (`portal-publico/`)

Módulo lazy-loaded accesible sin autenticación bajo `/:slug/publico/...`. Permite a visitantes:
- Ver propiedades disponibles para alquilar.
- Ver detalles de una propiedad (fotos, amenidades, precio).
- Registrarse como nuevo inquilino (`TenantRegisterComponent`).

---

## Shared (Componentes Compartidos)

### Layouts

#### `MainLayoutComponent`
Layout principal del panel administrador. Contiene:
- **Sidebar** (`sidebar/`) — Menú de navegación lateral con todos los módulos admin. Controlado por `SidebarService` (estado abierto/colapsado mediante Signal).
- **Header** (`header/`) — Barra superior con nombre del tenant, avatar del usuario y acceso a notificaciones y perfil.
- `<router-outlet>` — Zona de contenido de la ruta activa.

#### `TenantLayoutComponent`
Layout equivalente para el portal del inquilino. Carga bajo demanda (lazy) junto con su módulo.

### Pipes

Pipes de transformación de datos reutilizables en las vistas (ej. formateo de fechas, moneda, estado de contrato, etc.).

---

## Modelos de Datos

### `User` / `AdminUser`

```typescript
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'INQUILINO';
  tenant_slug?: string;
}
```

### `TenantUser`

```typescript
interface TenantUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'TENANT';
  tenant_slug: string;
  contract?: { id, contract_number, property_title, status };
}
```

### `TenantInfo`

```typescript
interface TenantInfo {
  id: number;
  company_name: string;
  slug: string;
  currency: string;
  locale: string;
  is_active: boolean;
  logo_url?: string;
}
```

### `Property`

Modelo rico que incluye: tipo, subtipo, estado, ubicación GPS, imágenes, baños, dormitorios, superficie, renta mensual, depósito, cuenta bancaria, amenidades, items incluidos y reglas (mascotas, fumado, ocupantes, etc.).

### `Contract`

Estados: `BORRADOR`, `ACTIVO`, `FINALIZADO`. Incluye relaciones con el inquilino, la propiedad (con dirección y propietario), fechas de inicio/fin, monto de renta y condiciones.

### `Payment`

Modelo multi-moneda (12 divisas) y multi-método (16 métodos). Estados: 8 posibles. Tipos de pago: 10 categorías (renta, depósito, mora, etc.). Soporta procesadores: Stripe, PayPal, Square, Authorize.net, Plaid, Dwolla, MercadoPago, Manual.

### Otros modelos

- **`MaintenanceRequest`** — Con prioridad, estado y categoría.
- **`Message`** — Mensajería entre inquilino y administrador.
- **`Document`** — Documentos adjuntos a contratos o propiedades.

---

## Servicios

### Servicios Genéricos

**`ApiService`** — Wrapper de `HttpClient` con métodos `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>` usando la `apiUrl` base del entorno.

**`ApiHttpService`** — Versión avanzada para requests con `FormData`, headers customizados y manejo de archivos.

### Patrón de los Servicios de Dominio

Todos los servicios de negocio siguen el mismo patrón:
1. Inyectan `HttpClient` o `ApiService`.
2. Construyen las URLs usando `slugService.currentSlug()` para el aislamiento multi-tenant.
3. Retornan `Observable<T>` para que los componentes se suscriban.

Ejemplo de construcción de URL:
```typescript
// Ruta admin: GET /admin/{slug}/properties
// Ruta tenant: GET /tenant/{slug}/payments
const slug = this.slugService.currentSlug();
this.http.get(`${apiUrl}admin/${slug}/properties`);
```

### `SidebarService`

Gestiona el estado del sidebar con un Signal:
```typescript
sidebarOpen = signal(true);
toggle() { this.sidebarOpen.update(v => !v); }
```

---

## Estilos y UI

### Tailwind CSS 4.x

Configurado en `tailwind.config.js` con paleta de colores personalizada:

```
primary-50  → #f5f3ff  (lila muy claro)
primary-500 → #8b5cf6  (violeta medio)
primary-700 → #6d28d9  (violeta oscuro)
primary-900 → #4c1d95  (violeta muy oscuro)
```

Los colores primarios están en la gama **violet/purple**, definiendo la identidad visual de la app.

### Angular Material 21

Usado para componentes complejos que requieren comportamiento accesible:
- `MatDialog` — Modales y dialogs de confirmación.
- `MatFormField` / `MatInput` — Campos de formulario con validación visual.
- `MatTable` — Tablas con ordenación y paginación.
- `MatSnackBar` — Notificaciones toast.
- `MatSelect` / `MatAutocomplete` — Selectores avanzados.
- `MatDatepicker` — Selección de fechas en contratos.

Animaciones habilitadas con `provideAnimationsAsync()` (carga diferida).

### Lucide Angular

Librería de iconos SVG con más de 500 iconos. Se usa para iconografía consistente en el sidebar, botones y widgets.

### Estilos Globales

`src/styles.scss` — Reset y estilos globales.

`src/app/app.scss` — Estilos del componente raíz.

Cada componente tiene su propio archivo `.scss` con estilos encapsulados (ViewEncapsulation por defecto).

---

## Configuración del Entorno

### `environment.ts` (Desarrollo)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/',
  apiTimeout: 30000
};
```

### `environment.production.ts` (Producción)

Se configura la URL del backend en producción. El build de producción se genera con:
```bash
ng build --configuration production
```

### `app.config.ts`

Punto central de configuración de la aplicación (sin NgModules):

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

---

## Cómo correr el proyecto

### Requisitos

- Node.js 20+
- npm 11+
- Backend corriendo en `http://localhost:3000/`

### Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
npm start
# o
ng serve

# Build de producción
npm run build

# Tests unitarios (Vitest)
npm test

# Build en modo watch
npm run watch
```

### Primer acceso

1. Registrar una nueva empresa en `/register` → se crea el tenant con su slug único.
2. Iniciar sesión en `/login` → redirige automáticamente a `/:slug/dashboard`.
3. El inquilino accede en `/:slug/login` → redirige a `/:slug/portal/dashboard`.

---

## Resumen del Flujo Completo

```
[Visitante]
    ↓
  / (Landing)
    ↓
  /register (Nueva empresa) → Genera slug
    ↓
  /login (Admin)
    ↓ authGuard valida JWT
  /:slug/dashboard (Panel Admin)
    ├── Gestiona propiedades, contratos, inquilinos
    ├── Registra pagos y mantenimiento
    └── Envía notificaciones

[Inquilino]
    ↓
  /:slug/login
    ↓ tenantAuthGuard valida JWT
  /:slug/portal/dashboard
    ├── Ve su contrato activo
    ├── Registra pagos
    ├── Crea solicitudes de mantenimiento
    ├── Descarga documentos
    └── Envía mensajes al gestor

[Visitante Público]
    ↓
  /:slug/publico (Ver propiedades en alquiler)
    ↓
  /:slug/register (Solicitar alquiler)
```

---

*Documentación generada el 21 de febrero de 2026 — GestionAlquileres 365Soft Frontend v0.0.0*
