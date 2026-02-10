# Sistema Multitenancy - Guía Completa

## 📋 Resumen del Sistema

365Soft es un sistema multitenancy donde cada organización (inmobiliaria) tiene su propio **slug** único en la URL, lo que permite:
- URLs personalizadas para cada cliente
- Aislamiento completo de datos
- Portales independientes para admin e inquilinos

---

## 🏗️ Estructura de URLs

```
/                                    → Landing Page pública
/register                            → Registro de nuevas empresas
/login                               → Login admin (sin slug)

/:slug/                              → Espacio de una organización
├── login                            → Login unificado (admin o inquilino)
├── register                         → Registro de inquilinos
├── dashboard                        → Panel de administración
├── publico/                         → Catálogo público de propiedades
└── portal/                          → Portal del inquilino
    ├── dashboard
    ├── mantenimiento
    ├── pagos
    └── documentos
```

---

## 👥 Perfiles de Usuario

### 1. ADMIN (Administrador de la Inmobiliaria)
- Crea la empresa y obtiene un slug único
- Gestiona propiedades, inquilinos, contratos
- Acceso: `/:slug/dashboard`

### 2. INQUILINO (Usuario final)
- Se registra a una empresa existente
- Ve sus pagos, mantenimiento, documentos
- Acceso: `/:slug/portal/dashboard`

---

## 🔄 Flujos del Sistema

### Flujo 1: Crear Nueva Empresa (Admin)

1. **Entrar a Landing Page**
   - URL: `http://localhost:4200/`
   - Usuario ve información del sistema

2. **Registrarse como Admin**
   - URL: `http://localhost:4200/register`
   - Datos requeridos:
     - Nombre de la empresa
     - Nombre completo
     - Email
     - Contraseña
     - Teléfono (opcional)

3. **Sistema Backend**
   - API: `POST /auth/register-admin`
   - Crea el tenant (organización)
   - Genera el slug automáticamente
   - Crea el usuario admin
   - Devuelve: slug, access_token, datos del usuario

4. **Redirección**
   - URL: `http://localhost:4200/:slug/login`
   - Ya puede iniciar sesión

---

### Flujo 2: Login Admin

1. **Ingresar a Login**
   - URL: `http://localhost:4200/:slug/login`
   - El slug ya viene en la URL

2. **Credenciales**
   - Email y contraseña
   - El sistema detecta el slug de la URL automáticamente

3. **Backend**
   - API: `POST /auth/login`
   - Valida credenciales
   - Devuelve token con rol ADMIN

4. **Redirección**
   - URL: `http://localhost:4200/:slug/dashboard`
   - Acceso al panel de administración

---

### Flujo 3: Portal Público (Catálogo)

1. **Admin comparte el enlace**
   - URL: `http://localhost:4200/:slug/publico/propiedades`
   - Cualquier persona puede ver las propiedades

2. **Inquilino navega el catálogo**
   - Ve propiedades disponibles
   - Puede ver detalles de cada propiedad
   - No requiere login

3. **Decide registrarse**
   - Click en "Registrarse"
   - Redirección a: `/:slug/register`

---

### Flujo 4: Registro de Inquilino

1. **Formulario de Registro**
   - URL: `http://localhost:4200/:slug/register`
   - El slug viene en la URL
   - Datos requeridos:
     - Nombre completo
     - Email
     - Contraseña
     - Teléfono (opcional)

2. **Backend**
   - API: `POST /auth/:slug/register`
   - Crea usuario con rol USER/INQUILINO
   - Asocia al tenant correspondiente
   - Opcionalmente devuelve token para login automático

3. **Redirección**
   - Si devuelve token: `/:slug/portal/dashboard`
   - Si no: `/:slug/login` con mensaje de éxito

---

### Flujo 5: Login Inquilino

1. **Ingresar a Login**
   - URL: `http://localhost:4200/:slug/login`
   - **El mismo login que el admin** (unificado)

2. **Credenciales**
   - Email y contraseña
   - Sistema detecta slug de la URL

3. **Backend**
   - API: `POST /auth/:slug/login`
   - Valida credenciales
   - Devuelve token con rol USER/INQUILINO

4. **Redirección Automática**
   - Sistema detecta el rol del token
   - Si es ADMIN → `/:slug/dashboard`
   - Si es INQUILINO → `/:slug/portal/dashboard`

