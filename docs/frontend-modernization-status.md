# Estado De Modernizacion Frontend

Este documento sirve como checklist operativo para saber que ya se cambio, que
falta y que riesgos siguen abiertos durante la reestructuracion del frontend.
No reemplaza a `docs/frontend-modernization.md`; lo complementa con estado real.

## Objetivo Actual

Reestructurar el frontend antes de seguir agregando features grandes, con una
arquitectura similar en calidad a la del backend:

- UI moderna y consistente.
- Componentes compartidos propios.
- Menos acoplamiento directo a Angular Material.
- Fuente self-hosted y build reproducible.
- Servicios HTTP/tokens centralizados.
- Rutas lazy y bundles controlados.
- Codigo nuevo sin `any`, logs productivos ni acceso directo innecesario a
  storage.

## Decisiones Tomadas

- Libreria visual nueva: **Taiga UI**.
- Fuente global: **Plus Jakarta Sans**, self-hosted con Fontsource.
- Iconos: **Lucide**.
- Angular Material queda solo como dependencia de transicion.
- Material Icons queda self-hosted temporalmente mientras existan `mat-icon`.
- Las pantallas nuevas deben consumir wrappers `app-*` desde `src/app/shared/ui`.
- El cliente HTTP nuevo para codigo nuevo es `ApiClientService`.
- La seleccion de token vive en `SessionTokenService`.

## Hecho

### Base Visual

- [x] Instalada la fuente `@fontsource-variable/plus-jakarta-sans`.
- [x] Removidos Google Fonts y Material Icons externos de `index.html`.
- [x] Material Icons queda self-hosted con `@fontsource/material-icons`.
- [x] Taiga UI instalado.
- [x] `TuiRoot` agregado en `app.html`.
- [x] Tokens globales agregados en `styles.scss`.
- [x] Body usa Plus Jakarta Sans.
- [x] Build Docker reproducible corregido:
  - [x] Dependencias runtime de Taiga declaradas explicitamente en
    `package.json`.
  - [x] `@taiga-ui/design-tokens`, `@ng-web-apis/*`, `@maskito/*`,
    `@taiga-ui/polymorpheus` y `libphonenumber-js` quedan instaladas por
    `npm ci`.
  - [x] `docker compose run --rm frontend npm run build` pasa.
- [x] Shell principal empezo modernizacion fuera de Material:
  - [x] `main-layout` usa tokens propios.
  - [x] `sidebar` usa tokens propios.
  - [x] `header` ya no usa `mat-toolbar` ni botones Material.
  - [x] `header` ya no usa `mat-menu`.
  - [x] Menu de usuario del header reemplazado por panel propio con overlay.

### Wrappers UI Creados

- [x] `app-button`
  - [x] Soporte `type` y `fullWidth` para formularios.
- [x] `app-text-field`
- [x] `app-textarea`
- [x] `app-select`
- [x] `app-checkbox`
- [x] `app-date-picker`
- [x] `app-file-upload`
- [x] `app-table`
- [x] `app-dialog`
- [x] `app-confirm-dialog`
- [x] `app-stepper`
- [x] `app-page-header`
- [x] `app-status-badge`
- [x] `app-empty-state`
- [x] `app-loading-state`
- [x] `app-toast` / adapter de notificaciones UI

Pendientes posibles segun avance de modernizacion:

- [x] `app-pagination`
- [x] `app-tabs`
- [x] `app-segmented-control`
- [x] `app-toolbar`

### Routing Y Bundle

- [x] `app.routes.ts` dejo de importar pantallas admin pesadas directamente.
- [x] Rutas admin separadas en `src/app/features/admin/admin.routes.ts`.
- [x] Pantallas admin cargan con `loadComponent`.
- [x] Bundle inicial bajo de aproximadamente 2.46 MB a ~693 KB en build
  production.

### Seguridad Y Tokens

- [x] `SessionTokenService` creado para `admin`, `tenant` y `owner`.
- [x] `authInterceptor` usa `SessionTokenService`.
- [x] `module.guard.ts` falla cerrado ante error de permisos.
- [x] Redirect sin slug corregido a `/login`.
- [x] Headers `Authorization` manuales eliminados en servicios seleccionados:
  - [x] `AdminUserService`
  - [x] `AdminContractService`
  - [x] `TenantPropertyService`
  - [x] `TenantContractService`
  - [x] `TenantNotificationService`
  - [x] `TenantMaintenanceService`

Pendiente:

- [ ] Revisar si `AuthService` y `TenantAuthService` pueden validar `/auth/me`
  usando interceptor sin headers manuales.
- [ ] Confirmar flujo owner con `owner_access_token` cuando se migre owner portal.
- [ ] Reducir acceso directo a storage desde componentes.

### HTTP Y Servicios

