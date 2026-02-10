import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, ChevronDown, ChevronUp } from 'lucide-angular';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  readonly HelpCircle = HelpCircle;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  faqs = [
    {
      question: '¿Cómo puedo alquilar una propiedad?',
      answer: 'Para alquilar una propiedad, primero debes buscar entre nuestras propiedades disponibles. Una vez que encuentres una que te guste, puedes solicitar una visita o aplicar directamente a través de nuestra plataforma. Nuestro equipo te guiará a través de todo el proceso.',
      isOpen: false
    },
    {
      question: '¿Qué documentos necesito para alquilar?',
      answer: 'Generalmente requerimos: documento de identidad, comprobante de ingresos, referencias personales y laborales. Dependiendo del propietario, pueden solicitar documentos adicionales.',
      isOpen: false
    },
    {
      question: '¿Cuánto tiempo toma el proceso de alquiler?',
      answer: 'El proceso suele tomar entre 3 a 7 días hábiles, dependiendo de la verificación de documentos y la disponibilidad del propietario para firmar el contrato.',
      isOpen: false
    },
    {
      question: '¿Puedo cancelar mi contrato antes de tiempo?',
      answer: 'Sí, pero esto dependerá de los términos del contrato. Generalmente hay penalizaciones por cancelación anticipada. Te recomendamos revisar cuidadosamente tu contrato antes de firmar.',
      isOpen: false
    },
    {
      question: '¿Cómo se realizan los pagos de alquiler?',
      answer: 'Los pagos se pueden realizar a través de nuestra plataforma en línea de forma segura. Aceptamos transferencias bancarias, tarjetas de crédito/débito y otros métodos de pago.',
      isOpen: false
    },
    {
      question: '¿Qué hago si necesito mantenimiento en la propiedad?',
      answer: 'Puedes reportar cualquier necesidad de mantenimiento a través de nuestra plataforma. Nuestro equipo coordinará con el propietario para resolver el problema lo antes posible.',
      isOpen: false
    },
    {
      question: '¿Puedo tener mascotas en la propiedad?',
      answer: 'Esto depende de las políticas del propietario. Algunas propiedades permiten mascotas y otras no. Esta información se indica claramente en el perfil de cada propiedad.',
      isOpen: false
    },
    {
      question: '¿Hay garantía de depósito?',
      answer: 'Sí, generalmente se requiere un depósito de garantía equivalente a un mes de alquiler. Este depósito se devuelve al finalizar el contrato, menos cualquier deducción por daños o pagos pendientes.',
      isOpen: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  openAll() {
    this.faqs.forEach(faq => faq.isOpen = true);
  }

  closeAll() {
    this.faqs.forEach(faq => faq.isOpen = false);
  }
}
