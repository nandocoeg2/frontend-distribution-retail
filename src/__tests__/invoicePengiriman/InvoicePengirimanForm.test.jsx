import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoicePengirimanForm from '../../components/invoicePengiriman/InvoicePengirimanForm';
import toastService from '../../services/toastService';

vi.mock('../../services/toastService', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('InvoicePengirimanForm', () => {
  const mockInvoice = {
    id: 'inv-test-1',
    no_invoice: 'INV/2026/001',
    ppn_percentage: 11,
    invoiceDetails: [
      {
        id: 'det-1',
        plu: 'PLU001',
        nama_barang: 'Item 1',
        quantity: 5,
        satuan: 'PCS',
        harga: 10000,
        potongan_a: 10,
        potongan_b: 0,
      },
      {
        id: 'det-2',
        plu: 'PLU002',
        nama_barang: 'Item 2',
        quantity: 2,
        satuan: 'BOX',
        harga: 50000,
        potongan_a: 0,
        potongan_b: 5,
      },
    ],
  };

  it('renders summary cards and all item rows with auto calculations', () => {
    render(
      <InvoicePengirimanForm
        initialValues={mockInvoice}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Summary cards check
    expect(screen.getByText('Rincian Finansial')).toBeDefined();
    expect(screen.getAllByText('Grand Total').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Harga (setelah diskon)')).toBeDefined();
    expect(screen.getAllByText(/PPN/).length).toBeGreaterThanOrEqual(1);

    // Items check
    expect(screen.getByText('PLU001')).toBeDefined();
    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('PLU002')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();

    // Item 1: Qty 5, Price 10000, Pot A 10% -> Harga Pot A 9000, Total DPP 45000, PPN 4950, Grand Total 49950
    expect(screen.getAllByText('9.000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('45.000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('4.950').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('49.950').length).toBeGreaterThanOrEqual(1);

    // Item 2: Qty 2, Price 50000, Pot B 5% -> Harga Pot B 47500, Total DPP 95000, PPN 10450, Grand Total 105450
    expect(screen.getAllByText('47.500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('95.000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('10.450').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('105.450').length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing QTY, Harga, Pot A, Pot B and recalculates live', () => {
    const handleSubmit = vi.fn();
    render(
      <InvoicePengirimanForm
        initialValues={mockInvoice}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
        formId="test-form"
      />
    );

    const spinButtons = screen.getAllByRole('spinbutton');
    // For 2 items: [Qty1, Harga1, PotA1, PotB1, Qty2, Harga2, PotA2, PotB2]
    expect(spinButtons.length).toBe(8);

    // Change Item 1 Qty to 10
    fireEvent.change(spinButtons[0], { target: { value: '10' } });

    // Test "Hitung otomatis" button
    const hitungBtn = screen.getByRole('button', { name: /hitung otomatis/i });
    fireEvent.click(hitungBtn);
    expect(toastService.info).toHaveBeenCalledWith(
      expect.stringContaining('Nilai finansial dihitung otomatis')
    );

    // Submit form
    const form = document.getElementById('test-form');
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.sub_total).toBe(200000); // (10*10000) + (2*50000)
    expect(submittedData.total_price).toBe(185000);
    expect(submittedData.ppnRupiah).toBe(20350);
    expect(submittedData.grand_total).toBe(205350);
    expect(submittedData.invoiceDetails[0].quantity).toBe(10);
  });

  it('displays empty state when no items exist', () => {
    render(
      <InvoicePengirimanForm
        initialValues={{ id: 'inv-empty', invoiceDetails: [] }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Tidak ada detail barang')).toBeDefined();
  });
});
