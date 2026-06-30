import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { TenantFormDialogComponent } from './tenant-form-dialog.component';
import { AdminTenantUser, UpdateTenantUserDto } from '../../../../core/models/tenant-user.model';

const tenant = {
  id: 5,
  name: 'Ana Pérez',
  email: 'ana@mail.com',
  phone: '+591 70000000',
  role: 'INQUILINO',
  created_at: new Date().toISOString(),
} as AdminTenantUser;

describe('TenantFormDialogComponent', () => {
  function build() {
    TestBed.configureTestingModule({
      imports: [TenantFormDialogComponent],
      providers: [{ provide: TranslocoService, useValue: { translate: (k: string) => k } }],
    }).overrideComponent(TenantFormDialogComponent, { set: { template: '' } });
    return TestBed.createComponent(TenantFormDialogComponent);
  }

  it('precarga el formulario con los datos del inquilino al abrir', () => {
    const fixture = build();
    fixture.componentRef.setInput('tenant', tenant);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges(); // dispara el effect de precarga

    const value = fixture.componentInstance.form.getRawValue();
    expect(value.name).toBe('Ana Pérez');
    expect(value.email).toBe('ana@mail.com');
    expect(value.phone).toBe('+591 70000000');
  });

  it('submit emite el DTO con los datos editados', () => {
    const fixture = build();
    fixture.componentRef.setInput('tenant', tenant);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.get('name')?.setValue('Ana M. Pérez');

    let emitted: UpdateTenantUserDto | undefined;
    component.saved.subscribe((dto) => (emitted = dto));
    component.submit();

    expect(emitted).toEqual({
      name: 'Ana M. Pérez',
      email: 'ana@mail.com',
      phone: '+591 70000000',
    });
  });

  it('submit NO emite si el formulario es inválido', () => {
    const fixture = build();
    const component = fixture.componentInstance;
    component.form.get('email')?.setValue('no-es-email');

    const saved = vi.fn();
    component.saved.subscribe(saved);
    component.submit();

    expect(saved).not.toHaveBeenCalled();
  });
});