- [x] `ApiClientService` creado en `src/app/core/http/api-client.service.ts`.
- [x] `ApiService` delega en `ApiClientService`.
- [x] `ApiHttpService` delega en `ApiClientService`.
- [x] Tests unitarios de `ApiClientService` agregados:
  - [x] URL relativa/absoluta.
  - [x] Query params.
  - [x] Headers JSON vs `FormData`.
  - [x] Normalizacion de errores.

Pendiente:

- [ ] Migrar servicios de dominio a `ApiClientService` directo.
- [ ] Eliminar o reducir `ApiService` y `ApiHttpService` cuando no haya
  dependencias.
- [ ] Tipar DTOs/modelos para reducir `any`.
- [ ] Separar servicios API de facades de estado por dominio.

### Limpieza

- [x] Eliminados archivos `.bak` dentro de `src`.
- [x] Documentacion principal actualizada:
  - [x] `README.md`
  - [x] `docs/frontend-modernization.md`
  - [x] `docs/frontend-modernization-status.md`

### Auth Modernizado

- [x] `features/auth/login.component.ts` usa wrappers `app-*` en inputs,
  checkbox y boton principal.
- [x] `features/auth/forgot-password.component.ts` usa wrappers `app-*` y ya
  no depende de Material.
- [x] `features/tenant-portal/auth/tenant-login.component.ts` usa wrappers
  `app-*` y ya no depende de Material.
- [x] `features/auth/register.component.ts` usa `app-stepper`, `app-dialog`,
  `app-select`, `app-checkbox`, `app-text-field` y `app-button`.
- [x] `features/auth/register.component.ts` ya no depende de Material.
- [x] `tenant-login` usa `takeUntilDestroyed` para evitar suscripciones vivas.
- [x] Promesa de navegacion de `tenant-login` marcada con `void`.

Pendiente:

- [ ] Extraer textos legales de `register.component.ts` a componentes/archivos
  dedicados cuando se haga la siguiente limpieza de Auth.
- [ ] Agregar tests de flujo para cambio de pasos y validaciones de registro.

### Dashboard Admin

- [x] `features/dashboard/dashboard.component.*` usa `app-page-header`.
- [x] Accion principal del dashboard usa `app-button`.
- [x] Se eliminaron tokens `var(--mat-*)` del dashboard.
- [x] Banner de acceso denegado usa icono Lucide en vez de emoji.

### Empleados

- [x] `features/empleados/empleados.component.*` ya no importa Angular
  Material.
- [x] Header usa `app-page-header` y acciones con `app-button`.
- [x] Tabla Material reemplazada por tabla HTML semantica responsive.
- [x] Loading y empty/error states usan wrappers compartidos.
- [x] Dialog de creacion reemplazado por `app-dialog` controlado con
  `input/output`.
- [x] Formulario de creacion usa `app-text-field` y `app-button`.
- [x] Panel de permisos ya no usa `MatSlideToggle`, `MatSnackBar` ni
  `MatDialog`.
- [x] Toggles de permisos usan controles nativos estilados.
- [x] Feedback usa `ToastService`; desactivacion usa `ConfirmDialogService`.

Pendiente:

- [ ] Extraer facade de empleados para separar estado, permisos y operaciones.
- [ ] Agregar tests del flujo crear empleado, guardar permisos y activar /
  desactivar.

### Configuracion / Wizard Setup

- [x] `features/configuracion/configuracion.component.ts` ya no importa
  Angular Material.
- [x] Pantalla general de configuracion usa `app-page-header`,
  `app-checkbox` y `app-select`.
- [x] Cards/dividers/toggles/selects Material reemplazados por UI propia.
- [x] `console.error` productivo eliminado del flujo de guardado local.
- [x] `features/configuracion/wizard-setup/wizard-setup.component.ts` ya no
  importa Angular Material.
- [x] `mat-stepper` reemplazado por `app-stepper` y navegacion con signal
  `currentStep`.
- [x] Selects, inputs numericos y acciones migrados a `app-select`,
  `app-text-field` y `app-button`.
- [x] Cards, divisores, spinner y botones Material reemplazados por UI propia.
- [x] Guardado mantiene la misma integracion con `TenantConfigService`.
- [x] Navegacion final al dashboard marcada con `void`.

Pendiente:

- [ ] Extraer pasos a componentes si el wizard crece.
- [ ] Agregar tests de validacion de pasos, defaults por pais y guardado final.

### Perfil Admin

- [x] `features/perfil/admin-perfil.component.ts` ya no importa Angular
  Material.
- [x] Header usa `app-page-header`.
- [x] Tabs Material reemplazados por `app-tabs`.
- [x] Formularios de perfil y contrasena usan `app-text-field` y
  `app-button`.
- [x] Cards, divider, spinner y tokens `var(--mat-*)` reemplazados por UI
  propia y tokens `--app-color-*`.

Pendiente:

- [ ] Conectar feedback global con `ToastService` si se decide sacar alerts
  embebidos.
- [ ] Agregar tests de guardado de perfil y cambio de contrasena.

### Pagos

- [x] `PaymentService` empezo limpieza de tipado:
  - [x] Respuestas crudas tipadas antes de normalizar montos.
  - [x] `metadata` usa `unknown` en vez de `any`.
  - [x] Errores se propagan con `throwError(() => error)`.
- [x] `features/pagos/pagos.component.ts` empezo limpieza sin cambiar aun toda
  la UI:
  - [x] Autocomplete de inquilinos tipado con `AdminTenantUser`.
  - [x] Removidos `console.*` productivos de acciones de pagos.
  - [x] Mensajes de error centralizados en helpers tipados.
  - [x] Eliminado cast `payment.tenant as any`.
  - [x] Feedback de exito usa `ToastService` propio en vez de `MatSnackBar`.
  - [x] Confirmaciones y prompts de pagos usan `ConfirmDialogService`.
  - [x] Ya no hay `alert/confirm/prompt` en `features/pagos`.
  - [x] Header de pagos usa `app-page-header` y `app-button`.
  - [x] Estadisticas extraidas a `components/payment-stats`.
  - [x] Filtros principales y filtros de aprobacion usan `app-select`,
    `app-date-picker` y `app-button`.
  - [x] Badges de estado usan `app-status-badge`.
  - [x] Acciones principales de pendientes, masivas, detalle y creacion usan
    `app-button`.
  - [x] Tabla Material reemplazada por `components/payment-table`.
  - [x] `mat-card`, `mat-table`, `mat-checkbox`, `mat-chip` y `mat-tooltip`
    eliminados de `features/pagos`.
  - [x] Modales de detalle, comprobante, rechazo y creacion usan `app-dialog`.
  - [x] Formulario de rechazo usa `app-textarea`.
  - [x] Formulario de creacion manual reemplazo campos principales, datos de
    metodo, fechas y notas con wrappers `app-*`.
  - [x] `features/pagos/pagos.component.ts` ya no importa Angular Material.

Pendiente:

- [ ] Extraer formulario de creacion a `components/payment-create-form`.
- [ ] Separar pantalla de pagos en `pages`, `components`, `dialogs`,
  `facades/models`.

### Contratos

- [x] `features/contratos/contratos.component.ts` ya no importa Angular
  Material.
- [x] Header usa `app-page-header` y accion principal con `app-button`.
- [x] Cards metricas y contenedor de listado dejaron de usar `mat-card`.
- [x] Filtros usan `app-text-field`, `app-select` y `app-button`.
- [x] Estado de contrato usa `app-status-badge`.
- [x] Acciones de tabla usan botones/enlaces nativos con iconos Lucide.
- [x] Renovacion reemplazo `confirm/alert` por `ConfirmDialogService` y
  `ToastService`.
- [x] `contract-detail` empezo limpieza de acciones criticas:
  - [x] Renovacion ya no usa `confirm/alert`; usa `ConfirmDialogService` y
    `ToastService`.
  - [x] Finalizacion ya no usa `confirm/alert`; usa `ConfirmDialogService` y
    `ToastService`.
- [x] `contract-create` ya no importa Angular Material.
  - [x] Formulario usa `app-select`, `app-date-picker`, `app-text-field`,
    `app-loading-state` y `app-button`.
  - [x] Servicios incluidos usan checkboxes nativos estilados.
  - [x] Eliminados `MatCard`, `MatFormField`, `MatSelect`, `MatDatepicker`,
    `MatCheckbox`, `MatIcon` y spinner Material.
  - [x] Eliminado `event: any` y `console.error` del flujo.
- [x] `contract-edit` ya no importa Angular Material.
  - [x] Formulario usa wrappers `app-*` para fechas, inputs, selects,
    textarea, loading y botones.
  - [x] Servicios incluidos y auto-renew usan controles nativos estilados.
  - [x] Eliminado `event: any` y errores del submit tipados.
- [x] `contract-detail` ya no importa Angular Material.
  - [x] Cards reemplazadas por secciones propias.
  - [x] Spinner reemplazado por `app-loading-state`.
  - [x] `mat-icon` reemplazado por Lucide.
  - [x] Botones de acciones reemplazados por `app-button`.

Pendiente:

- [ ] Extraer tabla/listado a componentes presentacionales.
- [ ] Extraer formularios create/edit a componentes/facade reutilizables.
- [ ] Agregar tests de flujo crear/editar/renovar/finalizar.

### Propiedades Y Unidades

