# Actualización Frontend — Informe de Revisión General

> **Proyecto:** 365Soft — `GestionAlquileres_365Soft-frontend`
> **Stack:** Angular 21.1 · Taiga UI 5 · Tailwind 4 · Transloco · Sentry · Vitest
> **Fecha:** 2026-06-19
> **Alcance:** UI/UX, arquitectura, código limpio, reactividad, **seguridad**, **formularios**, accesibilidad, tests.

---

## 0. Resumen ejecutivo

La base de código es **madura y de alta higiene**. Las métricas automáticas son de las mejores que se ven en un proyecto de este tamaño (188 componentes): OnPush al 100%, cero `any`, cero `console.log`, cero TODOs, i18n completa sin strings hardcodeados.

Los problemas reales se concentran en **tres focos**:

1. **UX de los wizards** (portal de inquilino) — coincide con las quejas recibidas.
2. **Consistencia arquitectónica** — el patrón *facade* está aplicado a medias y existen varios "God components".
3. **Endurecimiento de seguridad y configuración de producción** — placeholders y Sentry sin activar.

| Área | Estado |
|---|---|
| Higiene de código | 🟢 Excelente |
| Reactividad (signals/OnPush) | 🟢 Muy bueno |
| i18n | 🟢 Completo |
| Formularios | 🟡 Funcional, con huecos de validación |
| Seguridad | 🟡 Correcto, requiere endurecimiento |
| UX wizards | 🔴 Problemas activos |
| Arquitectura / mantenibilidad | 🟡 Inconsistente (God components) |
| Accesibilidad | 🟡 Buena base, huecos puntuales |
| Tests | 🟡 Cobertura a verificar (probable < objetivo) |

---

## 1. Métricas de la base de código

| Métrica | Valor |
|---|---|
| Componentes (`.component.ts`) | 188 |
| Servicios | 50 |
| Facades | 31 |
| Modelos | 18 |
| Specs de test | 65 |
| Total `.ts` (sin spec) | 311 |

### Indicadores de calidad (positivos)

| Indicador | Resultado |
|---|---|
| Componentes con `OnPush` | **100%** |
| `any` explícito | **0** |
| `console.log/debug/warn` | **0** |
| `TODO/FIXME/HACK` | **0** |
| Strings UI hardcodeados (sin Transloco) | **0** |
| Streams largos (poll/socket) con limpieza | ✅ Sí |

---

## 2. UI / UX — Wizards (FOCO DE QUEJAS) 🔴

Los wizards del portal de inquilino concentran los problemas de experiencia. Existen **3 wizards distintos sin lógica compartida**: `application-wizard`, `wizard-setup` (configuración) y `property-form-dialog`.

### 2.1 CRÍTICO — Campos `readonly` + `required` que bloquean el avance
- **Archivo:** `application-wizard/steps/step-1-personal-info.component.ts` + `application-wizard.component.ts:336`
- `phone`, `full_name`, `email` se muestran `[readonly]="true"` (prellenados de la cuenta) pero conservan `Validators.required`.
- **Síntoma:** si la cuenta del inquilino no tiene teléfono, el formulario es inválido y **el usuario no puede corregirlo** (campo readonly). Queda atascado en el paso 1 sin explicación. **Probable causa #1 de las quejas.**
- **Fix:** quitar `required` de los campos readonly, o hacerlos editables cuando llegan vacíos.

### 2.2 CRÍTICO — Bug de fecha por zona horaria
- **Archivos:** `step-1:267`, `application-wizard.component.ts:550-552` y ~8 sitios más.
- `value.toISOString().slice(0, 10)` convierte la fecha a **UTC**. En todo el mercado objetivo (BO, GT, HN, US — offsets negativos) una fecha seleccionada **puede retroceder un día** al guardarse.
- **Fix:** helper `toDateOnly()` con componentes locales (`getFullYear/getMonth/getDate`), no UTC.

