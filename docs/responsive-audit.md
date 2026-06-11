# Auditoria responsive del frontend

Fecha: 2026-06-11

## Alcance

Revision enfocada en comportamiento responsive del frontend de 365Soft:

- Portal publico.
- Auth admin, tenant, owner y vendor.
- Layout admin.
- Modulos admin principales.
- Portal del inquilino.
- Portal propietario.
- Portal proveedor.
- Dialogos, tablas, formularios, chats y componentes compartidos.

Esta auditoria no reemplaza una prueba visual completa con datos reales. Indica que pantallas estan cubiertas, que riesgos existen por codigo/CSS y que falta validar en navegador con backend activo.

## Validaciones ejecutadas

| Validacion | Resultado | Nota |
|---|---:|---|
| `npm run lint:check` | OK | Sin errores ESLint. |
| `npm run i18n:audit` | OK | No detecto textos visibles hardcodeados por el script actual. |
| `npm run build` | OK | Build productivo generado correctamente. |
| `npm run e2e -- e2e/responsive-critical.spec.ts` | BLOQUEADO | El spec requiere backend en `localhost:3000`; fallo por `ECONNREFUSED`. |
| `docker compose ps` frontend/backend | BLOQUEADO | Docker daemon no esta disponible: `/var/run/docker.sock` no existe. |
| `npm run start:dev` backend | BLOQUEADO | Backend compila, pero PostgreSQL no esta disponible: `ECONNREFUSED`. |
| Medicion Playwright manual en rutas publicas/auth | OK parcial | Mobile/tablet/desktop dieron `overflow=0` en rutas publicas y logins. |