- [x] Vista principal `features/propiedades/propiedades.component.html`
  modernizada:
  - [x] Header usa `app-page-header`.
  - [x] Filtros usan `app-text-field`, `app-select` y `app-button`.
  - [x] Loading usa `app-loading-state`.
  - [x] Estados de propiedad usan `app-status-badge`.
  - [x] Acciones principales de cards usan `app-button` o botones nativos.
  - [x] Confirmacion de borrado usa `app-dialog`.
  - [x] Feedback usa `ToastService` en vez de `MatSnackBar`.
  - [x] Modal crear/editar ya no usa `mat-form-field`, `mat-select`,
    `mat-input` ni spinner Material.
  - [x] Modal crear/editar usa wrappers `app-text-field`, `app-textarea`,
    `app-select`, `app-file-upload` y `app-button`.
  - [x] DTO local de guardado tipado; se redujeron casts `any`.
- [x] `property-detail-admin` modernizado:
  - [x] Loading usa `app-loading-state`.
  - [x] Tabs usan `app-tabs`.
  - [x] Chips de amenities/items son UI propia.
  - [x] Botones principales usan `app-button`.
  - [x] Removidos `MatSnackBar`, `mat-tab`, `mat-chip`, spinner y
    `console.error`.
- [x] `property-units` modernizado:
  - [x] Tabla Material reemplazada por tabla HTML semantica.
  - [x] Modal de unidad convertido a componente controlado por `input/output`
    sobre `app-dialog`.
  - [x] Formulario de unidad usa `app-text-field`, `app-select` y
    `app-button`.
  - [x] Detalle de unidad ya no usa botones/divider Material.
  - [x] Feedback usa `ToastService`; borrado usa `ConfirmDialogService`.

Pendiente:

- [ ] Separar `propiedades.component` en `pages/components/facade/models`.
- [ ] Extraer formulario crear/editar propiedad a componente dedicado.
- [ ] Extraer cards y filtros a componentes presentacionales.

### Mantenimiento

- [x] `features/mantenimiento/mantenimiento.component.ts` ya no importa Angular
  Material.
- [x] Header usa `app-page-header`.
- [x] Filtros usan `app-text-field`, `app-select` y `app-button`.
- [x] Estado de solicitud usa `app-status-badge`.
- [x] Menu Material de acciones rapidas fue reemplazado por botones nativos.
- [x] `console.*`, `confirm` y `alert` productivos del listado fueron
  reemplazados por `ToastService` y `ConfirmDialogService`.
- [x] `RequestDetailComponent` modernizado:
  - [x] Dialog heredado de Material reemplazado por `app-dialog` controlado
    desde el listado.
  - [x] Botones, selects, datepicker, checkbox y loading migrados a wrappers
    `app-*`.
  - [x] `alert`, `confirm` y `console.*` productivos reemplazados por
    `ToastService` y `ConfirmDialogService`.
- [x] Vista tecnico y `order-detail` modernizados:
  - [x] Removidos `MatButton`, `MatProgressSpinner` y `MatSnackBar`.
  - [x] Acciones principales usan `app-button`.
  - [x] Loading usa `app-loading-state`.
  - [x] Feedback usa `ToastService`.

Pendiente:

- [ ] Separar cambios de estado/prioridad en componentes o facade del dominio.

### Tenant Portal

- [x] `features/tenant-portal/dashboard/tenant-dashboard.component.ts` ya no
  importa Angular Material.
- [x] Dashboard tenant reemplazo `mat-card` y `mat-chip` por secciones propias y
  `app-status-badge`.
- [x] Dashboard tenant usa tokens `--app-color-*` en vez de `var(--mat-*)`.
- [x] `features/tenant-portal/layout/tenant-layout.component.ts` ya no importa
  Angular Material.
- [x] Layout tenant reemplazo `mat-menu`, `matBadge` y botones Material por
  controles nativos estilados.
- [x] Layout tenant elimino `console.error` productivo del chequeo de contratos.
- [x] `features/tenant-portal/home-pre-contract/home-pre-contract.component.ts`
  ya no importa Angular Material.
- [x] Home pre-contrato reemplazo `mat-card`, botones Material, `mat-spinner` y
  chips por wrappers `app-*` y layout propio.
- [x] `features/tenant-portal/payments/tenant-payments-list.component.ts` ya no
  importa Angular Material.
- [x] Listado de pagos tenant reemplazo cards, calendario, loading y tabla por
  UI propia y wrappers compartidos.