### 2.3 ALTO — Stepper no navegable, sin a11y
- **Archivo:** `shared/ui/stepper/stepper.component.ts`
- No se puede clicar para volver a un paso. Sin `aria-current` ni `aria-live`. En `<480px` **oculta todas las etiquetas** (solo se ven números).
- `@for (step of steps(); track step)` trackea por el texto del label → dos labels iguales rompen el render (usar `track $index`).
- **Fix:** `aria-current="step"`, región `aria-live`, navegación por clic a pasos completados, mostrar el label activo en mobile.

### 2.4 MEDIO — Sin scroll-to-top al cambiar de paso
- Ni `application-wizard` ni `wizard-setup` resetean el scroll al avanzar. En mobile el usuario aterriza a mitad de la página siguiente.
- **Fix:** `effect()` sobre `currentStep` que haga `scrollTo({ top: 0 })` del contenedor.

### 2.5 MEDIO — Doble fuente de verdad de validez (frágil con OnPush)
- **Archivo:** `application-wizard.component.ts:305-308`
- Los steps emiten signals `personalInfoValid` / `employmentHistoryValid`, pero `canGoNext()` ignora esos signals y lee `form.valid` **directamente** (no reactivo con OnPush).
- **Fix:** una sola fuente — usar los signals emitidos por los hijos.

### 2.6 Inconsistencias entre wizards
- `application-wizard` usa `@if` encadenado; `wizard-setup` usa `@switch`; estilos y clases distintas.
- `application-wizard` autosalva en `sessionStorage`; `wizard-setup` **no** persiste (recargas = pierdes todo).
- `wizard-setup` tiene `paymentsStep = this.fb.group({})` — **FormGroup vacío muerto** (los pagos viven en un signal aparte).
- **Fix:** patrón único de wizard (servicio/directiva `WizardController` o ampliar `app-stepper`).

---

## 3. Formularios 📝

### 3.1 Uso de validadores (frecuencia global)

| Validador | Usos |
|---|---|
| `Validators.required` | 132 |
| `Validators.min` | 34 |
| `Validators.minLength` | 16 |
| `Validators.email` | 13 |
| `Validators.max` | 8 |
| `Validators.pattern` | **5** |
| `Validators.maxLength` | **5** |
| `Validators.requiredTrue` | 1 |

**Observación:** muy pocos `pattern` y `maxLength`. La validación de **teléfono** es genérica (`/^[+]?[\d\s-()]+$/`) e **igual para todos los países** — no valida formato boliviano vs. estadounidense vs. guatemalteco.

### 3.2 Tipos de input (semántica/teclado móvil)

| `type` | Usos |
|---|---|
| `number` | 49 |
| `tel` | 14 |
| `email` | 14 |
| `date` | 6 |
| `password` | 1 (el resto vía design system) |

Bien en general: se usan tipos semánticos que mejoran el teclado en mobile.

### 3.3 Selección de país y cascada
- **`wizard-setup`** ✅ hace cascada correcta: al elegir país actualiza **métodos de pago disponibles + defaults + timezone** (`onCountryChange`, `wizard-setup.component.ts:177-194`).
- **`register`** ⚠️ el país es requerido (`country: ['BO']`) pero **no muestra al usuario** qué moneda/timezone/métodos de pago se aplicarán (el backend los inicializa). Hueco de transparencia UX: el usuario no ve las consecuencias de su elección.
- **Fix sugerido:** en register, mostrar un resumen reactivo ("Moneda: BOB · Zona: America/La_Paz") al elegir país.

### 3.4 Validación de contraseña
- ✅ `register` tiene validador cross-field `passwordMatchValidator` (`register.component.ts:125`).
- ⚠️ `password: minLength(6)` es **débil**. Recomendado: mínimo 8 + complejidad (mayúscula/número), sobre todo para el mercado EE.UU.
- ⚠️ Validadores de contraseña **duplicados** en 4 archivos (`register`, `reset-password`, `admin-profile`, `tenant-profile`) — no existe carpeta `core/validators/`. Candidato a DRY.