---

## 🎯 Componentes Clave

### SlugService
- Servicio centralizado que maneja el slug
- Obtiene el slug de la URL actual
- Construye URLs dinámicas con el slug
- Archivo: `src/app/core/services/slug.service.ts`

### LoginComponent (Unificado)
- Maneja login para admin e inquilinos
- Detecta slug de la URL automáticamente
- Elige el servicio según el contexto
- Redirige según el rol del usuario
- Archivo: `src/app/features/auth/login.component.ts`

### Rutas Dinámicas
- Sidebar y navegación usan `SlugService.buildUrl()`
- Todos los links incluyen el slug automáticamente
- Archivos:
  - `src/app/shared/layouts/sidebar/sidebar.component.ts`
  - `src/app/features/tenant-portal/layout/tenant-layout.component.ts`

---

## 🔐 Seguridad y Aislamiento

- Cada tenant tiene sus datos completamente aislados
- El slug en la URL determina a qué tenant pertenece la petición
- Los guards validan que el usuario tenga acceso a ese tenant
- Tokens incluyen información del tenant y rol

---

## 📊 Estructura de Base de Datos

```
tenants (organizaciones)
  ├─ id
  ├─ slug (único)
  ├─ company_name
  └─ created_at

users (usuarios)
  ├─ id
  ├─ tenant_id (FK)
  ├─ name
  ├─ email
  ├─ role (ADMIN/USER)
  └─ password

properties (propiedades)
  ├─ id
  ├─ tenant_id (FK)
  ├─ title
  └─ ...

contracts (contratos)
  ├─ id
  ├─ tenant_id (FK)
  ├─ property_id (FK)
  └─ user_id (inquilino)
```

---

## 🚀 Cómo Usar Este Sistema

### Para Desarrolladores

1. **Crear nuevas rutas**: Siempre usar `:slug` como parámetro
2. **Navegación**: Usar `SlugService.buildUrl('/ruta')`
3. **Servicios**: Inyectar `SlugService` para obtener el slug actual
4. **Guards**: Validar slug y rol antes de permitir acceso

### Para Admins (Inmobiliarias)

1. Registrarse en `/register`
2. Recibir URL única: `http://dominio.com/mi-slug`
3. Compartir esa URL con inquilinos
4. Gestionar propiedades desde el dashboard

### Para Inquilinos

1. Recibir URL del admin: `http://dominio.com/mi-slug/publico/propiedades`
2. Navegar catálogo público
3. Registrarse en `/:slug/register`
4. Acceder a su portal en `/:slug/portal/dashboard`

---

## 📞 Ejemplos de URLs Reales

```
# Landing page
http://localhost:4200/

# Registro de nueva empresa
http://localhost:4200/register

# Login de empresa "inmobiliaria-abc"
http://localhost:4200/inmobiliaria-abc/login

# Dashboard de admin
http://localhost:4200/inmobiliaria-abc/dashboard

# Catálogo público
http://localhost:4200/inmobiliaria-abc/publico/propiedades

# Registro de inquilino
http://localhost:4200/inmobiliaria-abc/register

# Portal del inquilino
http://localhost:4200/inmobiliaria-abc/portal/dashboard
http://localhost:4200/inmobiliaria-abc/portal/pagos
http://localhost:4200/inmobiliaria-abc/portal/mantenimiento
```

---

## ✅ Estado Actual del Sistema

- ✅ Landing page funcional
- ✅ Registro de empresas (admin)
- ✅ Login unificado (admin e inquilino)
- ✅ Slug dinámico en URLs
- ✅ Registro de inquilinos por slug
- ✅ Dashboard admin
- ✅ Portal inquilino
- ✅ Navegación con rutas dinámicas
- ✅ Conexión con backend completa

---

## 📝 Notas Importantes

- El slug se genera automáticamente a partir del nombre de la empresa
- Un mismo email no puede registrarse en la misma empresa dos veces
- Los inquilinos solo ven información de su contrato
- Los admins ven toda la información de su empresa
- El sistema es escalable: soporta infinitas empresas

---

**Última actualización:** Febrero 2026
**Branch:** `jhammil`
**Estado:** ✅ Funcional y en producción