- [x] Estados de pagos tenant usan `app-status-badge`.
- [x] `tenant-create-payment` inicio separacion arquitectonica:
  - [x] `tenant-create-payment.facade.ts` extrae opciones, normalizacion de
    moneda/metodo y calendario de cuotas.
  - [x] Eliminado `any` del calendario de cuotas.
  - [x] Eliminados `console.error` productivos del flujo base de carga/submit.
  - [x] Tests unitarios de facade agregados para aliases, prefills y calendario.
  - [x] Calendario de cuotas extraido a
    `components/tenant-payment-schedule.component.ts`.
  - [x] Calendario ya no depende de Angular Material ni estilos embebidos en
    el componente padre.
  - [x] Carga, preview y zoom de comprobante extraidos a
    `components/tenant-payment-receipt-upload.component.ts`.
  - [x] Panel QR extraido a `components/tenant-payment-qr-panel.component.ts`.
  - [x] QR y comprobante ya no usan Angular Material directo.
  - [x] Formulario base, campos por metodo, notas y progreso de subida migrados
    a wrappers `app-*`.
  - [x] Resumen de contrato extraido a
    `components/tenant-contract-payment-summary.component.ts`.
  - [x] Estados de exito QR/manual extraidos a
    `components/tenant-payment-success-state.component.ts`.
  - [x] `tenant-create-payment.component.ts` ya no importa Angular Material.
- [x] Documentos y contratos tenant modernizados:
  - [x] `tenant-documents.component.ts` usa `app-page-header`, `app-tabs`,
    `app-status-badge`, `app-loading-state`, `app-empty-state`,
    `ToastService` y `ConfirmDialogService`.
  - [x] `tenant-contract-list.component.ts` usa `app-select`,
    `app-status-badge` y wrappers compartidos.
  - [x] `tenant-contract-detail.component.ts` ya no usa `MatDialog` ni
    componentes Material.
  - [x] Dialogs de firma convertidos a componentes controlados por
    `input/output` sobre `app-dialog`.
  - [x] Eliminados `alert`, `confirm`, `console.*` y `any` del bloque
    `documents/dialogs` del portal tenant.
- [x] Perfil/configuracion tenant modernizado:
  - [x] `tenant-profile.component.ts` ya no importa Angular Material.
  - [x] Perfil usa `app-page-header`, `app-tabs`, `app-text-field`,
    `app-button` y `app-status-badge`.
  - [x] Validador de confirmacion de contrasena tipado sin `any`.
- [x] Mis solicitudes tenant modernizado:
  - [x] `my-applications.component.ts` ya no importa Angular Material.
  - [x] Tabs, cards, loading, empty states y botones reemplazados por wrappers
    `app-*`.
  - [x] `alert` de detalle reemplazado por `ToastService`.
  - [x] Eliminado `any` de tabs/eventos.
- [x] Marketplace de solicitudes tenant modernizado:
  - [x] `new-application.component.ts` ya no importa Angular Material.
  - [x] Filtros reemplazados por `app-text-field` y `app-select`.
  - [x] Cards de propiedades, loading, empty state y paginacion simple usan UI
    propia.
  - [x] Eliminado `$any`, casts `any` de filtros y `MatPaginator`.
- [x] Mantenimiento tenant modernizado:
  - [x] `tenant-maintenance-list.component.ts` ya no importa Angular Material.
  - [x] Lista tenant usa `app-button`, `app-text-field`, `app-empty-state`,
    `app-loading-state` y `app-status-badge`.
  - [x] Eliminados `any` de mensajes/categorias en la lista.
  - [x] `tenant-create-request.component.ts` ya no importa Angular Material.
  - [x] Formulario de creacion reemplazo cards, campos, radio, checkbox y
    spinner Material por UI propia y wrappers `app-*`.
  - [x] `tenant-request-detail.component.ts` ya no importa Angular Material.
  - [x] Detalle tenant reemplazo chips, boton de retorno, boton principal y
    spinner de envio por UI propia/wrappers compartidos.
  - [x] Estado, carga, envio, adjuntos, polling y lectura de mensajes extraidos
    a `tenant-request-detail.facade.ts`.
  - [x] Panel de resumen extraido a
    `components/tenant-maintenance-summary-panel.component.ts`.
  - [x] Conversacion, mensajes, adjuntos y upload UI extraidos a
    `components/tenant-maintenance-conversation.component.ts`.
  - [x] `tenant-request-detail.component.ts` queda como orquestador de ruta y
    layout.

Pendiente:

- [ ] Modernizar pagos del tenant:
  - [x] `tenant-payments-list`.
  - [x] `tenant-create-payment` formulario base y datos de metodo.
  - [x] `tenant-create-payment` estados de exito.
  - [ ] `tenant-create-payment` ultimo corte de orquestacion/facade.
  - [x] QR tenant dentro de `tenant-create-payment`.
  - [x] Listado standalone de QR tenant `tenant-qr-payments-list` ya no usa
    Angular Material.
  - [x] Comprobante/recibos dentro de `tenant-create-payment`.
- [x] Modernizar documentos/contratos tenant.
- [x] Modernizar perfil/configuracion tenant.
- [ ] Modernizar wizard de solicitudes del tenant:
  - [x] Entrada/marketplace `new-application`.
  - [x] `application-wizard.component.ts`.
  - [x] Steps internos `step-1`, `step-2`, `step-3`.
  - [x] `mat-stepper` reemplazado por `app-stepper` y navegacion centralizada
    en el componente padre.
  - [x] Campos Material reemplazados por `app-text-field`, `app-select` y
    `app-date-picker`.
