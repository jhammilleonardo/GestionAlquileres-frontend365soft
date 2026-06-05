# Auditoria De Falencias Del Frontend

Ultima revision: 2026-06-04

Este documento resume las falencias pendientes del frontend de 365Soft desde
funcionamiento, estructura, arquitectura, modelo, metodologia, buenas practicas,
i18n, integracion con backend y experiencia de usuario.

## Avance Aplicado En Esta Iteracion

- Catalogo publico backend: se corrigio filtro/orden de precio para distinguir
  alquiler corto (`min_price_per_night`) y largo (`monthly_rent`).
- Catalogo publico backend: se corrigio `sort=available` para ordenar por
  unidades disponibles, no por `last_viewed_at`.
- Catalogo publico backend: se elimino el uso de `DISTINCT ON` que podia romper
  el orden global por precio/fecha.
- Catalogo publico frontend: home, listado y detalle ahora pueden mostrar precio
  por noche cuando la propiedad/unidad es de corto plazo.
- i18n portal publico: se agregaron claves para precio por noche, link copiado y
  mensajes de reserva/login.
- i18n wrappers compartidos: `app-toast-host`, `app-loading-state`,
  `app-pagination`, `app-stepper`, `app-table`, `app-file-upload` y confirm
  dialog ya usan claves traducibles para defaults, aria-labels y estados.
- i18n portal publico: navbar, footer, contacto, property-map y map-modal ya no
  dependen de `RentHub` ni de textos visibles fijos en espanol/ingles.
- Seguridad menor UI: el popup HTML de Leaflet ahora escapa titulo, precio,
  imagen y texto traducido antes de interpolar contenido.
- Arquitectura tenant register: se extrajo `tenant-register.facade.ts` para
  mover validacion de slug, formulario, registro, token, errores y redireccion
  post-registro fuera del componente visual.
- Tests tenant register: se agrego `tenant-register.facade.spec.ts` para slug
  invalido/reservado, registro con token, registro sin token y error de backend.
- Arquitectura tenant marketplace: se extrajo `new-application.facade.ts` para
  mover carga de propiedades, filtros, paginacion, ordenamiento corto/largo,
  apertura de reserva corta y restauracion de intencion fuera del componente.
- Tests tenant marketplace: se agrego `new-application.facade.spec.ts` para
  filtros LONG/SHORT, precio por noche, reserva corta, restauracion de intencion
  y errores de carga.
- i18n tenant layout: selector de idioma y tiempos relativos de notificaciones
  ya no devuelven textos fijos en espanol.
- Guards tenant: se corrigio redireccion de login tenant a `/:slug/login`.
- Guards tenant: las rutas de contratos del tenant ahora requieren contrato
  existente, permitiendo BORRADOR/PENDIENTE para revision/firma sin abrir pagos o
  mantenimiento.
- Tests: se agrego cobertura unitaria para guards del portal tenant.
- Portal publico: se corrigio la ruta de detalle de propiedad de
  `propiedades/:propertySlug` a `propiedades/:id`, alineandola con el componente
  y los enlaces del listado.
- Tenant marketplace: se eliminaron textos hardcodeados del flujo corto/largo y
  reserva; ahora usa i18n para modalidad, reserva, disponibilidad, unidades y
  errores.
- Tenant marketplace: el ordenamiento por precio ahora compara precio mensual o
  precio por noche segun la modalidad filtrada.
- E2E: se agrego `e2e/public-rental-flows.spec.ts` para cubrir listado publico,
  detalle y catalogo corto/largo cuando exista data seed.
- E2E: se agrego `e2e/route-smoke.spec.ts` para detectar pantallas blancas en
  portal publico, admin, tenant portal y owner portal con sesiones reales.
- Arquitectura portal publico: las rutas publicas principales ahora usan
  `loadComponent` lazy en lugar de imports/componentes directos.