Rutas medidas sin overflow horizontal en `390x844`, `768x1024` y `1440x900`:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/demo/login`
- `/demo/owner/login`
- `/demo/vendor/login`
- `/demo/publico/inicio`
- `/demo/publico/propiedades`
- `/demo/publico/mapa`
- `/demo/publico/nosotros`
- `/demo/publico/contacto`
- `/demo/publico/faq`

## Veredicto corto

El frontend no esta roto a nivel responsive base. Las rutas publicas y pantallas de login principales renderizan sin overflow horizontal en mobile/tablet/desktop.

Pero el proyecto todavia no esta garantizado como responsive completo porque las pantallas autenticadas mas importantes dependen del backend real y no pudieron ejecutarse. Ademas, varios modulos tienen estructuras con alto riesgo responsive: dialogos grandes, tablas con `min-width`, chats con alturas fijas y layouts de dos columnas que cambian demasiado tarde.

## Hallazgos principales

### 1. La cobertura E2E responsive actual es insuficiente

Archivo: `e2e/responsive-critical.spec.ts`

El spec actual solo valida:

- `/login`
- `/demo/login`
- `/demo/owner/login`
- Algunas rutas admin despues de login.

Problemas:

- No mide overflow horizontal.
- No valida tenant portal completo.
- No valida owner portal autenticado.
- No valida vendor portal autenticado.
- No valida modales/dialogos abiertos.
- No valida tablas en mobile.
- No valida chats con mensajes/adjuntos.
- No valida formularios largos.
- No valida landscape mobile.

Riesgo: una ruta puede "no estar blanca" y aun asi estar inutilizable en mobile.

Accion recomendada:

- Reemplazar el criterio de "hay heading visible" por checks de:
  - `document.documentElement.scrollWidth <= clientWidth`.
  - ausencia de overlays cortados.
  - botones principales visibles.
  - formularios enviables.
  - dialogos con scroll interno correcto.
  - capturas en mobile/tablet/desktop.

### 2. El detalle de mantenimiento admin tiene riesgo alto en tablet/mobile

Archivos:

- `src/app/features/maintenance/maintenance.component.scss:627`
- `src/app/features/maintenance/components/request-detail.component.scss:89`
- `src/app/features/maintenance/components/request-detail.component.scss:534`
- `src/app/features/maintenance/components/request-detail.component.scss:1116`

Problemas detectados:

- El dialogo de mantenimiento usa `--app-dialog-width: 1200px`.
- El cuerpo usa dos columnas: `grid-template-columns: 1fr 420px`.
- El cambio a una columna recien ocurre en `max-width: 700px`.
- El panel derecho de conversacion usa `min-height: 520px` y `max-height: calc(90vh - 190px)`.
- El chat queda `sticky` dentro de un dialogo con scroll, lo que puede producir una experiencia rara: el usuario siente que solo scrollea el chat o que no puede llegar a controles inferiores.

Impacto:

- En tablets y pantallas angostas el contenido puede comprimirse demasiado.
- La gestion de estado/prioridad/asignacion puede quedar dificil de alcanzar.
- El problema coincide con lo observado manualmente: abrir ticket admin se siente bugueado, hay que reabrir/clickear, y la asignacion/scroll no se entiende.

Accion recomendada:

- Cambiar el breakpoint de una columna a `max-width: 1024px` o usar container queries.
- Separar conversacion en pestaña/panel colapsable en mobile.
- Hacer que el dialogo use un layout:
  - desktop: detalle + conversacion lateral;
  - tablet: detalle y conversacion en secciones verticales;
  - mobile: tabs `Detalle`, `Gestion`, `Conversacion`.
- Evitar `position: sticky` dentro del dialogo.
- Reducir `min-height` del chat en mobile y tablet.

### 3. El chat tenant de mantenimiento tiene altura fija

Archivo: `src/app/features/tenant-portal/maintenance/components/tenant-maintenance-conversation.component.ts:261`

Problemas detectados:

- `.conv-panel` tiene `height: 640px`.
- No hay breakpoint visible para cambiar esa altura en mobile.
- La pagina del detalle tenant usa dos columnas hasta `900px`, luego una columna, pero el chat conserva altura fija.

Impacto:

- En celulares chicos, el chat puede ocupar demasiado espacio.
- Si hay teclado virtual, el input puede quedar incomodo.
- Los adjuntos y mensajes largos pueden forzar una experiencia pobre aunque no haya overflow horizontal.

Accion recomendada:

- Usar `height: min(640px, calc(100dvh - Xpx))`.
- En mobile usar `min-height` razonable y `max-height` con `dvh`.
- Mantener el input sticky abajo solo dentro del panel.
- Agregar E2E que abra mantenimiento tenant y envie mensaje/adjunto en mobile.

### 4. El formulario grande de propiedades usa modal propio, no `app-dialog`

Archivos:

- `src/app/features/properties/components/property-form-dialog/property-form-dialog.component.html`
- `src/app/features/properties/components/property-form-dialog/property-form-dialog.component.scss:14`
- `src/app/features/properties/components/property-form-dialog/property-form-dialog.component.scss:166`
- `src/app/features/properties/components/property-form-dialog/property-form-dialog.component.scss:310`

Problemas detectados:

- Usa `.modal-overlay` y `.modal-container` propios.
- Tiene `max-width: 900px` y `max-height: 92vh`.
- Tiene grillas de 2, 3 y 4 columnas que bajan con breakpoints.
- El HTML es grande y el formulario concentra muchas secciones.

Impacto:

- Puede funcionar, pero es mas fragil que `app-dialog`.
- Riesgo de inconsistencia con otros dialogos.
- Riesgo de footer/stepper incomodo en mobile.
- Dificulta pruebas responsive de cada paso.

Accion recomendada:

- Migrar a `app-dialog` o crear `app-wizard-dialog`.
- Separar por pasos/componentes:
  - datos generales;
  - ubicacion;
  - precios;
  - multimedia;
  - reglas/configuracion.
- Agregar spec visual/mobile para abrir crear/editar propiedad y recorrer pasos.

### 5. Tablas de contratos y unidades dependen de scroll horizontal

Archivos:

- `src/app/features/contracts/contracts.component.scss:316`
- `src/app/features/contracts/contracts.component.scss:323`
- `src/app/features/contracts/contracts.component.scss:653`
- `src/app/features/properties/property-units/property-units.component.scss:275`
- `src/app/features/properties/property-units/property-units.component.scss:282`

Problemas detectados:

- Contratos usa tabla con `min-width: 780px` y en mobile baja a `min-width: 680px`.
- Units usa tabla con `min-width: 780px`.
- Hay `overflow-x: auto`, lo que evita romper el layout, pero no es la mejor UX mobile.

Impacto:

- No necesariamente rompe la pantalla, pero en celulares obliga a scroll horizontal.
- Para usuarios operativos, acciones importantes pueden quedar fuera de vista.

Accion recomendada:

- En desktop mantener tabla.
- En mobile renderizar cards por fila con acciones visibles.
- Agregar `app-responsive-table` o una variante de `app-table` con modo `cards`.

### 6. Mensajeria general es responsive basica, pero no suficiente para chat real

Archivo: `src/app/features/messages/messages.component.scss`

Lo positivo:

- A `max-width: 720px`, cambia a una sola columna.
- Oculta lista o conversacion segun estado.
- Tiene boton de volver en conversacion.

Problemas:

- No hay validacion E2E de envio real con mobile.
- No se cubre adjuntos.
- No se cubre destinatario visible, doble envio, ni recepcion tenant/admin.
- No se cubre WebSocket/realtime.

Accion recomendada:

- Convertir el chat general y el chat mantenimiento a un componente compartido robusto.
- Unificar:
  - mensajes;
  - adjuntos;
  - destinatario;
  - estado enviado/entregado/leido;
  - permisos por rol;
  - scroll al final;
  - previews autenticadas.
- Agregar E2E admin -> tenant y tenant -> admin.

### 7. Portal publico pasa overflow, pero tiene CSS grande y debe validarse con datos reales

Archivos con CSS grande:

- `src/app/features/public-portal/property-detail/property-detail.component.css`
- `src/app/features/public-portal/home/home.component.css`
- `src/app/features/public-portal/property-list/property-list.component.css`
- `src/app/features/public-portal/application-form/application-form.component.css`

Lo positivo:

- La medicion manual no detecto overflow horizontal en rutas publicas/auth.
- Hay breakpoints en property detail, property list, home, contact, footer y navbar.

Pendiente:

- Validar con propiedades reales con nombres largos, muchas imagenes, muchas amenidades y precios largos.
- Validar calendario de disponibilidad en mobile.
- Validar `BOTH`: reserva corta y solicitud larga sin confusion.
- Validar modales de mapa/contacto/aplicacion abiertos.

### 8. Owner/Vendor portal tienen layouts responsive, pero falta prueba autenticada

Archivos:

- `src/app/features/owner-portal/owner-portal.component.scss`
- `src/app/features/owner-portal/auth/owner-login.component.scss`
- `src/app/features/vendor-portal/vendor-portal.component.scss`
- `src/app/features/vendor-portal/layout/vendor-layout.component.scss`
- `src/app/features/vendor-portal/components/vendor-order-detail.component.scss`

Lo positivo:

- Owner login cambia de dos columnas a una bajo `860px`.
- Vendor login cambia bajo `1024px`.
- Vendor order detail cambia de dos columnas a una bajo `900px`.

Pendiente:

- Validar owner autenticado con statements, contratos y mantenimiento real.
- Validar vendor autenticado con orden real, conversacion y fotos.
- El E2E actual del vendor autenticado estaba incompleto en revisiones anteriores; debe quedar activo.

## Estado por apartado

| Apartado | Estado responsive | Riesgo |
|---|---|---|
| Landing `/` | Parcialmente validado | Bajo |
| Admin login | Validado sin overflow | Bajo |
| Admin register | Validado sin overflow, formulario largo | Medio |
| Forgot password | Validado sin overflow | Bajo |
| Tenant login | Validado sin overflow | Bajo |
| Owner login | Validado sin overflow | Bajo |
| Vendor login | Validado sin overflow | Bajo |
| Portal publico | Validado sin overflow en rutas base | Medio |
| Admin dashboard | No validado con backend en esta corrida | Medio |
| Admin pagos | No validado con backend en esta corrida | Medio |
| Admin propiedades | No validado con backend en esta corrida | Medio |
| Crear/editar propiedad | Riesgo por modal grande | Alto |
| Admin contratos | Riesgo por tabla ancha | Medio |
| Admin mantenimiento | Riesgo alto por dialogo + chat + scroll | Alto |
| Mensajes admin | Responsive basico, falta flujo real | Medio/Alto |
| Tenant portal home/dashboard | No validado con backend en esta corrida | Medio |
| Tenant mantenimiento | Riesgo por chat de altura fija | Alto |
| Tenant pagos/QR | No validado visualmente en esta corrida | Medio |
| Tenant documentos/contrato | No validado visualmente en esta corrida | Medio |
| Owner portal autenticado | No validado con backend | Alto |
| Vendor portal autenticado | No validado con backend | Alto |
| Reports | No validado con backend, graficos/tablas | Medio |
| Vendors/Expenses/Violations/Inspections | No validado con backend | Medio/Alto |

## Prioridad recomendada

### Bloque 1 - Responsive critico real

1. Arreglar detalle de mantenimiento admin:
   - breakpoint a 1024px;
   - chat no sticky en tablet/mobile;
   - tabs o secciones en mobile;
   - validacion de asignacion visible.
2. Arreglar chat tenant mantenimiento:
   - eliminar altura fija pura;
   - usar `dvh`;
   - validar input con teclado mobile.
3. Agregar E2E responsive con login real y backend activo:
   - admin mantenimiento detalle;
   - tenant mantenimiento detalle;
   - mensajes admin/tenant.

### Bloque 2 - Formularios y tablas

1. Propiedad create/edit en `app-wizard-dialog`.
2. Contratos mobile como cards.
3. Units mobile como cards.
4. Pagos mobile con acciones visibles sin scroll horizontal.

### Bloque 3 - Portales autenticados

1. Owner portal autenticado:
   - dashboard;
   - statements;
   - PDF;
   - mantenimiento.
2. Vendor portal autenticado:
   - dashboard;
   - orden detalle;
   - chat;
   - fotos.
3. Tenant portal:
   - pagos;
   - QR;
   - documentos;
   - perfil.

### Bloque 4 - Automatizacion

Crear un spec nuevo `responsive-authenticated.spec.ts` con:

- viewports:
  - `390x844`;
  - `768x1024`;
  - `1366x768`;
  - `1440x900`.
- helper `expectNoHorizontalOverflow(page)`.
- helpers para abrir dialogos reales.
- capturas solo ante fallo.

Casos minimos:

- admin abre mantenimiento y detalle de ticket;
- admin abre crear propiedad;
- admin abre contratos;
- admin abre pagos;
- tenant abre mantenimiento y conversacion;
- tenant abre contrato;
- owner abre dashboard;
- vendor abre orden.

## Bloqueos actuales

No se pudo completar la validacion responsive autenticada porque:

- Docker no esta levantado o no esta disponible.
- Backend local no puede conectar a PostgreSQL.
- El spec responsive actual depende de login real contra `localhost:3000`.

Para cerrar esta auditoria se necesita:

1. Levantar PostgreSQL.
2. Levantar backend en `localhost:3000`.
3. Levantar frontend en `localhost:4200`.
4. Correr:

```bash
npm run e2e -- e2e/responsive-critical.spec.ts
```

5. Agregar y correr el nuevo spec profundo de responsive autenticado.

## Conclusion

El responsive base ya esta mucho mejor que antes: no hay evidencia de overflow horizontal en rutas publicas/auth principales y el build/lint/i18n pasan.

Lo que todavia no esta al nivel profesional es la validacion de pantallas autenticadas y los modulos operativos complejos. El mayor riesgo real esta en mantenimiento/chat, formularios grandes en modal y tablas operativas. Esos puntos deben corregirse antes de considerar el frontend responsive completo.
