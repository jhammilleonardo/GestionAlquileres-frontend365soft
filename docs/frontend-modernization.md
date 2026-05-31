# Modernizacion Frontend 365Soft

Esta guia define como modernizar el frontend antes de continuar con nuevas
features grandes. El objetivo no es solo cambiar la apariencia: es reducir
deuda tecnica, mejorar mantenibilidad y dejar una base visual consistente para
admin, tenant portal, owner portal y sitio publico.

## Decision Principal

La nueva direccion del frontend es:

- Angular 21 standalone como framework base.
- Taiga UI como base visual nueva para componentes modernos.
- Angular CDK para comportamiento bajo nivel cuando sea necesario.
- Lucide para iconos SVG.
- Plus Jakarta Sans self-hosted como fuente global.
- Material Icons self-hosted solo como compatibilidad temporal para pantallas
  Material existentes.
- Tailwind solo para utilidades/layout controlado.
- Wrappers propios en `src/app/shared/ui` para evitar acoplar todo el codigo
  directamente a Taiga UI.

Angular Material queda temporalmente como dependencia de transicion porque el
proyecto actual lo usa en muchas pantallas. No se debe seguir creando UI nueva
con Material salvo que sea una pantalla que todavia no entra en modernizacion.

## Por Que No Migrar Todo De Golpe

El frontend actual tiene muchas referencias directas a `mat-*`, `MatDialog`,
`MatTable`, `MatFormField`, `MatSelect`, `MatMenu`, `MatSnackBar` y otros
componentes Material. Reemplazar todo en un solo PR tendria alto riesgo:

- Regresiones visuales en flujos criticos.
- Formularios rotos o validaciones incompletas.
- Dificultad para revisar cambios.
- Mezcla de bugs funcionales con cambios esteticos.
- Bloqueo de nuevas features por mucho tiempo.

El reemplazo correcto es incremental: primero tokens, fuente y wrappers; luego
modulo por modulo.

## Fuente Oficial Del Proyecto

La fuente del producto sera **Plus Jakarta Sans**.

Reglas:

- Usar fuente self-hosted, no Google Fonts.
- Preferir `@fontsource-variable/plus-jakarta-sans`.
- Definir la fuente en variables globales.
- Evitar dependencias externas de fonts en `index.html`.
- Usar `font-display: swap` cuando se cargue manualmente con `@font-face`.
- Mantener `@fontsource/material-icons` solo mientras existan `mat-icon` con
  ligatures. La modernizacion final debe reemplazarlos por Lucide/Taiga.

Motivo: los builds de Angular pueden fallar si intentan resolver
`fonts.googleapis.com` en CI, Docker o redes sin salida. La fuente self-hosted
hace el build reproducible y mejora privacidad/performance.

## Libreria UI

La libreria elegida para nuevas pantallas y modernizacion visual es **Taiga UI**.

Taiga UI se adopta porque:

- Encaja mejor con una UI moderna y limpia.
- Es nativa para Angular.
- Tiene buen set de formularios, overlays y componentes de producto.
- Permite una identidad menos generica que Angular Material.
- Puede convivir durante una transicion con Angular Material.

No se debe usar Taiga UI directamente en todas las pantallas sin criterio. Las
piezas reutilizables deben pasar por wrappers propios.

## Arquitectura De UI

La estructura recomendada es:

```txt
src/app/shared/ui/
  button/
  text-field/
  select/
  textarea/
  checkbox/
  dialog/
  confirm-dialog/
  table/
  status-badge/
  page-header/
  empty-state/
  loading-state/
  file-upload/
  date-picker/
```

Cada componente compartido debe:

- Ser standalone.
- Tener API simple y tipada.
- Exponer inputs/outputs propios del dominio de 365Soft.
- Encapsular detalles de Taiga UI o Material.
- No contener logica de negocio.
- Tener estilos locales pequenos.
- Ser accesible con teclado y lectores de pantalla.

Ejemplo de intencion:

```txt
Feature component -> app-select -> Taiga UI
```

No:

```txt
Feature component -> Taiga UI directo en todo el HTML
```

Esto protege el proyecto si en el futuro se cambia otra vez de libreria.

## Tokens De Diseno

Se deben definir tokens globales en `styles.scss` o archivos importados:

