import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvoicePengirimanDetailCard from '../../components/invoicePengiriman/InvoicePengirimanDetailCard';

describe('InvoicePengirimanDetailCard', () => {
  const mockInvoice = {
    id: 'inv-1',
    no_invoice: 'BJM/00899/INV/SAT/VI/26',
    invoiceDetails: [
      {
        id: 'det-1',
        plu: 'PLU01',
        item: { item_name: 'Product A' },
        quantity: 10,
        harga: 50000,
        total: 500000,
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
    // Tab Ringkasan should NOT exist
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
});
