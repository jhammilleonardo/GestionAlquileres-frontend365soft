import { Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../../core/services/format.service';

@Pipe({ name: 'tenantCurrency', standalone: true, pure: false })
export class TenantCurrencyPipe implements PipeTransform {
  private formatService = inject(FormatService);

  transform(value: number | undefined | null, currencyOverride?: string): string {
    return this.formatService.formatCurrency(value, currencyOverride);
  }
}