- Owner portal demo: se completo el seed backend para crear usuarios
  `PROPIETARIO` idempotentes y validar login/token owner en entorno demo.
- i18n audit: se agrego `npm run i18n:audit` para medir textos visibles
  hardcodeados; estado actual: 164 candidatos pendientes.
- Validacion ejecutada:
  - backend: `npm test -- property-public-catalog.service.spec.ts` paso.
  - backend: `npm run build` paso.
  - backend Docker: `/health` respondio OK y el seed demo genero propiedades,
    unidades y usuarios owner.
  - frontend: `npm run build` paso.
  - frontend: `npm run lint` paso.
  - frontend: `npm run test` paso con 53 archivos y 281 tests.
  - frontend E2E publico corto/largo/BOTH:
    `npm run e2e -- public-rental-flows.spec.ts` paso 4/4 contra backend real.
  - frontend E2E rutas principales:
    `npm run e2e -- route-smoke.spec.ts` paso 4/4 contra frontend/backend
    levantados.

## Estado General

El frontend ya no esta en una etapa base rota: build, lint, tests y E2E de humo
han pasado en revisiones recientes; Angular Material ya no domina la UI; existen
wrappers propios (`app-button`, `app-dialog`, `app-table`, `app-tabs`,
`app-pagination`, etc.); la tipografia y tokens visuales ya estan mas
consistentes.

Lo que queda pendiente no es solo estetica. El mayor riesgo actual esta en:

- flujos de producto profundos que aun no estan validados end-to-end contra
  backend real con operaciones de escritura;
- i18n incompleta en uso, aunque las llaves ES/EN existentes esten balanceadas;
- componentes demasiado grandes con logica de UI, estado y API mezclada;
- reportes y modulos operativos en primera version;
- diferencias de modelo entre alquiler corto/largo plazo en catalogo publico;
- falta de pruebas profundas para pagos, solicitudes, contratos, owner portal y
  reserva corta.

## Metodologia De Revision

Se revisaron:

- rutas principales de admin, portal del inquilino, portal publico y owner portal;
- archivos mas grandes por lineas de codigo;
- uso de `localStorage`, `sessionStorage`, APIs de navegador y descargas;
- uso pendiente de textos hardcodeados y cobertura i18n;
- tests unitarios y E2E existentes;
- integracion esperada con backend, especialmente catalogo publico y alquiler
  corto/largo plazo.

## Hallazgos Criticos

### 1. i18n No Esta Completa En La Aplicacion

Aunque los archivos `public/i18n/es` y `public/i18n/en` tienen estructura pareja,
todavia hay muchos textos visibles escritos directamente en componentes y
templates.

Impacto:

- la aplicacion mezcla espanol e ingles en pantallas reales;
- el tenant no puede cambiar idioma de forma consistente;
- el portal publico y el portal del huesped pueden verse poco profesionales;
- los textos de accesibilidad tambien quedan en un idioma fijo.

Ejemplos detectados antes de la limpieza parcial:

- `src/app/shared/ui/file-upload/*`: textos como `Archivos seleccionados`.
- `src/app/shared/ui/table/*`: columna `Acciones`.
- `src/app/shared/ui/stepper/*`: texto `Progreso`.
- `src/app/features/auth/register.component.ts`: textos legales hardcodeados.
- `src/app/features/public-portal/*`: varios textos visibles del catalogo,
  mapa, detalle y formularios.
- `src/app/features/public-portal/tenant-register/*`: flujo de registro con
  textos directos.
- `src/app/features/tenant-portal/new-application/*`: textos de corto plazo y
  precios escritos directo.
- `src/app/features/properties/property-units/*`: estados, botones, tablas y
  labels sin traduccion completa.
- `src/app/features/owner-portal/*`: owner portal sigue mayormente hardcodeado.
- `src/app/features/reports/*`: UI avanzada, pero varias columnas/opciones salen
  desde labels hardcodeados en facade.

Estado aplicado:

- Wrappers compartidos principales ya usan Transloco para labels visibles y de
  accesibilidad.
- Portal publico navbar/footer/contact/map ya no muestra marca anterior ni textos
  duros del bloque revisado.
- Aun falta barrido profundo en pantallas grandes de auth, tenant portal, owner
  portal, units y reports.

Accion recomendada:

- crear scopes i18n por dominio faltante;
- prohibir nuevos textos visibles fuera de `transloco`;
- agregar un test/script que detecte texto visible hardcodeado en templates;
- traducir tambien `aria-label`, placeholders, tooltips, empty states, errores y
  toasts.

### 2. Catalogo Publico Tiene Riesgos De Modelo Para Alquiler Corto/Largo

El backend del catalogo publico ya expone `rental_type` y unidades, pero la
logica revisada muestra riesgos de alineacion con el frontend.

Riesgos detectados:

- filtros de precio del catalogo usan `monthly_rent`, pero alquiler corto deberia
  filtrar por `price_per_night` de la unidad;
- propiedades multifamiliares usan datos agregados de propiedad cuando varias
  decisiones reales dependen de la unidad;
- `sort=available` parece ordenar por `last_viewed_at`, no por disponibilidad
  real;
- el uso de `DISTINCT ON (p.id)` con `ORDER BY p.id, ...` puede impedir un orden
  global correcto por precio o fecha;
- el detalle publico puede exponer unidades ocupadas/reservadas si el frontend no
  filtra correctamente;
- busqueda publica no cubre suficiente: ciudad, direccion, unidad o amenidades.

Impacto:

- el usuario puede ver precios o disponibilidad incorrecta;
- el flujo de corto plazo puede seleccionar una unidad que no corresponde;
- filtros y ordenamientos del catalogo pueden parecer rotos aunque la UI funcione.

Accion recomendada:

- separar query de catalogo para `SHORT_TERM`, `LONG_TERM` y `BOTH`;
- calcular precio visible por unidad disponible;
- corregir `sort=available` para usar disponibilidad real;
- devolver metadata clara: `availableUnits`, `minMonthlyRent`, `minNightlyPrice`,
  `supportsShortTerm`, `supportsLongTerm`;
- agregar tests backend/frontend para filtros de corto plazo, largo plazo y ambos.

### 3. Flujos De Reserva/Solicitud No Estan Cerrados End-To-End

Se corrigio parte del flujo de corto plazo y registro, pero todavia falta una
validacion completa desde usuario publico hasta portal.

Casos que deben probarse:

- visitante elige propiedad `SHORT_TERM`, fechas, unidad y registra cuenta;
- visitante elige propiedad `LONG_TERM` y crea solicitud tradicional;
- propiedad `BOTH`: UI debe dejar claro si el usuario esta reservando corto plazo
  o aplicando a contrato largo;
- usuario no autenticado inicia intencion, se registra/loguea y recupera la
  intencion sin perder datos;
- tenant ya autenticado intenta acceder a una propiedad sin contrato activo;
- solicitud/reserva llega al backend con tipo correcto.

Impacto:

- puede mezclarse flujo de hospedaje corto con aplicacion de largo plazo;
- se pueden perder datos al registrarse o loguearse;
- un tenant puede quedar en pantalla incorrecta por guards/rutas.

Accion recomendada:

- documentar estados de flujo: `public-intention`, `tenant-pre-contract`,
  `tenant-with-contract`, `short-term-booking`, `long-term-application`;
- agregar E2E real para corto, largo y ambos;
- centralizar intencion de aplicacion/reserva en servicios con expiracion.

## Hallazgos Altos

### 4. Componentes Demasiado Grandes

Hay componentes que funcionan, pero son dificiles de mantener y extender.

Archivos con riesgo alto por tamano/responsabilidad:

- `src/app/features/tenant-portal/layout/tenant-layout.component.ts`
- `src/app/features/auth/login.component.ts`
- `src/app/features/public-portal/tenant-register/tenant-register.component.ts`
- `src/app/features/tenant-portal/new-application/new-application.component.ts`
- `src/app/features/tenant-portal/payments/tenant-qr-generate.component.ts`
- `src/app/features/tenant-portal/documents/tenant-contract-detail.component.ts`
- `src/app/features/configuracion/wizard-setup/wizard-setup.component.ts`
- `src/app/features/payments/payments.facade.ts`
- `src/app/features/reports/reports.facade.ts`
- `src/app/features/maintenance/components/request-detail.component.ts`

Impacto:

- cada feature nueva aumenta riesgo de regresion;
- cuesta testear partes pequenas;
- se mezclan UI, estado, mapping, API, validaciones y navegacion.

Accion recomendada:

- dividir por `pages/components/facades/models/mappers`;
- dejar componentes page como orquestadores;
- mover reglas de negocio a facades o servicios de dominio;
- crear tests unitarios por mapper/facade antes de refactors grandes.

### 5. Owner Portal Sigue En Primera Version

Pendiente:

- login/token real de propietario validado contra backend/staging;
- dashboard con datos reales;
- autorizacion real de mantenimiento;
- descarga PDF de statements;
- descarga de contratos;
- i18n completa;
- E2E de owner portal.

Impacto:

- el modulo existe visualmente, pero no se puede considerar completo;
- hay riesgo de exponer o bloquear datos si el token/filtrado no se valida bien.

Accion recomendada:

- validar owner token como flujo separado de admin/tenant;
- agregar guard dedicado;
- probar que owner solo ve sus propiedades;
- agregar E2E de login owner, dashboard, PDF y autorizacion.

### 6. Reports Es Potente Pero Aun No Esta Cerrado

La UI de reportes ya esta mas cerca de un centro de inteligencia, pero falta
cerrar datos reales y exportaciones.

Pendiente:

- validar `PDF/Excel` reales contra backend con datos reales;
- asegurar data historica de 6/12 meses para graficos;
- filtros por reporte: propiedad, owner, periodo, moneda, estado, tipo de
  alquiler;
- validar reportes avanzados: owners, maintenance, cash flow, budget vs actual;
- i18n de labels generados por facade;
- responsive visual de charts/tablas.

Impacto:

- reportes pueden verse bien pero representar datos incompletos;
- exportaciones pueden no coincidir con lo visible en pantalla.

Accion recomendada:

- definir contrato de datos por reporte;
- agregar tests de mappers de reportes;
- E2E para export PDF/Excel;
- snapshots visuales basicos de dashboard/reportes.

### 7. Modulos Operativos Siguen En Version Inicial

Modulos con frontend existente pero pendientes de cierre real:

- Vendors/proveedores: CRUD, desactivar, historial, rating/trabajos.
- Expenses/gastos: CRUD, resumen por propiedad, conexion con P&L.
- Violations/violaciones: crear, resolver, notificar, PDF.
- Inspections/inspecciones: checklist, fotos, PDF, comparar entrada/salida.
- Units/unidades: facade existe, pero falta i18n completa, validacion final y
  pruebas de corto plazo.

Impacto:

- parecen modulos listos en menu, pero los flujos profundos pueden fallar;
- se necesita validar permisos, estados, archivos y PDFs con backend.

Accion recomendada:

- crear E2E por modulo operativo;
- agregar pantallas de detalle donde aplique;
- validar estados backend/frontend;
- revisar permisos por rol.

## Hallazgos Medios

### 8. Persistencia Y Storage Aun Necesitan Politica Clara

Ya se centralizo una parte, pero todavia hay usos directos o semi-directos de
`localStorage`/`sessionStorage`.

Usos aceptables si estan controlados:

- sesion/token en servicios dedicados;
- idioma;
- intenciones temporales de aplicacion/reserva;
- borradores de formularios;
- favoritos o estados de lectura.

Riesgos:

