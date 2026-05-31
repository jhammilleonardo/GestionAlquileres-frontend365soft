import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { ContratosFacade } from './contratos.facade';
import { AdminContractService } from '../../core/services/admin/admin-contract.service';
import { SlugService } from '../../core/services/slug.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Contract, ContractStatus } from '../../core/models/contract.model';

function buildContract(
  id: number,
  overrides: Partial<{ tenant: string; email: string; property: string; number: string }> = {},
): Contract {
  return {
    id,
    contract_number: overrides.number ?? `C-${id}`,
    status: ContractStatus.ACTIVO,
    tenant: { name: overrides.tenant ?? 'Juan Pérez', email: overrides.email ?? 'juan@mail.com' },
    property: { title: overrides.property ?? 'Casa Central' },
  } as unknown as Contract;
}

describe('ContratosFacade', () => {
  let contractsSignal: ReturnType<typeof signal<Contract[]>>;
  let loadContractsSpy: ReturnType<typeof vi.fn>;
  let loadDashboardSpy: ReturnType<typeof vi.fn>;
  let renewContractSpy: ReturnType<typeof vi.fn>;
  let confirmSpy: ReturnType<typeof vi.fn>;
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;
  let toastSuccess: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  function setup(): ContratosFacade {
    contractsSignal = signal<Contract[]>([]);
    loadContractsSpy = vi.fn();
    loadDashboardSpy = vi.fn();
    renewContractSpy = vi.fn().mockReturnValue(of({ id: 99 }));
    confirmSpy = vi.fn().mockResolvedValue(true);
    navigateByUrlSpy = vi.fn().mockResolvedValue(true);
    toastSuccess = vi.fn();
    toastError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ContratosFacade,
        {
          provide: AdminContractService,
          useValue: {
            contracts: contractsSignal.asReadonly(),
            dashboard: signal(null).asReadonly(),
            isLoading: signal(false).asReadonly(),
            loadContracts: loadContractsSpy,
            loadDashboard: loadDashboardSpy,
            renewContract: renewContractSpy,
            downloadPDF: vi.fn(),
          },
        },
        {
          provide: SlugService,
          useValue: { buildUrl: (p: string) => `/acme${p}` },
        },
        { provide: Router, useValue: { navigateByUrl: navigateByUrlSpy } },
        { provide: ConfirmDialogService, useValue: { confirm: confirmSpy } },
        { provide: ToastService, useValue: { success: toastSuccess, error: toastError } },
      ],
    });
    return TestBed.inject(ContratosFacade);
  }

  it('init carga contratos y dashboard', () => {
    const facade = setup();
    facade.init();
    expect(loadContractsSpy).toHaveBeenCalled();
    expect(loadDashboardSpy).toHaveBeenCalled();
  });

  it('filtra contratos por término (nombre, email, propiedad o número)', () => {
    const facade = setup();
    contractsSignal.set([
      buildContract(1, { tenant: 'Ana López' }),
      buildContract(2, { tenant: 'Beto Ruiz', email: 'beto@x.com' }),
    ]);
    facade.searchTerm.set('beto');
    expect(facade.filteredContracts()).toHaveLength(1);
    expect(facade.filteredContracts()[0].id).toBe(2);
  });

  it('hasActiveFilters refleja término o estado', () => {
    const facade = setup();
    expect(facade.hasActiveFilters()).toBe(false);
    facade.searchTerm.set('x');
    expect(facade.hasActiveFilters()).toBe(true);
  });

  it('onStatusChange actualiza el filtro y recarga', () => {
    const facade = setup();
    facade.onStatusChange(ContractStatus.ACTIVO);
    expect(facade.statusFilter()).toBe(ContractStatus.ACTIVO);
    expect(loadContractsSpy).toHaveBeenCalled();
  });

  it('clearFilters limpia término y estado', () => {
    const facade = setup();
    facade.searchTerm.set('x');
    facade.statusFilter.set(ContractStatus.ACTIVO);
    facade.clearFilters();
    expect(facade.searchTerm()).toBe('');
    expect(facade.statusFilter()).toBe('');
  });

  it('buildDetailUrl y buildEditUrl construyen rutas con slug', () => {
    const facade = setup();
    expect(facade.buildDetailUrl(5)).toBe('/acme/contratos/5');
    expect(facade.buildEditUrl(5)).toBe('/acme/contratos/5/editar');
  });

  it('renewContract confirma, renueva y navega al nuevo contrato', async () => {
    const facade = setup();
    await facade.renewContract(7);
    expect(confirmSpy).toHaveBeenCalled();
    expect(renewContractSpy).toHaveBeenCalledWith(7);
    expect(toastSuccess).toHaveBeenCalled();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/acme/contratos/99');
  });

  it('renewContract no hace nada si el usuario cancela', async () => {
    const facade = setup();
    confirmSpy.mockResolvedValue(false);
    await facade.renewContract(7);
    expect(renewContractSpy).not.toHaveBeenCalled();
  });
});
