# Gestión de Alquileres 365Soft

Sistema de gestión de propiedades y alquileres desarrollado con Angular 21 y Angular Material.

## 🚀 Características

- ✅ Sidebar profesional colapsable estilo Buildium
- ✅ Layout completo con header y navegación
- ✅ Sistema de rutas configurado
- ✅ Angular Material con tema personalizado
- ✅ Estructura de carpetas organizada
- ✅ Componentes standalone (nueva arquitectura de Angular)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Angular CLI 21+

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <URL_DEL_REPOSITORIO>
cd GestionAlquileres_365Soft
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
```

4. Abrir el navegador en `http://localhost:4200/`

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                   # Servicios y modelos centrales
│   │   ├── services/          # AuthService, SidebarService
│   │   └── models/            # User, MenuOption
│   ├── shared/                # Componentes compartidos
│   │   └── layouts/           # MainLayout, Sidebar, Header
│   ├── features/              # Páginas del sistema
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── propiedades/       # Gestión de propiedades
│   │   ├── inquilinos/        # Gestión de inquilinos
│   │   ├── contratos/         # Gestión de contratos
│   │   ├── pagos/             # Gestión de pagos
│   │   └── mantenimiento/     # Gestión de mantenimiento
│   ├── app.routes.ts          # Configuración de rutas
│   ├── app.config.ts          # Configuración de la aplicación
│   └── app.ts                 # Componente raíz
└── styles.scss                # Estilos globales
```

## 🎨 Tecnologías Utilizadas

- **Angular 21.1.0** - Framework frontend
- **Angular Material 21.1.1** - Biblioteca de componentes UI
- **Angular CDK 21.1.1** - Componentes de desarrollo
- **SCSS** - Preprocesador de CSS
- **TypeScript 5.9.2** - Lenguaje de programación

## 🔧 Scripts Disponibles

```bash
npm start              # Inicia el servidor de desarrollo
npm run build          # Compila la aplicación para producción
npm run test           # Ejecuta los tests
npm run watch          # Modo observación para desarrollo
```

## 👥 Cómo Trabajar en Este Proyecto

### 1. Clonar y Configurar

Cada miembro del equipo debe clonar el repositorio y ejecutar `npm install`.

### 2. Crear Nueva Funcionalidad

Para crear una nueva página/funcionalidad:

1. Crear la carpeta en `src/app/features/`
2. Crear el componente standalone:
   - `nombre.component.ts`
   - `nombre.component.html`
   - `nombre.component.scss`
3. Agregar la ruta en `src/app/app.routes.ts`
4. Agregar el ítem en el menú en `src/app/core/services/sidebar.service.ts`

### 3. Estilos

- Usa las variables CSS de Angular Material: `var(--mat-sys-*)`
- Respeta el tema establecido en `src/styles.scss`
- Mantén los estilos específicos del componente en su archivo `.scss`

### 4. Convenciones de Código

- Usar componentes **standalone**
- Usar **signals** para la gestión de estado
- Seguir la estructura de carpetas existente
- Usar **SCSS** para los estilos
- Nombres de archivos en **kebab-case**

## 🔐 Usuarios (Demo)

Actualmente el sistema tiene un usuario de demostración:
- **Email:** admin@365soft.com
- **Rol:** admin
- **Nombre:** Administrador

## 📦 Páginas Disponibles

- `/dashboard` - Dashboard principal
- `/propiedades` - Gestión de propiedades
- `/inquilinos` - Gestión de inquilinos
- `/contratos` - Gestión de contratos
- `/pagos` - Control de pagos
- `/mantenimiento` - Solicitudes de mantenimiento

## 🎯 Próximos Pasos

Este es el punto de partida del proyecto. Las siguientes funcionalidades están pendientes de desarrollo:

- [ ] Sistema de autenticación real
- [ ] CRUD de propiedades
- [ ] CRUD de inquilinos
- [ ] Gestión de contratos
- [ ] Sistema de pagos
- [ ] Reportes y estadísticas
- [ ] Configuración de perfil
- [ ] Sistema de notificaciones

## 📝 Notas Importantes

- El proyecto usa la nueva arquitectura de Angular 21 con componentes standalone
- Angular Material ya está configurado con un tema personalizado
- El sidebar es colapsable y responsive
- Todas las páginas están creadas pero vacías, listas para ser desarrolladas

## 🤝 Contribución

1. Crea una rama para tu funcionalidad: `git checkout -b feature/tu-funcionalidad`
2. Haz tus cambios y commit: `git commit -m "Descripción de cambios"`
3. Push a la rama: `git push origin feature/tu-funcionalidad`
4. Abre un Pull Request para revisión

## 📄 Licencia

Este proyecto es propiedad de 365Soft.

---

**Desarrollado por el equipo de 365Soft**

