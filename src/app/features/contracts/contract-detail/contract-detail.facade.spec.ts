import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminContractService } from '../../../core/services/admin/admin-contract.service';
import { SlugService } from '../../../core/services/slug.service';
import {
  Contract,
  ContractStatus,
  RenewContractResponse,
} from '../../../core/models/contract.model';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ContractDetailFacade } from './contract-detail.facade';

describe('ContractDetailFacade', () => {
  const contract: Contract = {
    id: 10,
    contract_number: 'C-10',
    status: ContractStatus.ACTIVO,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    monthly_rent: 1000,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  let service: {
    getContract: ReturnType<typeof vi.fn>;
    getContractHistory: ReturnType<typeof vi.fn>;
    downloadPDF: ReturnType<typeof vi.fn>;
    renewContract: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ContractDetailFacade;

  beforeEach(() => {
    service = {
      getContract: vi.fn(),
      getContractHistory: vi.fn(),
      downloadPDF: vi.fn(),
      renewContract: vi.fn(),
      updateStatus: vi.fn(),
    };
    router = { navigateByUrl: vi.fn() };
    confirm = { confirm: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ContractDetailFacade,
        { provide: AdminContractService, useValue: service },
        { provide: Router, useValue: router },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        { provide: SlugService, useValue: { buildUrl: (url: string) => `/demo${url}` } },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    facade = TestBed.inject(ContractDetailFacade);
  });

  it('loads contract and history', () => {
    service.getContract.mockReturnValue(of(contract));
    service.getContractHistory.mockReturnValue(of([contract]));

    facade.loadContract(contract.id);

    expect(facade.currentContract()).toEqual(contract);
    expect(facade.contractNumber()).toBe('C-10');
    expect(facade.history()).toEqual([contract]);
    expect(facade.isLoading()).toBe(false);
  });

  it('downloads the current contract PDF', () => {
    facade.currentContract.set(contract);

    facade.downloadPDF();

    expect(service.downloadPDF).toHaveBeenCalledWith(10);
  });

  it('renews a contract after confirmation', async () => {
    const response: RenewContractResponse = {
      ...contract,
      id: 11,
      contract_number: 'C-11',
      currency: 'USD',
      tenant_id: 12,
      property_id: 13,
      renewed_from: 10,
    };
    facade.currentContract.set(contract);
    confirm.confirm.mockResolvedValue(true);
    service.renewContract.mockReturnValue(of(response));

    await facade.renewContract();

    expect(service.renewContract).toHaveBeenCalledWith(10);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/demo/contratos/11');
    expect(toast.success).toHaveBeenCalled();
  });

  it('does not renew when confirmation is cancelled', async () => {
    facade.currentContract.set(contract);
    confirm.confirm.mockResolvedValue(false);

    await facade.renewContract();

    expect(service.renewContract).not.toHaveBeenCalled();
  });

  it('finalizes a contract and reloads it', async () => {
    facade.currentContract.set(contract);
    confirm.confirm.mockResolvedValue(true);
    service.updateStatus.mockReturnValue(of(contract));
    service.getContract.mockReturnValue(of({ ...contract, status: ContractStatus.FINALIZADO }));
    service.getContractHistory.mockReturnValue(of([]));

    await facade.finalizeContract();

    expect(service.updateStatus).toHaveBeenCalledWith(10, {
      status: ContractStatus.FINALIZADO,
      reason: 'contracts.detail.finalizedReason',
    });
    expect(service.getContract).toHaveBeenCalledWith(10);
  });

  it('shows an error when finalizing fails', async () => {
    facade.currentContract.set(contract);
    confirm.confirm.mockResolvedValue(true);
    service.updateStatus.mockReturnValue(throwError(() => new Error('fail')));

    await facade.finalizeContract();

    expect(toast.error).toHaveBeenCalledWith('contracts.detail.finalizeError');
  });
});