```scss
:root {
  --app-font-family: 'Plus Jakarta Sans Variable', system-ui, sans-serif;
  --app-radius-sm: 4px;
  --app-radius-md: 8px;
  --app-radius-lg: 12px;
  --app-space-1: 4px;
  --app-space-2: 8px;
  --app-space-3: 12px;
  --app-space-4: 16px;
  --app-space-6: 24px;
  --app-space-8: 32px;
}
```

Reglas visuales:

- Interfaces admin: densas, claras, sobrias y rapidas de escanear.
- No usar hero sections en herramientas operativas.
- No abusar de cards. Cards solo para items repetidos, modales o bloques
  realmente enmarcados.
- Evitar paletas de un solo color dominante.
- Botones con iconos cuando la accion sea reconocible.
- Estados visibles: loading, empty, error, forbidden, success.
- Tablas con paginacion, filtros y acciones consistentes.

## Reglas Para Nuevas Features

Toda feature nueva debe cumplir:

- No usar `any` en servicios, modelos o DTOs.
- No usar `console.log/error/warn` productivo.
- No acceder directo a `localStorage`/`sessionStorage` desde componentes.
- No llamar APIs directamente desde componentes grandes.
- Usar servicios/facades por dominio.
- Usar modelos alineados con el backend.
- Gestionar loading/error de forma explicita.
- Tener componentes pequenos y enfocados.
- Mantener templates legibles.
- Evitar estilos inline.

## Arquitectura De Feature

Para modulos grandes, usar esta estructura:

```txt
src/app/features/<dominio>/
  pages/
  components/
  dialogs/
  services/
  models/
  mappers/
  <dominio>.routes.ts
```

Ejemplo:

```txt
src/app/features/messages/
  pages/inbox-page/
  pages/thread-page/
  components/thread-list/
  components/message-composer/
  services/messages-api.service.ts
  services/messages-facade.service.ts
  models/message.models.ts
  messages.routes.ts
```

## API Y Estado

El frontend debe tener una sola estrategia HTTP:

- Un cliente HTTP base.
- Un interceptor de auth responsable de tokens.
- Servicios de dominio por modulo.
- Mappers entre DTO backend y modelos UI si hace falta.

No duplicar headers/tokens entre `ApiService`, `ApiHttpService` y servicios
sueltos. La autenticacion admin, tenant y owner debe quedar centralizada.

Estado actual:

- `SessionTokenService` centraliza lectura y seleccion de token para `admin`,
  `tenant` y `owner`.
- `authInterceptor` usa `SessionTokenService` para decidir el token por URL.
- `ApiClientService` en `src/app/core/http/api-client.service.ts` es el nuevo
  cliente HTTP tipado para codigo nuevo.
- `ApiService` y `ApiHttpService` quedan como adaptadores de transicion y ya
  delegan en `ApiClientService`.
- Se eliminaron headers `Authorization` manuales en servicios tenant/admin
  seleccionados: users, contracts, tenant properties, tenant contracts,
  tenant notifications y tenant maintenance.
- Siguiente paso: terminar de actualizar los servicios de dominio restantes que
  todavia setean `Authorization` manualmente.

## Routing Y Bundles

El routing debe proteger el bundle inicial. Las pantallas pesadas de admin no
deben importarse desde `app.routes.ts`.

Estado actual:

- `app.routes.ts` solo mantiene rutas publicas, tenant portal, portal publico,
  wizard y entrada lazy del admin.
- Las rutas admin viven en `features/admin/admin.routes.ts`.
- Las pantallas admin cargan con `loadComponent`.
- El bundle inicial bajo de aproximadamente 2.46 MB a 693 KB despues de separar
  rutas.
- El shell principal empezo la modernizacion visual: sidebar y contenido usan
  tokens propios; header ya no usa `mat-toolbar` ni botones Material para la
  barra principal. `mat-menu` sigue temporalmente para el menu de usuario.

Regla:

- Toda feature nueva debe tener ruta lazy.
- No importar componentes de paginas pesadas directamente en `app.routes.ts`.
- Los dominios grandes deben exponer `<dominio>.routes.ts`.

## Seguridad Frontend

Reglas obligatorias:

- Guards deben fallar cerrado. Si no se puede validar permiso, no se permite
  acceso.
- El sidebar oculta modulos sin permiso, pero los guards siguen siendo la
  proteccion real de ruta.
- Owner portal debe usar token/contexto owner, no admin por accidente.
- Tenant portal debe usar token/contexto tenant.
- No exponer datos sensibles en logs.
- No confiar en el frontend para reglas de negocio; backend siempre valida.

## Plan De Migracion

### Fase 0.1 - Estabilizacion Visual

- Instalar `@fontsource-variable/plus-jakarta-sans`.
- Instalar Taiga UI.
- Quitar Google Fonts y Material Icons externos de `index.html`.
- Configurar Plus Jakarta Sans global.
- Definir tokens globales.
- Crear `src/app/shared/ui`.
- Crear wrappers iniciales: button, text-field, page-header, status-badge,
  empty-state, loading-state.
- Completar wrappers base de formularios/listados: select, textarea,
  checkbox, date-picker, file-upload y table.
- Verificar `npm run build` y `npm run lint:check`.

### Fase 0.2 - Seguridad Y Base Tecnica

- Corregir guards fail-open.
- Eliminar `.bak` dentro de `src`.
- Reducir logs productivos.
- Centralizar estrategia de tokens.
- Centralizar cliente HTTP tipado para codigo nuevo.
- Migrar shell visual fuera de Material donde sea seguro.
- Documentar convenciones en este archivo.

### Fase 0.3 - Primer Modulo Piloto

Migrar un modulo completo para probar el nuevo sistema. Candidato recomendado:

1. Owner portal si se quiere mejorar experiencia existente.
2. Pagos si se quiere atacar el modulo mas critico.

El piloto debe validar:

- Wrappers suficientes.
- Responsive real.
- Estados loading/empty/error.
- Tipos correctos.
- Integracion con backend.

### Fase 0.4 - Modernizacion Por Prioridad

Orden recomendado:

1. Auth y layout principal.
2. Sidebar/header/permisos.
3. Pagos.
4. Contratos.
5. Propiedades/unidades.
6. Maintenance.
7. Owner portal.
8. Tenant portal.
9. Reports.
10. Sitio publico.

## Definicion De Done Para UI

Una pantalla no esta terminada si solo "se ve bien". Debe cumplir:

- Funciona con datos reales del backend.
- Maneja errores de API.
- Maneja permisos.
- Tiene loading state.
- Tiene empty state.
- Es responsive.
- No introduce `any` innecesario.
- No introduce logs productivos.
- No rompe lint/build.
- Usa componentes compartidos cuando corresponde.
- No duplica logica que ya existe en un facade/service.

## Checklist Base De Modernizacion

Verificacion antes de continuar con nuevas features:

- [x] Plus Jakarta Sans self-hosted configurada.
- [x] Google Fonts removido.
- [x] Taiga UI instalado y validado.
- [x] Wrappers UI minimos creados.
- [x] Wrappers base para formularios/listados creados: select, textarea,
  checkbox, date-picker, file-upload y table.
- [x] `module.guard.ts` corregido para fallar cerrado.
- [x] Estrategia owner/tenant/admin token revisada.
- [x] Cliente HTTP base tipado creado.
- [x] Admin routes lazy separadas del bundle inicial.
- [x] Header/sidebar empezaron modernizacion fuera de Material visual.
- [x] README principal actualizado.
- [x] Build/lint ejecutados.

## Nota Sobre Angular Material

Material no se elimina al inicio. Se mantiene temporalmente para no romper el
producto. La regla es:

- Pantallas existentes pueden seguir con Material hasta ser modernizadas.
- Pantallas nuevas deben usar wrappers del sistema nuevo.
- No crear nuevos componentes compartidos basados en Material salvo que sea un
  adaptador de transicion.
- Cuando un modulo se moderniza completo, se eliminan imports Material no usados.

## Resultado Esperado

Al terminar esta modernizacion, el frontend debe tener:

- UI mas moderna y consistente.
- Menos acoplamiento a librerias externas.
- Build reproducible sin dependencias de Google Fonts.
- Componentes reutilizables.
- Menos deuda en features nuevas.
- Base preparada para continuar con el resto del backlog.