- [ ] Extraer facades por dominio del portal tenant restante.

### Solicitudes / Applications

- [x] `features/solicitudes/solicitudes.component.*` ya no importa Angular
  Material.
- [x] Cards metricas, filtros, loading, error y tabla reemplazados por UI propia
  y wrappers compartidos.
- [x] Estado de solicitud usa `app-status-badge`.
- [x] Filtros usan `app-text-field` y `app-select`.
- [x] Tabla Material reemplazada por tabla HTML semantica responsive.
- [x] Detalle de solicitud modernizado:
  - [x] `application-detail.component.ts` usa
    `application-detail.facade.ts` para carga, error y reglas de estado.
  - [x] `application-detail.component.html` ya no usa `mat-card`,
    `mat-spinner`, `mat-chip` ni botones Material.
  - [x] Vista de detalle usa `app-button`, `app-loading-state`,
    `app-empty-state` y `app-status-badge`.
- [x] Dialog de rechazo modernizado:
  - [x] `reject-dialog` ya no importa Angular Material.
  - [x] Formulario usa `app-textarea`, `app-button` y `app-loading-state`.
  - [x] Errores tipados sin `any`.
- [x] Dialog de aprobacion modernizado:
  - [x] `approve-dialog` ya no importa Angular Material.
  - [x] Cards, inputs, selects, checkbox, datepicker, spinner y botones
    migrados a wrappers `app-*` o UI propia.
  - [x] Payload numerico normalizado antes de llamar al backend.
  - [x] Errores tipados sin `any`.
- [x] `ApplicationService` redujo deuda:
  - [x] Removido `console.log` productivo de detalle.
  - [x] Filtros usan `Record<string, string | number>` en vez de `any`.
  - [x] Rechazo usa `ApplicationStatus.RECHAZADA` sin cast `any`.

Pendiente:

- [ ] Separar listado en `pages`, `components`, `facade`, `models`.
- [ ] Revisar flujo de aprobacion/rechazo completo con tests.

### Modulos Que Aun No Existen Como Frontend Completo

Estos bloques siguen siendo funcionalidad pendiente real, no solo
modernizacion:

- [x] Owner Portal frontend inicial:
  - [x] Servicio `OwnerPortalService`.
  - [x] Ruta `/:slug/owner`.
  - [x] Dashboard, propiedades, liquidaciones, mantenimiento y contratos en
    una primera vista funcional.
- [x] Reports frontend inicial:
  - [x] Ruta admin `/reportes`.
  - [x] KPIs y reportes `rent-roll`, `vacancies`, `delinquency`, `pnl`.
- [x] Vendors / proveedores frontend inicial.
- [x] Expenses / gastos frontend inicial.
- [x] Violations / violaciones frontend inicial.
- [x] Inspections / inspecciones frontend inicial.

Pendiente de estos modulos:

- [ ] Formularios completos de creacion/edicion.
- [ ] Detalles por registro.
- [ ] Exportaciones PDF/Excel desde UI cuando aplique.
- [ ] Tests por servicio y flujo.

### Notifications

- [x] `features/notifications/notifications.component.*` ya no importa Angular
  Material.
- [x] Botones migrados a `app-button`.
- [x] Loading y empty state usan wrappers compartidos.
- [x] Eliminado `confirm` nativo; borrado usa `ConfirmDialogService`.
- [x] Eliminado `$any`/`any` del icon resolver.

### Portal Publico

- [x] `portal-publico/tenant-register` ya no importa Angular Material.
- [x] Formulario de registro tenant usa `app-text-field` y `app-button`.
- [x] Password toggles usan botones propios con Lucide.

- [x] `portal-publico/home` ya no importa Angular Material; usa signals, OnPush y
  control flow moderno.
- [x] `portal-publico/property-list` ya no importa Angular Material; usa signals,
  OnPush y wrappers `app-*`.
- [x] `portal-publico/property-detail` ya no usa `console.*`, `alert` ni `any`;
  migrado a signals, OnPush y control flow moderno.
- [x] `portal-publico/application-form` ya no usa `confirm`, `console.*` ni `any`
  descontrolado; migrado a signals y `ConfirmDialogService`.
- [x] `tenant-portal/notifications` ya no importa Angular Material; usa
  `app-button`, `app-loading-state`, `app-empty-state` y `ConfirmDialogService`.
- [x] `tenant-portal/payments/tenant-qr-generate` ya no importa Angular Material;
  usa `app-button`, `app-select`, `app-text-field` y tokens propios.
- [x] `tenant-portal/messages/tenant-messages` ya no importa Angular Material;
  migrado de 973 lineas a componente limpio con `app-button`, `app-select`,
  `app-text-field`, `app-textarea` y `ToastService`.

