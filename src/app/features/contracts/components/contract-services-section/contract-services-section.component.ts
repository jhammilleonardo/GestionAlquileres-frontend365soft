import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-contract-services-section',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './contract-services-section.component.html',
  styleUrl: './contract-services-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractServicesSectionComponent {
  readonly form = input.required<FormGroup>();
  readonly serviceOptions = input.required<readonly string[]>();

  isServiceSelected(service: string): boolean {
    const services = (this.form().get('included_services')?.value as string[]) || [];
    return services.includes(service);
  }

  toggleService(service: string, event: Event): void {
    const services = [...(((this.form().get('included_services')?.value as string[]) || []) ?? [])];
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    const next = checked
      ? Array.from(new Set([...services, service]))
      : services.filter((item) => item !== service);
    this.form().patchValue({ included_services: next });
  }
}
