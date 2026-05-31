import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inquilinos',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './inquilinos.component.html',
  styleUrl: './inquilinos.component.scss',
})
export class InquilinosComponent {}