### Cierre Final (quinta ronda) — 0 Angular Material en todo el proyecto

- [x] `login.component` migrado a `app-text-field`, `app-checkbox`, `app-button`;
  sin Material, sin `console.*`.
- [x] `tenant-register.component` migrado a wrappers `app-*`; sin Material.
- [x] Showcase `componentes` eliminado (era demo, no estaba en el menú).
- [x] **0 Angular Material, 0 `console.*` productivos, 0 `alert/confirm/prompt`,
  0 `mat-*` en templates** en todo `src/app`.
- [x] Los 7 servicios migrados a `ApiClientService` directo; `ApiService` y
  `ApiHttpService` eliminados. Headers `Authorization` manuales de
  admin-contract/admin-user removidos (el interceptor los maneja).
- [x] Módulos genéricos (vendors, expenses, violations, inspections): detalle
  por registro (dialog read-only) + export CSV.
- [x] `reports`: export CSV del reporte activo.
- [x] Tests: 71 -> 125 (19 archivos spec). Nuevos: moduleGuard, permissions,
  slug, solicitudes/contratos facades, admin-operations, payment, unit y
  admin-contract services.

### Tests (cuarta ronda)

- [x] `moduleGuard` — 8 tests cubriendo ADMIN, SUPERADMIN, TECNICO (solo
  maintenance), EMPLEADO con/sin permiso, sin slug y fallo de carga.
- [x] `PermissionsService` — canView, role/allowedModules computed, clear.
- [x] `SlugService` — buildUrl, buildApiEndpoint (con/sin slug, sin duplicar).
- [x] `SolicitudesFacade` — carga, metricas, filtrado por estado/busqueda.
- [x] `ContratosFacade` — filtrado, hasActiveFilters, URLs, renovacion con/sin
  confirmacion.
- Total de tests: 71 -> 106 (15 archivos spec).
- Regresion corregida: `pagos` tenia `confirm`/`prompt`/`alert` nativos tras un
  `git checkout`; migrados a `ConfirmDialogService` + `ToastService`.
- `application-modal` migrado de `alert()` a `ToastService`.

### Refactor Arquitectonico (tercera ronda)

- [x] `solicitudes` extraido a `solicitudes.facade.ts` con signals/computed;
  componente reducido a orquestador, sin `ChangeDetectorRef`.
- [x] `contratos` y sus 3 subcomponentes (detail, edit, create) con template y
  estilos extraidos a `.html`/`.scss`; el `.ts` principal bajo de 1049 a 103
  lineas (los 4 suman ~890 lineas menos de TS inline).
- [x] `propiedades` eliminado el anti-patron `ChangeDetectorRef` +
  `markForCheck`: `propertyImageMap` convertido a signal, componente 100%
  signals + OnPush idiomatico. Ya tenia subcomponentes extraidos
  (property-units, unit-detail-panel, unit-form-dialog, property-detail-admin).
- [x] `pagos` tipado completo (0 `any`): autocomplete de inquilinos usa
  `AdminTenantUser`. Ya tenia `payment-stats` y `payment-table` extraidos.

### Base Tecnica Consolidada (segunda ronda)

- [x] Headers `Authorization` manuales eliminados de `AuthService` y
  `TenantAuthService`; el token se selecciona via `SessionTokenService` +
  `authInterceptor`.
- [x] `tenant-create-payment` migrado a constructor + `DestroyRef` (sin
  `OnDestroy`).
- [x] Dashboard admin con KPIs reales (`getReportsKpis`), `app-status-badge`,
  `app-loading-state` y grilla de 6 metricas tipadas.
- [x] `any` en servicios de dominio reducido de 33 a 1 (el ultimo es
  normalizacion documentada en el borde del sistema, con `eslint-disable`):
  - tenant-auth, tenant-contract, tenant-user, payment, property, admin-user,
    admin-contract y los metadata de notification quedaron tipados.
  - `ApiService.get` ahora acepta `QueryParams` ademas de `HttpParams`.
  - `throw error` en `catchError` reemplazado por `throwError(() => error)`
    donde el error estaba tipado.

## Validacion Actual

Ultima verificacion local:

- [x] `npm run build` pasa.
- [x] `npm run lint:check` pasa con `0 errors`.
- [x] `git diff --check` pasa.

Estado lint:

- Quedan aproximadamente `384 warnings` heredados (bajaron desde ~961).
- Principales causas restantes:
  - Accesos inseguros a propiedades de `any` en componentes grandes.
  - Promesas de router sin `void`.
  - Componentes grandes con mucha logica local (pagos, contratos, propiedades).

## Riesgos Abiertos

### Angular Material Todavia Muy Presente

Hay muchas referencias a:

