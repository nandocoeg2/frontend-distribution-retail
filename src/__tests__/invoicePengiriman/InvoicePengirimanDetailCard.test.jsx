import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvoicePengirimanDetailCard from '../../components/invoicePengiriman/InvoicePengirimanDetailCard';
import invoicePengirimanService from '../../services/invoicePengirimanService';

vi.mock('../../services/invoicePengirimanService', () => ({
  default: {
    updateInvoicePengiriman: vi.fn(),
  },
}));

vi.mock('../../services/toastService', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('InvoicePengirimanDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInvoice = {
    id: 'inv-1',
    no_invoice: 'BJM/00899/INV/SAT/VI/26',
    invoiceDetails: [
      {
        id: 'det-1',
        plu: 'PLU01',
        nama_barang: 'Product A',
        quantity: 10,
        satuan: 'pcs',
        harga: 50000,
        total: 500000,
        discount_percentage: 0,
        discount_rupiah: 0,
        dasar_pengenaan_pajak: 500000,
        PPN_pecentage: 11,
        ppnRupiah: 55000,
      },
    ],
  };

  it('renders detail card without Ringkasan tab and directly shows items', () => {
    render(
      <InvoicePengirimanDetailCard
        invoice={mockInvoice}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('BJM/00899/INV/SAT/VI/26')).toBeDefined();
    expect(screen.queryByText('Ringkasan')).toBeNull();
  });

  it('renders item details and enriches Pot A and Pot B from purchaseOrderDetails', () => {
    const invoiceWithPO = {
      id: 'inv-2',
      no_invoice: 'INV-TEST-002',
      invoiceDetails: [
        {
          id: 'det-1',
          itemId: 'item-1',
          plu: 'PLU01',
          nama_barang: 'Product Alpha',
          quantity: 10,
          satuan: 'pcs',
          harga: 100000,
          dasar_pengenaan_pajak: 931000,
          PPN_pecentage: 11,
          ppnRupiah: 102410,
        },
      ],
      purchaseOrder: {
        id: 'po-1',
        purchaseOrderDetails: [
          {
            itemId: 'item-1',
            plu: 'PLU01',
            nama_barang: 'Product Alpha',
            potongan_a: 5,
            harga_after_potongan_a: 95000,
            potongan_b: 2,
            harga_after_potongan_b: 93100,
            harga_netto: 93100,
            total_pembelian: 931000,
          },
        ],
      },
    };

    render(
      <InvoicePengirimanDetailCard
        invoice={invoiceWithPO}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Product Alpha')).toBeDefined();
    expect(screen.getByText('5%')).toBeDefined();
    expect(screen.getByText('2%')).toBeDefined();
    expect(screen.getAllByText('95.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('93.100').length).toBeGreaterThan(0);
    expect(screen.getAllByText('931.000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('102.410').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1.033.410').length).toBeGreaterThan(0);
  });

  it('enters edit mode and displays financial summary cards and editable table', async () => {
    const invoiceWithPO = {
      id: 'inv-edit',
      no_invoice: 'INV-EDIT-001',
      invoiceDetails: [
        {
          id: 'det-1',
          itemId: 'item-1',
          plu: 'PLU01',
          nama_barang: 'Product Alpha',
          quantity: 10,
          satuan: 'pcs',
          harga: 100000,
          dasar_pengenaan_pajak: 931000,
          PPN_pecentage: 11,
          ppnRupiah: 102410,
        },
      ],
      purchaseOrder: {
        id: 'po-1',
        purchaseOrderDetails: [
          {
            itemId: 'item-1',
            plu: 'PLU01',
            nama_barang: 'Product Alpha',
            potongan_a: 5,
            harga_after_potongan_a: 95000,
            potongan_b: 2,
            harga_after_potongan_b: 93100,
          },
        ],
      },
    };

    render(
      <InvoicePengirimanDetailCard
        invoice={invoiceWithPO}
        onClose={vi.fn()}
        onInvoiceUpdated={vi.fn()}
      />
    );

    // Click Edit button
    const editBtn = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editBtn);

    // Verify financial section header and summary cards are present
    expect(screen.getByText('Rincian Finansial')).toBeDefined();
    expect(
      screen.getByText('Pastikan nilai sesuai dengan dokumen dan perhitungan pajak.')
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /hitung otomatis/i })).toBeDefined();

    expect(screen.getAllByText('Grand Total').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Harga (setelah diskon)')).toBeDefined();
    expect(screen.getAllByText(/PPN/).length).toBeGreaterThanOrEqual(1);

    // Verify inputs for QTY, Harga, Pot A, Pot B
    const qtyInputs = screen.getAllByRole('spinbutton');
    // QTY, Harga, Pot A, Pot B
    expect(qtyInputs.length).toBe(4);

    // Change QTY from 10 to 20
    fireEvent.change(qtyInputs[0], { target: { value: '20' } });

    // Submit the form by clicking Simpan
    invoicePengirimanService.updateInvoicePengiriman.mockResolvedValue({
      status: 'success',
      data: { id: 'inv-edit' },
    });

    const form = document.getElementById('invoice-pengiriman-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(invoicePengirimanService.updateInvoicePengiriman).toHaveBeenCalledTimes(1);
    });

    const calledPayload = invoicePengirimanService.updateInvoicePengiriman.mock.calls[0][1];
    expect(calledPayload.invoiceDetails[0].quantity).toBe(20);
    expect(calledPayload.invoiceDetails[0].harga).toBe(100000);
    expect(calledPayload.invoiceDetails[0].potongan_a).toBe(5);
    expect(calledPayload.invoiceDetails[0].potongan_b).toBe(2);
    expect(calledPayload.sub_total).toBe(2000000);
    expect(calledPayload.total_price).toBe(1862000); // 20 * 93100
    expect(calledPayload.ppnRupiah).toBe(204820); // 1862000 * 11%
    expect(calledPayload.grand_total).toBe(2066820); // 1862000 + 204820
  });
});