### 3.5 Recomendaciones de formularios
1. Crear `core/validators/` con validadores reutilizables (password match, fuerza de password, teléfono por país, CI/NIT).
2. Validación de teléfono adaptada al país seleccionado.
3. Subir el mínimo de contraseña a 8 + complejidad.
4. Mostrar feedback de la cascada de país en el registro.

---

## 4. Seguridad 🔒

### 4.1 Almacenamiento de tokens
- **Archivo:** `core/services/session-token.service.ts`
- Los JWT se guardan en `localStorage`/`sessionStorage` (`persistent ? localStorage : sessionStorage`).
- **Riesgo:** `localStorage` es accesible por JavaScript → vulnerable a robo de token vía XSS. Es el patrón habitual en SPAs, pero la mitigación ideal es **cookie `HttpOnly` + `SameSite`** (requiere cambio en backend).
- **Mitigación actual:** Angular sanitiza por defecto y no hay `any`/inyección obvia, lo que reduce la superficie XSS.

### 4.2 Interceptor de autenticación — adjunta token admin por defecto
- **Archivo:** `core/services/session-token.service.ts:37-44` (`getTokenForRequest`)
- Si la URL **no** contiene `/admin/ /tenant/ /owner/ /vendor/`, el interceptor **igualmente adjunta el token admin** (`return this.getToken('admin')`).
- **Riesgo latente:** cualquier petición futura vía `HttpClient` a un dominio externo recibiría el JWT del admin → **fuga de token a terceros**.
- **Estado actual:** mitigado porque la única llamada externa (geocoding Nominatim, `location-picker:255`) usa `fetch()` directo, **no** `HttpClient`. Pero el diseño es frágil.
- **Fix:** el interceptor solo debe adjuntar token a URLs que empiecen por `environment.apiUrl`; nunca a dominios externos. Cambiar el fallback de "admin por defecto" a "sin token".

### 4.3 XSS — `bypassSecurityTrust` e `innerHTML`
- `register.component.html:333,345`: `[innerHTML]="'auth.termsHtml' | transloco"` — contenido **estático de i18n** (no input de usuario) y Angular sanitiza `[innerHTML]`. Riesgo bajo.
- `shared/pipes/safe.pipe.ts` + `map-modal`: `bypassSecurityTrustResourceUrl` para un `<iframe>` de OpenStreetMap. La URL se construye con lat/lng numéricos → riesgo bajo, pero **conviene validar** que lat/lng sean numéricos antes de confiar.
- `tenant-qr-generate` / `tenant-payment-qr-flow`: `bypassSecurityTrustUrl(qr.qr_image)` sobre datos del backend. Aceptable si el backend solo devuelve `data:`/URLs propias; **revisar** que no acepte URLs arbitrarias.
- `safe.pipe.ts` usa **inyección por constructor** (`constructor(private sanitizer)`) — migrar a `inject()`.

### 4.4 Configuración de producción — GAPS 🔴
- **Archivo:** `src/environments/environment.production.ts`
- `apiUrl: 'https://tu-dominio-produccion.com/'` — **placeholder sin reemplazar**. Un deploy hoy apunta a un dominio inexistente.
- `sentryDsn: ''` — **vacío en producción** → el monitoreo de errores Sentry **no se activa** pese a estar integrado. Se pierde toda la telemetría de errores en prod.
- **Fix:** inyectar `apiUrl` y `sentryDsn` reales desde secrets de CI/CD antes del build.

### 4.5 Recomendaciones de seguridad (priorizadas)
1. 🔴 Configurar `apiUrl` y `sentryDsn` de producción (CI/CD).
2. 🟠 Restringir el interceptor a `environment.apiUrl`; fallback sin token.
3. 🟠 Evaluar migrar tokens a cookie `HttpOnly` (coordinar con backend).
4. 🟡 Endurecer política de contraseñas.
5. 🟡 Validar/whitelist de URLs en los `bypassSecurityTrust*`.

