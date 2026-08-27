import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LaporanPenerimaanBarangExportPreviewModal from '../../components/laporanPenerimaanBarang/LaporanPenerimaanBarangExportPreviewModal';

describe('LaporanPenerimaanBarangExportPreviewModal', () => {
  const mockPreviewData = {
    headers: [
      'NO LPB',
      'PO',
      'CUSTOMER',
      'TANGGAL',
      'TOP',
      'STATUS',
      'PLU',
      'NAMA BARANG',
      'TOTAL QTY DI KIRIM (PCS)',
      'TOTAL QTY DITERIMA (PCS)',
      'SELISIH (PCS)',
      'TOTAL HARGA DIKIRIM (RP)',
      'TOTAL HARGA DITERIMA (RP)',
      'SELISIH (RP)',
    ],
    data: [
      {
        no_lpb: 'LPB-001',
        po: 'PO-001',
        customer: 'PT Makmur Jaya',
        tanggal: '2026-08-20',
        top: 'TOP 30',
        status: 'DITERIMA',
        plu: 'PLU01',
        nama_barang: 'Produk Alpha',
        qty_dikirim: 10,
        qty_diterima: 8,
        selisih_qty: 2,
        total_harga_dikirim: 100000,
        total_harga_diterima: 80000,
        selisih_harga: 20000,
      },
    ],
  };

  it('renders modal with table and data when open', () => {
    render(
      <LaporanPenerimaanBarangExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={mockPreviewData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText(/Preview Export Excel - Laporan Penerimaan Barang/i)).toBeDefined();
    expect(screen.getByText('LPB-001')).toBeDefined();
    expect(screen.getByText('PO-001')).toBeDefined();
    expect(screen.getByText('PT Makmur Jaya')).toBeDefined();
    expect(screen.getByText('Produk Alpha')).toBeDefined();
  });

  it('calls onExport when Export Excel button is clicked in modal', () => {
    const handleExport = vi.fn();
    render(
      <LaporanPenerimaanBarangExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={mockPreviewData}
        previewLoading={false}
        onExport={handleExport}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Export Excel/i });
    fireEvent.click(exportBtn);

    expect(handleExport).toHaveBeenCalled();
  });
});