- guardar tokens fuera de servicios dedicados;
- no tener expiracion para intenciones/borradores;
- mezclar datos de tenants distintos;
- dejar datos sensibles en storage persistente.

Accion recomendada:

- auth tokens solo en `SessionTokenService` o servicio equivalente por contexto;
- intenciones y borradores con TTL;
- storage keys namespaced por tenant/slug/user;
- documentar que datos pueden vivir en browser storage y cuales no.

### 9. Rutas Y Guards Requieren Auditoria De Seguridad/UX

El router esta mejor, pero hay rutas del portal tenant que permiten estados
distintos segun contrato.

Puntos a revisar:

- rutas de documentos/contratos del tenant accesibles sin el mismo guard que otros
  documentos;
- separacion entre `pre-contract` y `with-contract`;
- owner portal con guard/token independiente;
- rutas publicas que recuperan intenciones despues de login/register.

Impacto:

- pantallas vacias o accesos inesperados;
- usuarios en estado incorrecto viendo modulos que no corresponden;
- inconsistencias entre menu y acceso por URL directa.

Accion recomendada:

- matriz de rutas por rol/estado;
- tests de guards;
- E2E de acceso directo por URL para admin, tenant, tecnico y owner.

### 10. Public Portal Conserva Restos De Primera Version

Pendiente:

- branding residual tipo `RentHub` en algunas vistas;
- textos hardcodeados;
- mapa con popups/textos no traducidos;
- imports directos de componentes en rutas publicas que reducen lazy loading;
- revisar responsive y SEO/meta por tenant.

Impacto:

- la parte publica es la primera impresion del producto;
- mezcla visual o textual baja percepcion de calidad.

Accion recomendada:

- convertir todo el portal publico a i18n;
- revisar marca blanca por tenant;
- lazy load de pantallas publicas;
- E2E responsive y visual de home, catalogo, detalle, login/register.

### 11. Accesibilidad Y UX Aun No Estan Terminadas

Pendiente:

- `aria-label` y tooltips traducidos;
- icon-only buttons con nombre accesible;
- estados loading/empty/error consistentes;
- validaciones visibles con el mismo patron;
- formularios largos divididos por secciones claras;
- foco correcto al abrir/cerrar dialogs.

Impacto:

- peor experiencia en mobile y teclado;
- usuarios pueden no entender errores de formularios;
- riesgo de inconsistencias entre modulos.

Accion recomendada:

- checklist de accesibilidad por wrapper;
- pruebas de teclado en dialogs/forms;
- revisar contrastes y mobile en pantallas criticas.

## Hallazgos De Tests

### 12. Hay Tests, Pero Faltan Flujos Profundos

Estado actual:

- hay unit tests de servicios/facades/mappers;
- hay E2E de humo y responsive;
- hay validaciones iniciales para modulos operativos.

Falta:

- E2E login real;
- E2E permisos/sidebar;
- E2E pago crear -> aprobar/rechazar;
- E2E solicitud crear -> aprobar/rechazar;
- E2E crear/editar propiedad;
- E2E crear/renovar/finalizar contrato;
- E2E owner portal completo;
- E2E reports export PDF/Excel;
- E2E inspections/violations/expenses/vendors;
- tests de i18n para detectar textos visibles hardcodeados.

Impacto:

- build puede pasar aunque un flujo de negocio este roto;
- no hay garantia suficiente contra regresiones en dinero, contratos y permisos.

Accion recomendada:

- crear dataset seed de E2E estable;
- usar helpers por rol: admin, tenant, owner, tecnico;
- priorizar flujos de dinero, permisos y contratos.

## Hallazgos De Arquitectura

### 13. Estructura Por Dominio No Esta Uniforme

Algunos dominios ya siguen una estructura madura, pero otros no.

Estructura objetivo:

```text
features/<domain>/
  pages/
  components/
  facades/
  models/
  mappers/
  services/   # solo si el servicio es realmente del dominio
```

