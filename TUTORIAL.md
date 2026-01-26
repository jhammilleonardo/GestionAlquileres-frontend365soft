# Tutorial de Angular 21 - Guía para el Equipo

## 📚 Índice

1. [Introducción a Angular](#introducción)
2. [Estructura del Proyecto](#estructura)
3. [Anatomía de un Componente](#componente)
4. [TypeScript (.ts)](#typescript)
5. [Templates (.html)](#templates)
6. [Estilos (.scss)](#estilos)
7. [Sistema de Rutas](#rutas)
8. [Signals](#signals)
9. [Directivas de Angular](#directivas)
10. [Servicios](#servicios)
11. [Angular Material](#angular-material)

---

## Introducción <a name="introducción"></a>

**Angular** es un framework de JavaScript desarrollado por Google para construir aplicaciones web. Usa **TypeScript** (un superconjunto de JavaScript) que añade tipos estáticos y otras características.

### Conceptos Básicos

- **Componente**: Bloques fundamentales de construcción de la UI
- **Módulo**: Contenedor de grupos de funcionalidades relacionadas
- **Servicio**: Clase para lógica de negocio y datos
- **Directiva**: Instrucciones en el DOM para modificar comportamiento
- **Pipe**: Transformación de datos en templates

---

## Estructura del Proyecto <a name="estructura"></a>

```
GestionAlquileres_365Soft/
├── src/
│   ├── app/                          # Nuestra aplicación
│   │   ├── core/                     # Servicios y modelos centrales
│   │   │   ├── services/            # Lógica de negocio (auth, sidebar)
│   │   │   └── models/              # Interfaces y tipos
│   │   ├── shared/                  # Componentes reutilizables
│   │   │   └── layouts/             # Layouts (sidebar, header)
│   │   ├── features/                # Páginas funcionales
│   │   │   ├── dashboard/           # Ejemplo de feature
│   │   │   ├── propiedades/
│   │   │   └── ...
│   │   ├── app.routes.ts            # Rutas de la app
│   │   ├── app.config.ts            # Configuración
│   │   └── app.ts                   # Componente raíz
│   ├── styles.scss                   # Estilos globales
│   ├── index.html                    # HTML principal
│   └── main.ts                       # Punto de entrada
├── angular.json                       # Config de Angular
├── package.json                       # Dependencias
└── tsconfig.json                      # Config de TypeScript
```

### Explicación de Carpetas

- **`app/core/`**: Servicios singleton que se usan en toda la app (autenticación, configuración)
- **`app/shared/`**: Componentes que se reutilizan en múltiples lugares
- **`app/features/`**: Páginas o funcionalidades específicas del negocio
- **`assets/`**: Imágenes, fuentes, archivos estáticos
- **`environments/`**: Configuración para diferentes entornos (dev, prod)

---

## Anatomía de un Componente <a name="componente"></a>

Un componente en Angular está formado por **4 archivos**:

```
mi-componente/
├── mi-componente.ts      # Lógica del componente (TypeScript)
├── mi-componente.html    # Template (HTML)
├── mi-componente.scss    # Estilos (SCSS)
└── mi-componente.spec.ts # Tests (opcional)
```

### Ejemplo Completo de un Componente

**`saludo.component.ts`**
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-saludo',           // Nombre de la etiqueta HTML
  standalone: true,                  // Componente independiente (Angular 17+)
  imports: [],                       // Otros componentes que usa
  templateUrl: './saludo.component.html',
  styleUrl: './saludo.component.scss'
})
export class SaludoComponent {
  nombre = 'Mundo';                  // Propiedad
}
```

**`saludo.component.html`**
```html
<div class="saludo">
  <h1>¡Hola, {{ nombre }}!</h1>
</div>
```

**`saludo.component.scss`**
```scss
.saludo {
  padding: 20px;
  background: var(--mat-sys-surface);

  h1 {
    color: var(--mat-sys-primary);
    font-size: 2rem;
  }
}
```

**Uso en otro componente:**
```html
<app-saludo></app-saludo>
```

---

## TypeScript (.ts) <a name="typescript"></a>

TypeScript añade **tipado estático** a JavaScript. Esto significa que definimos el tipo de datos de nuestras variables.

### Variables y Tipos Básicos

```typescript
// Declaración de variables
nombre: string = 'Juan';
edad: number = 25;
activo: boolean = true;
lista: string[] = ['a', 'b', 'c'];
opcional: string | null = null;
```

### Interfaces

Las interfaces definen la forma de un objeto:

```typescript
interface Usuario {
  id: string;
  nombre: string;
  email: string;
  edad?: number;           // ? significa opcional
}

const usuario: Usuario = {
  id: '1',
  nombre: 'Juan',
  email: 'juan@example.com'
};
```

### Clases

```typescript
export class Usuario {
  // Propiedades
  nombre: string;
  private edad: number;      // private = solo accesible dentro de la clase

  // Constructor
  constructor(nombre: string, edad: number) {
    this.nombre = nombre;
    this.edad = edad;
  }

  // Método
  saludar(): string {
    return `Hola, soy ${this.nombre}`;
  }

  // Getter
  getEdad(): number {
    return this.edad;
  }
}
```

### Signals (Novedad en Angular 16+)

Los **Signals** son la nueva forma de gestionar el estado reactivo:

```typescript
import { signal, computed, effect } from '@angular/core';

export class MiComponente {
  // Signal básico (como una variable reactiva)
  contador = signal(0);

  // Signal computado (se actualiza automáticamente)
  contadorDoble = computed(() => this.contador() * 2);

  // Efecto (se ejecuta cuando cambian los signals)
  constructor() {
    effect(() => {
      console.log('El contador es:', this.contador());
    });
  }

  incrementar() {
    // Para leer el valor: contador()
    // Para actualizar: contador.set(nuevoValor)
    // Para actualizar basado en el valor actual: contador.update(valor => valor + 1)
    this.contador.update(valor => valor + 1);
  }
}
```

### Métodos del Ciclo de Vida (Lifecycle Hooks)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({ ... })
export class MiComponente implements OnInit, OnDestroy {
  // Se ejecuta cuando se crea el componente
  ngOnInit() {
    console.log('Componente inicializado');
    // Aquí cargamos datos, nos suscribimos a servicios, etc.
  }

  // Se ejecuta cuando se destruye el componente
  ngOnDestroy() {
    console.log('Componente destruido');
    // Aquí limpiamos suscripciones, timers, etc.
  }
}
```

---

## Templates (.html) <a name="templates"></a>

Los templates usan una sintaxis especial de Angular llamada **template syntax**.

### Interpolación

Muestra valores de propiedades en el HTML:

```html
<p>Bienvenido, {{ nombre }}</p>              <!-- Simple -->
<p>El total es: {{ precio * cantidad }}</p>  <!-- Expresiones -->
<p>{{ usuario.nombre | uppercase }}</p>      <!-- Con pipe -->
```

### Property Binding

Une valores de TypeScript a propiedades de HTML:

```html
<img [src]="imagenUrl" [alt]="imagenAlt">
<button [disabled]="estaDesactivado">Click</button>
<div [class.active]="isActive">Caja activa</div>
<p [style.color]="colorTexto">Texto rojo</p>
```

### Event Binding

Responde a eventos del usuario:

```html
<button (click)="onClick()">Click me</button>
<input (input)="onInput($event)">
<div (mouseenter)="onMouseEnter()">Pasa el mouse</div>
```

### Two-Way Binding

Binding bidireccional (usado mucho en formularios):

```html
<input [(ngModel)]="nombre" />
<p>El nombre es: {{ nombre }}</p>
```

### Directivas Estructurales

**ngIf - Condicional:**
```html
<div *ngIf="mostrarMensaje">
  Este mensaje solo se muestra si mostrarMensaje es true
</div>

<!-- Con else -->
<div *ngIf="usuario; else noUsuario">
  Hola, {{ usuario.nombre }}
</div>
<ng-template #noUsuario>
  No hay usuario
</ng-template>
```

**ngFor - Bucles:**
```html
<ul>
  @for (item of items; track item.id) {
    <li>{{ item.nombre }}</li>
  }
</ul>

<!-- Con índice -->
@for (item of items; track item.id; let i = index) {
  <p>{{ i }}: {{ item.nombre }}</p>
}
```

**ngSwitch - Múltiples condiciones:**
```html
<div [ngSwitch]="estado">
  <p *ngSwitchCase="'activo'">Activo</p>
  <p *ngSwitchCase="'inactivo'">Inactivo</p>
  <p *ngSwitchDefault>Desconocido</p>
</div>
```

### Pipes (Transformaciones)

```html
<p>{{ fecha | date:'short' }}</p>           <!-- Formatea fecha -->
<p>{{ texto | uppercase }}</p>               <!-- MAYÚSCULAS -->
<p>{{ texto | lowercase }}</p>               <!-- minúsculas -->
<p>{{ precio | currency:'USD' }}</p>         <!-- Formato moneda -->
<p>{{ array | json }}</p>                    <!-- A JSON -->
<p>{{ texto | slice:0:10 }}</p>              <!-- Primeros 10 caracteres -->
<p>{{ valor | percent:'1.2-2' }}</p>         <!-- Porcentaje -->

<!-- Pipes encadenados -->
<p>{{ fecha | date:'short' | uppercase }}</p>
```

---

## Estilos (.scss) <a name="estilos"></a>

Usamos **SCSS** (Sassy CSS), que es un preprocesador de CSS con variables, anidamiento, y más.

### Variables CSS de Angular Material

```scss
/* Colores del sistema */
color: var(--mat-sys-primary);              /* Color primario */
color: var(--mat-sys-on-primary);           /* Texto sobre primario */
color: var(--mat-sys-surface);              /* Fondo */
color: var(--mat-sys-on-surface);           /* Texto sobre fondo */
color: var(--mat-sys-error);                /* Error */
background: var(--mat-sys-surface-container); /* Contenedor */
```

### Anidamiento

```scss
.mi-componente {
  padding: 20px;

  &.active {           /* & = .mi-componente.active */
    background: blue;
  }

  .titulo {
    font-size: 2rem;
    color: var(--mat-sys-on-surface);

    &:hover {          /* & = .titulo:hover */
      color: var(--mat-sys-primary);
    }
  }
}
```

### Mixins

```scss
// Definir un mixin
@mixin tarjeta {
  padding: 1rem;
  border-radius: 8px;
  background: var(--mat-sys-surface);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

// Usarlo
.mi-tarjeta {
  @include tarjeta();

  &.especial {
    @include tarjeta();
    border: 2px solid var(--mat-sys-primary);
  }
}
```

---

## Sistema de Rutas <a name="rutas"></a>

Las rutas permiten navegar entre diferentes páginas de la aplicación sin recargar.

### Configuración de Rutas

**`app.routes.ts`**
```typescript
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PropiedadesComponent } from './features/propiedades/propiedades.component';

export const routes: Routes = [
  {
    path: '',                          // Ruta base
    component: MainLayoutComponent,    // Layout principal
    children: [                        // Rutas hijas
      {
        path: '',                      // http://localhost:4200/
        redirectTo: 'dashboard',       // Redirige al dashboard
        pathMatch: 'full'
      },
      {
        path: 'dashboard',             // http://localhost:4200/dashboard
        component: DashboardComponent
      },
      {
        path: 'propiedades',           // http://localhost:4200/propiedades
        component: PropiedadesComponent
      },
      {
        path: '**',                    // Ruta comodín (404)
        redirectTo: 'dashboard'
      }
    ]
  }
];
```

### Navegación Programática

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

irAPropiedades() {
  this.router.navigate(['/propiedades']);
}

irAPropiedad(id: string) {
  this.router.navigate(['/propiedades', id]);  // /propiedades/123
}
```

### Navegación en el Template

```html
<a routerLink="/dashboard">Dashboard</a>
<a routerLink="/propiedades">Propiedades</a>
<a [routerLink]="['/propiedades', propiedadId]">
  Ver Propiedad
</a>

<!-- Con parámetros de consulta -->
<a [routerLink]="['/propiedades']"
   [queryParams]="{ page: 1, sort: 'name' }">
  Propiedades
</a>
```

---

## Signals <a name="signals"></a>

Los Signals son la forma moderna y recomendada de gestionar el estado en Angular.

### Signals Básicos

```typescript
import { signal } from '@angular/core';

// Crear un signal
contador = signal(0);

// Leer el valor
console.log(this.contador());  // 0

// Actualizar el valor
this.contador.set(5);

// Actualizar basado en el valor anterior
this.contador.update(valor => valor + 1);
```

### Computed Signals

Se calculan automáticamente a partir de otros signals:

```typescript
precio = signal(100);
cantidad = signal(5);

total = computed(() => this.precio() * this.cantidad());

// total se actualiza automáticamente cuando cambia precio o cantidad
```

### Efectos

Ejecutan código cuando cambian los signals:

```typescript
import { effect } from '@angular/core';

constructor() {
  effect(() => {
    console.log('El contador cambió:', this.contador());
    // Guardar en localStorage, hacer logging, etc.
  });
}
```

---

## Directivas de Angular <a name="directivas"></a>

Las directivas son instrucciones en el DOM.

### Directivas de Atributo

**ngClass - Aplicar clases condicionalmente:**
```html
<div [ngClass]="{ 'active': isActive, 'disabled': isDisabled }">
  Contenido
</div>

<!-- O -->
<div [class.active]="isActive"></div>
```

**ngStyle - Aplicar estilos condicionalmente:**
```html
<div [ngStyle]="{ 'color': colorTexto, 'font-size': tamano + 'px' }">
  Texto
</div>

<!-- O -->
<div [style.color]="isActive ? 'green' : 'red'"></div>
```

**ngModel - Two-way binding (formularios):**
```html
<input [(ngModel)]="nombre" />
<p>Tu nombre es: {{ nombre }}</p>
```

---

## Servicios <a name="servicios"></a>

Los servicios contienen lógica de negocio y pueden ser compartidos entre componentes.

### Crear un Servicio

```typescript
import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'  // Disponible en toda la app (singleton)
})
export class UsuarioService {
  // Signal con la lista de usuarios
  private usuariosSignal = signal<Usuario[]>([]);

  // Público para lectura
  usuarios = this.usuariosSignal.asReadonly();

  constructor() {
    // Cargar usuarios iniciales
    this.cargarUsuarios();
  }

  agregarUsuario(usuario: Usuario) {
    this.usuariosSignal.update(usuarios => [...usuarios, usuario]);
  }

  eliminarUsuario(id: string) {
    this.usuariosSignal.update(usuarios =>
      usuarios.filter(u => u.id !== id)
    );
  }

  private cargarUsuarios() {
    // Lógica para cargar desde API
  }
}
```

### Usar un Servicio en un Componente

```typescript
import { Component, inject } from '@angular/core';
import { UsuarioService } from './services/usuario.service';

@Component({ ... })
export class UsuariosComponent {
  // Forma moderna: inyección con inject()
  private usuarioService = inject(UsuarioService);

  usuarios = this.usuarioService.usuarios;  // Signal

  agregarNuevoUsuario() {
    this.usuarioService.agregarUsuario({
      id: '1',
      nombre: 'Juan'
    });
  }
}
```

---

## Angular Material <a name="angular-material"></a>

Angular Material es una biblioteca de componentes UI ya diseñados.

### Importar Componentes

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  imports: [
    MatButtonModule,    // Para botones
    MatCardModule,     // Para tarjetas
    MatInputModule     // Para inputs
  ],
  // ...
})
export class MiComponente {}
```

### Componentes Comunes

**Botones:**
```html
<button mat-button>Botón Básico</button>
<button mat-raised-button color="primary">Raised</button>
<button mat-stroked-button>Stroked</button>
<button mat-flat-button color="accent">Flat</button>
<button mat-icon-button>
  <mat-icon>favorite</mat-icon>
</button>
```

**Inputs:**
```html
<mat-form-field appearance="fill">
  <mat-label>Nombre</mat-label>
  <input matInput [(ngModel)]="nombre" />
</mat-form-field>

<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input matInput type="email" [(ngModel)]="email" />
  <mat-icon matSuffix>email</mat-icon>
</mat-form-field>
```

**Cards:**
```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Título</mat-card-title>
    <mat-card-subtitle>Subtítulo</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    <p>Contenido de la tarjeta</p>
  </mat-card-content>
  <mat-card-actions>
    <button mat-button>Action 1</button>
    <button mat-button>Action 2</button>
  </mat-card-actions>
</mat-card>
```

**Listas:**
```html
<mat-list>
  @for (item of items; track item.id) {
    <mat-list-item>
      <div matListItemTitle>{{ item.title }}</div>
      <div matListItemLine>{{ item.description }}</div>
    </mat-list-item>
  }
</mat-list>
```

**Tables:**
```html
<table mat-table [dataSource]="datos" class="mat-elevation-z8">
  <ng-container matColumnDef="nombre">
    <th mat-header-cell *matHeaderCellDef> Nombre </th>
    <td mat-cell *matCellDef="let elemento"> {{elemento.nombre}} </td>
  </ng-container>

  <tr mat-header-row *matHeaderRowDef="columnas"></tr>
  <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
</table>
```

---

## Tips y Buenas Prácticas

### ✅ Hacer

1. **Usar signals** para el estado reactivo
2. **Usar `inject()`** en lugar del constructor para servicios
3. **Usar componentes standalone** (Angular 17+)
4. **Mantener los componentes pequeños** (< 300 líneas)
5. **Usar interfaces** para tipar objetos
6. **Usar variables CSS de Angular Material**
7. **Separar lógica en servicios**

### ❌ Evitar

1. No poner lógica de negocio en el template
2. No usar `any` como tipo
3. No crear componentes muy grandes
4. No olvidar el `track` en `*ngFor`
5. No usar jQuery con Angular

---

## Recursos Útiles

- [Documentación Oficial de Angular](https://angular.dev)
- [Angular Material Components](https://material.angular.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Stack Overflow - Angular](https://stackoverflow.com/questions/tagged/angular)

---

**¡Happy coding! 🚀**
