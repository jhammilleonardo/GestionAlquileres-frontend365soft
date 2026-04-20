import { Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-inquilinos',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './inquilinos.component.html',
  styleUrl: './inquilinos.component.scss',
})
export class InquilinosComponent {}