Pendiente:

- normalizar dominios viejos;
- mover componentes page a `pages`;
- separar mappers de payload/response;
- evitar facades gigantes si empiezan a mezclar demasiadas operaciones.

Impacto:

- dificil ubicar responsabilidades;
- nuevos developers pueden duplicar patrones;
- mas deuda cuando se agreguen features.

Accion recomendada:

- aplicar estructura objetivo por modulo cuando se toque;
- no hacer rename masivo sin tests;
- documentar convencion en `frontend-modernization.md`.

### 14. Modelos Y Mappers Necesitan Cerrarse Contra Backend

Pendiente:

- revisar DTOs frontend vs respuestas reales backend;
- evitar normalizaciones grandes dentro de servicios;
- separar mappers para properties, reports, contracts, payments y tenant portal;
- tratar fechas, moneda, nullables y enums de forma consistente.

Impacto:

- errores silenciosos cuando backend cambia un campo;
- UI puede mostrar datos incorrectos;
- dificultad para probar edge cases.

Accion recomendada:

- contratos TypeScript por endpoint critico;
- mappers testeados;
- validacion de runtime ligera para endpoints sensibles si aplica.

## Backlog Priorizado

### P0 - Corregir Antes De Seguir Agregando Features Grandes

- Completar i18n de flujos criticos: login, registro, portal publico, tenant
  portal, owner portal, pagos, propiedades/unidades, reports.
- Corregir/validar catalogo corto/largo plazo contra backend.
- E2E de corto plazo, largo plazo y `BOTH`.
- Auditoria de guards por rol/estado.
- Validar owner portal con usuario real.

### P1 - Dejar El Frontend Mantenible

- Partir componentes gigantes.
- Dejar `tenant-create-payment`, `login`, `tenant-register`,
  `new-application`, `tenant-layout` como orquestadores.
- Completar estructura `pages/components/facades/models/mappers`.
- Completar Units con i18n, tests y flujo corto plazo.
- Revisar public portal y eliminar branding residual.

### P2 - Cerrar Producto Profesional

- Reports con exports reales y data historica.
- Vendors, Expenses, Violations e Inspections completos contra backend.
- Owner Portal completo con PDFs y autorizacion.
- E2E profundos de pagos, solicitudes, contratos, mantenimiento y reportes.
- Revision visual responsive de pantallas criticas.

## Checklist De Cierre

- [ ] No hay textos visibles hardcodeados fuera de i18n.
- [ ] Login, registro y forgot/reset password estan completos y seguros.
- [ ] Catalogo publico maneja correctamente SHORT_TERM, LONG_TERM y BOTH.
- [ ] Tenant portal recupera intenciones despues de login/register.
- [ ] Owner portal funciona con token real y datos filtrados por owner.
- [ ] Reports exporta PDF/Excel con los mismos filtros de pantalla.
- [ ] Vendors/Expenses/Violations/Inspections tienen flujos completos.
- [ ] Componentes page no mezclan API, estado y UI pesada.
- [ ] Facades criticas tienen tests.
- [ ] E2E cubre flujos de dinero, contratos, permisos y solicitudes.
- [ ] Responsive validado en login, dashboard, pagos, propiedades, contratos,
  tenant portal, owner portal y reports.
- [ ] Storage browser tiene politica clara y TTL donde corresponde.

## Conclusion

El frontend esta bastante mas ordenado que antes, pero aun no se puede considerar
terminado al 100%. La deuda restante es principalmente de producto real,
integracion y mantenibilidad: i18n incompleta en uso, componentes grandes,
flujos corto/largo plazo sin E2E profundo, owner portal/reportes/modulos
operativos sin cierre total y validaciones contra backend pendientes.

La recomendacion tecnica es no seguir agregando features grandes encima hasta
cerrar P0 y empezar P1. Eso evita que el frontend vuelva a crecer con logica
mezclada y pantallas dificiles de mantener.
