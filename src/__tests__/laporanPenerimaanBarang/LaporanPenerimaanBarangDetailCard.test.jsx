import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LaporanPenerimaanBarangDetailCard from '../../components/laporanPenerimaanBarang/LaporanPenerimaanBarangDetailCard';

describe('LaporanPenerimaanBarangDetailCard', () => {
  const mockReport = {
    id: 'lpb-1',
    no_lpb: 'LPB/2026/001',
    purchaseOrderId: 'po-1',
    purchaseOrder: {
      id: 'po-1',
      po_number: 'PO/2026/001',
      purchaseOrderDetails: [
        {
          plu: 'PLU001',
          nama_barang: 'Barang Alpha',
          total_quantity_order: 10,
          harga: 50000,
          potongan_a: 5,
          potongan_b: 2.5,
          vatRate: 11,
          item: { uom: 'PCS' },
        },
        {
          plu: 'PLU002',
          nama_barang: 'Barang Beta',
          total_quantity_order: 20,
          harga: 12500,
          potongan_a: null,
          potongan_b: null,
          vatRate: null,
          item: { uom: 'CTN' },
        },
      ],
    },
    detailItems: [
      {
        plu: 'PLU001',
        nama_barang: 'Barang Alpha',
        total_quantity_order: 8,
        harga: 50000,
        potongan_a: 5,
        potongan_b: 2.5,
      },
      {
        plu: 'PLU002',
        nama_barang: 'Barang Beta',
        total_quantity_order: 20,
        harga: 12500,
      },
      {
        plu: 'PLU003',
        nama_barang: 'Barang Gamma (LPB Only)',
        total_quantity_order: 5,
        harga: 75000,
        potongan_a: 10,
        potongan_b: null,
        vatRate: 12,
      },
    ],
    status: {
      status_name: 'DITERIMA',
    },
  };

  it('renders table headers including Harga, Pot A, Pot B, and PPN', () => {
    render(<LaporanPenerimaanBarangDetailCard report={mockReport} onClose={vi.fn()} />);

    expect(screen.getByText('Detail Item')).toBeDefined();
    expect(screen.getByText('Nama Item')).toBeDefined();
    expect(screen.getByText('PLU')).toBeDefined();
    expect(screen.getByText('Harga')).toBeDefined();
    expect(screen.getByText('Pot A')).toBeDefined();
    expect(screen.getByText('Pot B')).toBeDefined();
    expect(screen.getByText('PPN')).toBeDefined();
    expect(screen.getByText('Qty PO')).toBeDefined();
    expect(screen.getByText('Qty LPB')).toBeDefined();
    expect(screen.getByText('Qty Selisih')).toBeDefined();
  });

  it('renders formatted price, discount, and VAT values for items', () => {
    render(<LaporanPenerimaanBarangDetailCard report={mockReport} onClose={vi.fn()} />);

    // Item 1: Alpha
    expect(screen.getByText('Barang Alpha')).toBeDefined();
    expect(screen.getByText('50.000')).toBeDefined();
    expect(screen.getByText('5%')).toBeDefined();
    expect(screen.getByText('2.5%')).toBeDefined();
    expect(screen.getByText('11%')).toBeDefined();
    expect(screen.getByText('10 PCS')).toBeDefined();
    expect(screen.getByText('8 PCS')).toBeDefined();
    expect(screen.getByText('-2 PCS')).toBeDefined();

    // Item 2: Beta (null discounts / VAT)
    expect(screen.getByText('Barang Beta')).toBeDefined();
    expect(screen.getByText('12.500')).toBeDefined();
    expect(screen.getAllByText('20 CTN').length).toBe(2);

    // Item 3: Gamma (LPB only)
    expect(screen.getByText('Barang Gamma (LPB Only)')).toBeDefined();
    expect(screen.getByText('75.000')).toBeDefined();
    expect(screen.getByText('10%')).toBeDefined();
    expect(screen.getByText('12%')).toBeDefined();
  });

  it('handles null/empty report gracefully', () => {
    const { container } = render(<LaporanPenerimaanBarangDetailCard report={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