- `MatFormFieldModule`
- `MatInputModule`
- `MatSelectModule`
- `MatDialogModule`
- `MatTableModule`
- `MatSnackBarModule`
- `MatCheckboxModule`
- `MatDatepickerModule`
- `MatMenuModule`

Esto no rompe ahora, pero significa que la modernizacion visual todavia esta en
fase base. No debemos crear nuevas pantallas con Material.

Pantallas fuertes pendientes de migrar:

- partes del portal publico

### Componentes Grandes

Hay pantallas del tenant portal y pagos con mucha logica en el componente.
Riesgo:

- Dificiles de testear.
- Dificiles de modernizar visualmente.
- Propensas a bugs cuando se agregan features.

Regla: al tocar una pantalla grande, extraer primero componentes
presentacionales/facades antes de sumar mas comportamiento.

### Tipado Debil

Los warnings por `any` son el principal indicador de deuda. No hace falta
arreglarlos todos de golpe, pero el codigo nuevo debe quedar tipado.

## Orden Recomendado Desde Aqui

### 1. Cerrar Shell Y Auth

- [x] Migrar login/admin auth con wrappers nuevos.
- [x] Migrar recuperacion de password con wrappers nuevos.
- [x] Migrar tenant login con wrappers nuevos.
- [x] Reemplazar registro/admin auth:
  - [x] `mat-stepper`.
  - [x] `mat-dialog`.
  - [x] `mat-select`.
  - [x] `mat-checkbox`.
- [x] Quitar `mat-menu` restante del header.
- Revisar guards y tokens owner/tenant/admin con flujos reales.

Motivo: define la experiencia inicial y la navegacion base.

### 2. Migrar Dashboard Admin

- [x] Usar `app-page-header` en dashboard base.
- [ ] Usar `app-status-badge`, `app-loading-state`, `app-empty-state` cuando el
  dashboard tenga datos reales/KPIs.
- Separar widgets/cards en componentes pequenos.
- Conectar con servicios/facades tipados.

Motivo: sera el ejemplo para el resto de modulos admin.

### 3. Atacar Modulos Criticos

Orden sugerido:

1. Completar modulos nuevos: Owner Portal, Reports, Vendors, Expenses,
   Violations e Inspections.
2. Pagos. Parcial avanzado; falta extraer formulario/facade.
3. Contratos. Listado y CRUD visual avanzado; falta extraer formularios,
   tabla y logica PDF/firma/renovacion.
4. Propiedades/unidades. UI avanzada; falta separar cards, filtros,
   formulario grande y facade.
5. Solicitudes. UI avanzada; falta separar listado en
   `pages/components/facade/models` y tests.
6. Pantallas Material restantes: portal publico, tenant messages,
   tenant notifications y QR generate.
7. Sitio publico.

### 4. Calidad Y Tests

- [x] Tests para `SessionTokenService`.
- Tests para `moduleGuard`.
- [x] Tests para `ApiClientService`.
- Tests para wrappers criticos si empiezan a contener logica.
- E2E por flujo cuando el modulo modernizado sea funcional.

## Regla Para No Pasarnos Nada

Cada modulo que se migre debe cerrar este checklist:

- [ ] Rutas lazy si aplica.
- [ ] Servicios usan `ApiClientService` o facade del dominio.
- [ ] No agrega `any` nuevo.
- [ ] No agrega `console.*` productivo.
- [ ] No agrega `mat-*` nuevo.
- [ ] Usa wrappers `app-*` para inputs, selects, botones, tablas y estados.
- [ ] Tiene loading state.
- [ ] Tiene empty state.
- [ ] Tiene error state.
- [ ] Respeta permisos/roles.
- [ ] Es responsive.
- [ ] Build pasa.
- [ ] Lint no agrega errores.

## Siguiente Paso Propuesto

Todos los modulos con Angular Material fuerte han sido migrados y la base
tecnica esta consolidada:

- [x] `CommonModule` eliminado de todos los componentes (54 archivos).
  Reemplazado por imports especificos: `NgClass`, `DecimalPipe`, `TitleCasePipe`,
  `AsyncPipe`, etc.
- [x] `console.*` productivos eliminados de todos los servicios y guards core.
- [x] `ngOnInit`/`ngOnDestroy` migrados a constructor + `DestroyRef` en todos
  los modulos criticos.
- [x] `landing.component` fuera de Angular Material.
- [x] 0 errores de lint. Build limpio.

Pasos restantes de calidad:

- Tests por modulo (moduleGuard, wrappers criticos, flujos de auth/pagos/contratos).
- Separar `pagos`, `contratos` y `propiedades` en presentacionales/facades
  completos si los componentes siguen creciendo.
- Revisar `AuthService` y `TenantAuthService` con headers manuales en `/auth/me`.
- Reducir `any` en servicios de dominio restantes (~500+ warnings heredados).
