# Implementación Multitenancy - FASE 1

## Resumen

Se implementó la arquitectura base del sistema multitenancy con slug dinámico en las URLs.

---

## Cambios Implementados

### 1. SlugService
**Archivo:** `src/app/core/services/slug.service.ts`

Servicio centralizado para gestionar el slug del tenant actual.

**Funcionalidades:**
- `setSlug(slug)` - Establece el slug actual
- `getSlug()` - Obtiene el slug actual
- `validateAndLoadTenant(slug)` - Valida que el slug existe y carga información del tenant
- `buildUrl(path)` - Construye URLs con el slug actual
- `buildApiEndpoint(endpoint)` - Construye endpoints de API con el slug

**Signals:**
- `currentSlug` - Slug actual
- `currentTenant` - Información completa del tenant
- `isLoading` - Estado de carga
- `error` - Mensajes de error

---

### 2. Landing Page
**Archivo:** `src/app/features/landing/landing.component.ts`

Página principal del sistema accesible en `/`.

**Contiene:**
- Presentación del sistema 365Soft
- Botón "Comenzar Gratis" → `/register`
- Botón "Iniciar Sesión" → `/login`

---

### 3. Registro Admin
**Archivo:** `src/app/features/auth/register.component.ts`

Registro público para administradores.

**Endpoint:** `POST /auth/register-admin`

**Campos:**
- `company_name` (requerido) - El slug se genera automáticamente
- `name` (requerido)
- `email` (requerido)
- `password` (requerido)
- `phone` (opcional)

**Post-registro:**
Redirige a `/:slug/login` con el slug que devuelve el backend.

---

### 4. Login Admin
**Archivo:** `src/app/features/auth/login.component.ts`

Login público para administradores (sin slug en URL).

**URL:** `/login`

**Endpoint:** `POST /auth/admin/login`

**Campos:**
- `email`
- `password`

**Validaciones:**
- Verifica que `role === 'ADMIN'`
- Si no es admin, muestra error y hace logout

**Post-login:**
Redirige a `/:slug/dashboard` con el `tenant_slug` que devuelve el backend.

**Respuesta esperada del backend:**
```json
{
    "access_token": "...",
    "user": {
        "id": 1,
        "email": "admin@admin.com",
        "name": "admin",
        "role": "ADMIN",
        "tenant_slug": "mi-inmobiliaria"
    }
}
```

---

### 5. AuthService
**Archivo:** `src/app/core/services/auth.service.ts`

**Nuevos métodos:**
- `loginAdmin(email, password, rememberMe)` - Login público sin slug
- `getCurrentSlug()` - Obtiene el slug del usuario autenticado

---

### 6. Estructura de Rutas
**Archivo:** `src/app/app.routes.ts`

```
/                         → Landing Page
/login                    → Login Admin (público, sin slug)
/register                 → Registro Admin (público)
/forgot-password          → Recuperar contraseña

/:slug/
├── publico/              → Portal Público
│   ├── propiedades
│   └── propiedades/:id
├── portal/               → Portal Inquilino
│   ├── login
│   ├── dashboard
│   ├── mantenimiento
│   ├── pagos
│   ├── documentos
│   ├── mensajes
│   └── perfil
└── dashboard             → Admin Panel
    ├── propiedades
    ├── inquilinos
    ├── contratos
    ├── pagos
    └── mantenimiento
```

---

## Flujo del Admin

```
1. Usuario entra a /
2. Click "Comenzar Gratis" o "Iniciar Sesión"
3. Si es nuevo → /register
   - Completa company_name, name, email, password
   - POST /auth/register-admin
   - Recibe token + slug
   - Redirige a /:slug/login
4. Si ya tiene cuenta → /login
   - Ingresa email + password
   - POST /auth/admin/login
   - Valida role === 'ADMIN'
   - Redirige a /:slug/dashboard
```

---

## Flujo del Inquilino (Pendiente FASE 2)

```
1. Admin comparte URL: /:slug/publico/propiedades
2. Inquilino ve propiedades
3. Click en "Registrarse" → /:slug/register (por implementar)
4. Se registra en ese tenant
5. Login en /:slug/portal/login
6. Accede a /:slug/portal/dashboard
```

---

## Pendientes

### FASE 2: Servicios y Guards
- [ ] Modificar `PropertyService` para usar SlugService
- [ ] Modificar `MaintenanceService` y otros servicios
- [ ] Actualizar `auth.guard.ts` para validar slug
- [ ] Actualizar `tenant-auth.guard.ts`

### FASE 3: Componentes UI
- [ ] Crear componente de registro de inquilino
- [ ] Actualizar navegación en sidebars
- [ ] Crear página de slug no encontrado

---

**Fecha:** 2026-02-09
**Estado:** FASE 1 completada