---

## 5. Arquitectura y mantenibilidad 🟠

### 5.1 Patrón *facade* aplicado a medias
13 features tienen facade (`properties`, `contracts`, `payments`, `reservations`, `violations`, `expenses`, `reports`, `vendors`, …). Otras con lógica pesada **no** lo tienen y concentran todo en el componente.

### 5.2 God components (> 500 LOC) — violan SRP/Clean Code

| Componente | LOC |
|---|---|
| `tenant-portal/new-application/new-application.component.ts` | **1138** |
| `tenant-portal/.../tenant-maintenance-conversation.component.ts` | **1114** |
| `maintenance/components/request-detail.component.ts` | 774 |
| `shared/ui/conversation/conversation.component.ts` | 709 |
| `public-portal/tenant-register/tenant-register.component.ts` | 689 |
| `tenant-portal/.../tenant-maintenance-list.component.ts` | 670 |
| `tenant-portal/auth/tenant-login.component.ts` | 663 |
| `tenant-portal/.../tenant-create-request.component.ts` | 652 |
| `tenant-portal/home-pre-contract/home-pre-contract.component.ts` | 598 |

La regla del proyecto pide funciones ~20 líneas / una responsabilidad. **Fix:** extraer facade + subcomponentes, empezando por `new-application`.

### 5.3 Cleanup de suscripciones — 3 patrones coexisten
- ✅ `toSignal` y `takeUntilDestroyed` (mayoría, correcto).
- ⚠️ `Subscription` manual + `ngOnDestroy` (`messages.component`) — funciona pero el `CLAUDE.md` lo **prohíbe**.
- 🔴 Fugas reales: `valueChanges.subscribe(...)` sin cleanup en `step-1:242` y `step-2:403`.
- **Fix:** unificar a `takeUntilDestroyed`/`toSignal`.

### 5.4 Casteos forzados `as unknown as` (12)
Indican **desalineación entre los modelos del front y los DTOs/payloads** (visible en `application-wizard.submitApplication`). El compilador deja de proteger. **Fix:** alinear tipos y mover el mapeo a un mapper/facade tipado.

### 5.5 Estado de carga fragmentado
40 componentes declaran su propio `isLoading`, y la UI mezcla **spinner** (`app-loading-state`) con **skeleton**. Ya se inició la migración a skeletons (Propiedades, Contratos). **Fix:** completar la unificación a skeletons en el resto del admin.

---

## 6. Accesibilidad (a11y) — ADA / mercado EE.UU. 🟡

- ✅ `aria-label` presente en 77 archivos; iconos decorativos con `aria-hidden`.
- ⚠️ 95 archivos usan iconos → auditar botones **icon-only** sin `aria-label`.
- ⚠️ `app-stepper` sin `aria-current`/`aria-live` (ver 2.3).
- ⚠️ Verificar manejo de foco al navegar entre pasos/diálogos y skip-links.
- **Fix:** auditoría a11y dedicada (foco, labels de iconos, contraste, navegación por teclado en wizards).

---

## 7. Responsive 🟢

- 39 anchos `px` fijos detectados, pero al inspeccionarlos son **decorativos** (círculos de fondo en login/landing), no contenedores principales.
- Patrón mobile-first presente; tablas con scroll horizontal.
- **Estado:** sano, sin acción urgente.

---

## 8. Tests 🟡

- **65 specs** para 188 componentes + 50 servicios + 31 facades.
- Objetivo del proyecto: **70% lines/functions, 60% branches**.
- **Acción:** correr `ng test --coverage` para medir el % real; probablemente los componentes están por debajo del objetivo. Priorizar tests de facades y de la lógica de wizards.

---

## 9. Plan de acción priorizado

