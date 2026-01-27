import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideAngularModule, Heart, Bookmark, Trash2, Hand, Settings, User, Mail, MessageSquare, CheckCircle, XCircle, Code, Home, Search, Plus, Edit, Phone, MapPin, Calendar, ArrowLeft, ArrowRight, Menu, X, Info, AlertTriangle, AlertCircle } from 'lucide-angular';

interface TableColumn {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-componentes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatListModule,
    LucideAngularModule
  ],
  templateUrl: './componentes.component.html',
  styleUrl: './componentes.component.scss'
})
export class ComponentesComponent {
  private snackBar = inject(MatSnackBar);

  // Signals para formularios
  nombre = signal('');
  email = signal('');
  mensaje = signal('');
  aceptoTerminos = signal(false);
  genero = signal('');
  pais = signal('');
  sliderValue = signal(50);
  toggleValue = signal(false);

  // Datos para tabla
  columns: string[] = ['name', 'email', 'age'];
  dataSource: TableColumn[] = [
    { name: 'Juan Pérez', email: 'juan@example.com', age: 28 },
    { name: 'María García', email: 'maria@example.com', age: 34 },
    { name: 'Carlos López', email: 'carlos@example.com', age: 45 },
    { name: 'Ana Martínez', email: 'ana@example.com', age: 29 }
  ];

  // Datos para select
  paises = [
    { value: 'arg', viewValue: 'Argentina' },
    { value: 'mex', viewValue: 'México' },
    { value: 'esp', viewValue: 'España' },
    { value: 'col', viewValue: 'Colombia' }
  ];

  // Progress
  progressValue = signal(0);

  // Chips
  chips = ['Angular', 'TypeScript', 'SCSS', 'RxJS'];
  selectedChip = signal('');

  // Lucide icons
  readonly Heart = Heart;
  readonly Bookmark = Bookmark;
  readonly Trash2 = Trash2;
  readonly Hand = Hand;
  readonly Settings = Settings;
  readonly User = User;
  readonly Mail = Mail;
  readonly MessageSquare = MessageSquare;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Code = Code;
  readonly Home = Home;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Edit = Edit;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Menu = Menu;
  readonly X = X;
  readonly Info = Info;
  readonly AlertTriangle = AlertTriangle;
  readonly AlertCircle = AlertCircle;

  constructor() {
    // Simular progreso
    setInterval(() => {
      this.progressValue.update(v => (v >= 100 ? 0 : v + 10));
    }, 1000);
  }

  // Métodos para ejemplos
  mostrarMensaje(tipo: string) {
    const mensajes: Record<string, string> = {
      boton: '¡Has hecho clic en un botón!',
      principal: 'Este es el botón principal',
      accion: 'Acción ejecutada',
      icono: 'Botón con ícono clickeado'
    };

    this.snackBar.open(mensajes[tipo] || 'Mensaje', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  onSubmit() {
    console.log('Formulario enviado:', {
      nombre: this.nombre(),
      email: this.email(),
      mensaje: this.mensaje(),
      genero: this.genero(),
      pais: this.pais()
    });

    this.snackBar.open('Formulario enviado (revisa la consola)', 'Cerrar', {
      duration: 3000
    });
  }

  onChipClick(chip: string) {
    this.selectedChip.set(chip);
    this.snackBar.open(`Seleccionaste: ${chip}`, 'Cerrar', { duration: 2000 });
  }
}
