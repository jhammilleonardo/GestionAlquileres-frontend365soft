import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { Observable } from 'rxjs';

import { Contract } from '../../../../core/services/admin/contract.service';
import { AdminTenantUser } from '../../../../core/models/tenant-user.model';
import { PaymentMethod } from '../../../../core/models/payment.model';
import { TenantCurrencyPipe } from '../../../../shared/pipes/tenant-currency.pipe';
import { AppButtonComponent } from '../../../../shared/ui/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/ui/date-picker/date-picker.component';
import { AppDialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/ui/select/select.component';
import { AppTextareaComponent } from '../../../../shared/ui/textarea/textarea.component';
import { AppTextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-payment-create-dialog',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TranslocoModule,
    LucideAngularModule,
    TenantCurrencyPipe,
    AppButtonComponent,
    AppDatePickerComponent,
    AppDialogComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppTextFieldComponent,
  ],
  templateUrl: './payment-create-dialog.component.html',
  styleUrl: './payment-create-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentCreateDialogComponent {
  readonly Plus = Plus;
  readonly PaymentMethod = PaymentMethod;

  readonly open = input(false);
  readonly form = input.required<FormGroup>();
  readonly tenantSearchControl = input.required<FormControl<string | null>>();
  readonly filteredTenants = input.required<Observable<AdminTenantUser[]>>();
  readonly selectedTenant = input<AdminTenantUser | null>(null);
  readonly availableContracts = input<readonly Contract[]>([]);
  readonly selectedContract = input<Contract | null>(null);
  readonly loadingContracts = input(false);
  readonly statusOptions = input.required<readonly AppSelectOption[]>();
  readonly typeOptions = input.required<readonly AppSelectOption[]>();
  readonly methodOptions = input.required<readonly AppSelectOption[]>();
  readonly currencyOptions = input.required<readonly AppSelectOption[]>();

  readonly closed = output<void>();
  readonly tenantSelected = output<AdminTenantUser>();
  readonly contractSelected = output<Contract>();
  readonly submitted = output<void>();

  isMethod(...methods: PaymentMethod[]): boolean {
    return methods.includes(this.form().get('payment_method')?.value as PaymentMethod);
  }
}
