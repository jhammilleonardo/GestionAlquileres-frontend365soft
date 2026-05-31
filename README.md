# 365Soft Frontend

Frontend Angular para el sistema 365Soft de gestion de propiedades,
alquileres, pagos, mantenimiento, propietarios, inquilinos y reportes.

## Estado Actual

El proyecto esta en una etapa de modernizacion frontend. La base actual usa
Angular 21, componentes standalone, Angular Material, Tailwind CSS y Lucide.

La nueva direccion tecnica esta documentada en:

- [Modernizacion Frontend](docs/frontend-modernization.md)
- [Estado De Modernizacion](docs/frontend-modernization-status.md)
- [Internacionalizacion](docs/i18n.md)

Decision vigente:

- Taiga UI sera la nueva base visual para pantallas nuevas y reemplazo gradual.
- Plus Jakarta Sans sera la fuente global self-hosted.
- Angular Material queda como dependencia de transicion.
- Material Icons queda self-hosted solo mientras existan pantallas Material antiguas.
- Los componentes nuevos deben pasar por wrappers propios en `src/app/shared/ui`.
- Las rutas admin se cargan lazy desde `src/app/features/admin/admin.routes.ts`.
- La seleccion de tokens vive en `SessionTokenService`.
- El cliente HTTP nuevo para codigo de dominio es `ApiClientService`.
- El shell principal ya empezo la modernizacion fuera de Angular Material: header y
  sidebar usan tokens propios; `mat-menu` queda como transicion.

## Requisitos Previos

- Node.js 22 recomendado
- npm 11 recomendado
- Angular CLI 21+

## Instalacion

```bash
git clone <URL_DEL_REPOSITORIO>
cd GestionAlquileres_365Soft-frontend
npm install
npm start
```

La aplicacion queda disponible en `http://localhost:4200/`.

## Scripts

```txt
npm start        # Servidor de desarrollo
npm run build    # Build production
npm run test     # Tests
npm run test:cov # Tests con cobertura
npm run lint:check
npm run format
```

## Docker

El Dockerfile de produccion hace build Angular y sirve la SPA con Nginx. Las
variables de entorno se inyectan por build args.

```bash
docker build -t gestion-frontend:staging \
  --build-arg NG_APP_API_URL=https://api-staging.tu-dominio.com/ \
  --build-arg NG_APP_API_TIMEOUT=30000 \
  --build-arg NG_APP_SENTRY_DSN= \
  --build-arg NG_APP_SENTRY_ENV=staging .
```

## Estructura

```txt
src/
├── app/
│   ├── core/       # Guards, interceptors, services y modelos globales
│   ├── features/   # Modulos funcionales
│   ├── shared/     # Layouts, pipes y UI compartida
│   ├── app.routes.ts
│   └── app.config.ts
├── assets/
├── environments/
└── styles.scss
```

## Reglas De Desarrollo

- Usar componentes standalone.
- Usar SCSS para estilos nuevos.
- No crear componentes gigantes; dividir por pagina, presentacional, dialog y
  servicio/facade.
- No usar `any` en codigo nuevo salvo justificacion puntual.
- No usar `console.*` productivo.
- No consumir `localStorage` directo desde componentes.
- No crear UI nueva directamente con Angular Material; usar wrappers propios.
- Mantener DTOs/modelos alineados con el backend.

## Iconos

El proyecto usa Lucide para iconos SVG:

```typescript
import { LucideAngularModule, IconName } from 'lucide-angular';

export class MyComponent {
  readonly IconName = IconName;
}
```

```html
<lucide-icon [img]="IconName" [size]="20"></lucide-icon>
```

## Flujo De Trabajo

1. Crea una rama para tu funcionalidad: `git checkout -b feature/tu-funcionalidad`
2. Ejecuta lint/build/tests antes de abrir PR.
3. Push a la rama: `git push origin feature/tu-funcionalidad`
4. Abre un Pull Request para revision.

Una tarea esta terminada solo cuando el PR fue aprobado, el pipeline pasa y el
codigo esta en `main`.

## Licencia

Proyecto propiedad de 365Soft.
