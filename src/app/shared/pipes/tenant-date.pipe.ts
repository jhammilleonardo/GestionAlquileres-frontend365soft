import { Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../../core/services/format.service';

@Pipe({ name: 'tenantDate', standalone: true, pure: false })
export class TenantDatePipe implements PipeTransform {
  private formatService = inject(FormatService);

  transform(value: string | Date | undefined | null, includeTime = false): string {
    return includeTime
      ? this.formatService.formatDateTime(value)
      : this.formatService.formatDate(value);
  }
}
