import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Expense,
  ExpenseCategory,
  ExpensePaymentStatus,
  ExpenseResponsibility,
  ExpenseScope,
} from '../../core/models/expense.model';
import { ExpenseService } from '../../core/services/admin/expense.service';
import { PropertyService } from '../../core/services/admin/property.service';
import { VendorService } from '../../core/services/admin/vendor.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ExpensesFacade } from './expenses.facade';

describe('ExpensesFacade', () => {
  const expense: Expense = {
    id: 1,
    property_id: 10,
    property: { id: 10, title: 'Casa' },
    category: ExpenseCategory.MAINTENANCE,
    expense_scope: ExpenseScope.LONG_TERM,
    responsibility: ExpenseResponsibility.OWNER,
    payment_status: ExpensePaymentStatus.PENDING,
    amount: 250,
    paid_amount: 0,
    currency: 'BOB',
    date: '2026-05-01',
    description: 'Reparacion',
    affects_owner_statement: true,
    is_reimbursable: true,
  };

  let expenseService: {
    list: ReturnType<typeof vi.fn>;
    getMonthlyBalance: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    uploadReceipt: ReturnType<typeof vi.fn>;
    registerPayment: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let confirm: { confirm: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let facade: ExpensesFacade;

  beforeEach(() => {
    expenseService = {
      list: vi.fn(() => of({ data: [expense], total: 1 })),
      getMonthlyBalance: vi.fn(() =>
        of([
          { month: '2026-04', income: 1000, expenses: 200 },
          { month: '2026-05', income: 1200, expenses: 250 },
        ]),
      ),
      create: vi.fn(() => of(expense)),
      update: vi.fn(() => of(expense)),
      uploadReceipt: vi.fn(() => of({ ...expense, receipt_url: 'storage/receipts/acme/file.pdf' })),
      registerPayment: vi.fn(() => of({ ...expense, paid_amount: 100 })),
      remove: vi.fn(() => of(undefined)),
    };
    confirm = { confirm: vi.fn(() => Promise.resolve(true)) };
    toast = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ExpensesFacade,
        { provide: ExpenseService, useValue: expenseService },
        {
          provide: VendorService,
          useValue: { list: vi.fn(() => of([{ id: 3, name: 'Vendor' }])) },
        },
        {
          provide: PropertyService,
          useValue: { getAdminProperties: vi.fn(() => of([{ id: 10, title: 'Casa' }])) },
        },
        { provide: ConfirmDialogService, useValue: confirm },
        { provide: ToastService, useValue: toast },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) => key,
            getActiveLang: () => 'es',
          },
        },
      ],
    });
    facade = TestBed.inject(ExpensesFacade);
  });

  it('loads expenses, properties, vendors and balance', () => {
    expect(facade.expenses()).toEqual([expense]);
    expect(facade.propertyOptions()).toEqual([{ value: 10, label: 'Casa' }]);
    expect(facade.vendorOptions()).toEqual([{ value: 3, label: 'Vendor' }]);
    expect(facade.totalIncome()).toBe(2200);
    expect(facade.totalExpenses()).toBe(450);
    expect(facade.netResult()).toBe(1750);
    expect(facade.listedExpenseTotal()).toBe(250);
    expect(facade.ownerDeductionTotal()).toBe(250);
    expect(facade.reimbursableTotal()).toBe(250);
    expect(facade.pendingTotal()).toBe(250);
    expect(facade.longTermTotal()).toBe(250);
  });

  it('loads with filters', () => {
    facade.filterForm.patchValue({
      property_id: 10,
      category: ExpenseCategory.INSURANCE,
      expense_scope: ExpenseScope.SHORT_TERM,
      responsibility: ExpenseResponsibility.GUEST,
      payment_status: ExpensePaymentStatus.PENDING,
      is_reimbursable: 'true',
      from: '2026-05-01',
      to: '2026-05-31',
    });

    facade.applyFilters();

    expect(expenseService.list).toHaveBeenLastCalledWith({
      limit: 200,
      property_id: 10,
      category: ExpenseCategory.INSURANCE,
      expense_scope: ExpenseScope.SHORT_TERM,
      responsibility: ExpenseResponsibility.GUEST,
      payment_status: ExpensePaymentStatus.PENDING,
      is_reimbursable: 'true',
      from: '2026-05-01',
      to: '2026-05-31',
    });
    expect(expenseService.getMonthlyBalance).toHaveBeenLastCalledWith(10);
  });

  it('creates an expense from the form', () => {
    facade.openCreate();
    facade.form.patchValue({
      property_id: 10,
      category: ExpenseCategory.CLEANING,
      expense_scope: ExpenseScope.SHORT_TERM,
      responsibility: ExpenseResponsibility.GUEST,
      payment_status: ExpensePaymentStatus.PAID,
      amount: 99,
      date: '2026-05-10',
      vendor_id: 3,
      description: 'Limpieza',
      is_reimbursable: true,
    });

    facade.save();

    expect(expenseService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        property_id: 10,
        category: ExpenseCategory.CLEANING,
        expense_scope: ExpenseScope.SHORT_TERM,
        responsibility: ExpenseResponsibility.GUEST,
        payment_status: ExpensePaymentStatus.PAID,
        amount: 99,
        vendor_name: 'Vendor',
        is_reimbursable: true,
      }),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('uploads receipt after saving an expense', () => {
    const receipt = new File(['%PDF-1.4'], 'factura.pdf', { type: 'application/pdf' });
    facade.openCreate();
    facade.form.patchValue({
      property_id: 10,
      category: ExpenseCategory.CLEANING,
      amount: 99,
      date: '2026-05-10',
    });
    facade.selectReceipt(receipt);

    facade.save();

    expect(expenseService.uploadReceipt).toHaveBeenCalledWith(expense.id, receipt);
  });

  it('updates an expense from the form', () => {
    facade.openEdit(expense);
    facade.form.patchValue({ amount: 300 });

    facade.save();

    expect(expenseService.update).toHaveBeenCalledWith(
      expense.id,
      expect.objectContaining({ amount: 300 }),
    );
  });

  it('registers a partial vendor payment', () => {
    facade.openPaymentDialog(expense);
    facade.paymentForm.patchValue({
      amount: 100,
      payment_date: '2026-05-15',
      payment_method: 'TRANSFER',
      reference_number: 'TRX-1',
    });

    facade.registerPayment();

    expect(expenseService.registerPayment).toHaveBeenCalledWith(
      expense.id,
      expect.objectContaining({
        amount: 100,
        currency: 'BOB',
        payment_date: '2026-05-15',
        payment_method: 'TRANSFER',
        reference_number: 'TRX-1',
      }),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('deletes an expense after confirmation', async () => {
    await facade.deleteExpense(expense);

    expect(expenseService.remove).toHaveBeenCalledWith(expense.id);
    expect(toast.success).toHaveBeenCalled();
  });
});