### 🔴 P0 — Inmediato (afecta usuarios / producción)
- [x] **2.1** Quitar bloqueo de campos readonly del wizard de aplicación: los datos de cuenta quedan bloqueados solo si vienen prellenados; si llegan vacíos, el usuario puede completarlos.
- [x] **2.2** Helper `toDateOnly()` local y reemplazo de `toISOString().slice(0,10)` en fechas versionadas críticas (`application-wizard`, `date-picker`, reportes, gastos, inspecciones).
- [x] **2.3** `app-stepper`: `aria-current`, `aria-live`, navegación opcional por clic a pasos completados, label activo en mobile, `track $index`.
- [x] **2.4** Scroll-to-top al cambiar de paso en `application-wizard`.
- [x] **5.3** Cerrar fugas `valueChanges.subscribe` en los steps y en creación de solicitud de mantenimiento de inquilino.
- [ ] **4.4** Configurar `apiUrl` y `sentryDsn` de producción. **Bloqueado:** requiere valores reales/secretos de CI/CD; no deben inventarse en el repo.

### 🟠 P1 — Corto plazo (estabilidad / consistencia)
- [x] **2.5** Unificar fuente de validez en `application-wizard` usando los signals emitidos por los steps.
- [x] **4.2** Restringir interceptor a URLs absolutas bajo `environment.apiUrl`; no adjunta tokens a dominios externos ni rutas relativas.
- [x] **Propiedades / creación** Estabilizar modal de wizard, alinear formularios financieros/dirección, bloquear país según configuración del tenant, usar terminología administrativa por país, catálogo local de municipios bolivianos por departamento y geocodificación centralizada para mapa.
- [x] **Propiedades / edición y detalle** Ajustar payload parcial de actualización para campos soportados por backend, corregir claves de toast y mostrar mapa read-only en el detalle usando coordenadas guardadas o geocodificación de la dirección.
- [x] **Reservas de corto plazo / precios dinámicos** Administrar precios por temporada, ajuste de fin de semana, descuento anticipado, ajuste de última hora y ventanas mínima/máxima de reserva. El calendario público de dos meses obtiene una cotización autoritativa del backend, muestra el desglose y vuelve a validar disponibilidad al reservar.
- [x] **Reservas de corto plazo / integridad** Evitar solapamientos con reservas, bloqueos y contratos de largo plazo mediante reclamación transaccional de noches. Guardar el snapshot de la cotización y permitir al inquilino extender una reserva cobrando únicamente las noches añadidas, con historial auditable.
- [ ] **5.3** Migrar `Subscription` manual → `takeUntilDestroyed`.
- [ ] **5.5** Completar migración a skeletons en el admin.
- [ ] **5.4** Eliminar `as unknown as` alineando tipos.
- [ ] **3.5** `core/validators/` reutilizables + teléfono por país + password ≥ 8.

### 🟡 P2 — Medio plazo (mantenibilidad / calidad)
- [ ] **5.1/5.2** Extraer facades de God components (empezar por `new-application`).
- [ ] **2.6** Patrón único de wizard.
- [ ] `inject()` en los componentes con inyección por constructor.
- [ ] **6** Auditoría a11y completa.
- [ ] **8** Subir cobertura de tests al 70%.

### 🟢 P3 — Oportunista
- [ ] Persistencia de borrador en `wizard-setup`.
- [ ] Resumen de cascada de país en el registro.
- [ ] Whitelist de URLs en `bypassSecurityTrust*`.

---

## 10. Conclusión

El frontend tiene **fundamentos excelentes**. No requiere reescritura, sino **pulido dirigido**: arreglar la experiencia de los wizards (P0), endurecer la configuración de producción y seguridad (P0/P1), y reducir deuda de mantenibilidad en los componentes grandes (P2).

El mayor retorno inmediato está en **P0**: son cambios acotados que resuelven las quejas activas de usuarios y cierran riesgos reales de producción.
