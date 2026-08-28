import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TandaTerimaFakturExportPreviewModal from '../../components/tandaTerimaFaktur/TandaTerimaFakturExportPreviewModal';

describe('TandaTerimaFakturExportPreviewModal', () => {
  const sampleData = {
    headers: [
      'TANGGAL TAGIHAN',
      'CUSTOMER',
      'NO INVOICE',
      'TOP',
      'TOTAL TTF',
      'TANGGAL KIRIM POS',
      'TANGGAL PROSES DC',
      'JATUH TEMPO',
      'TANGGAL BAYAR',
      'PAYMENT',
      'SELISIH',
      'KETERANGAN',
      'STATUS',
    ],
    data: [
      {
        tanggal: '28/08/2026',
        customer: 'PT Maju Jaya',
        invoice_no: 'INV-2026-001',
        top: 'TOP30',
        grand_total: 10000000,
        tanggal_print_ttf1: '29/08/2026',
        tanggal_upload_ttf2: '30/08/2026',
        tanggal_jatuh_tempo: '28/09/2026',
        tanggal_bayar: '25/09/2026',
        payment: 10000000,
        selisih: 0,
        keterangan: 'Payment full',
        status: 'PAID',
      },
    ],
    totalItems: 1,
  };

  it('renders modal with title and table columns when open', () => {
    render(
      <TandaTerimaFakturExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('Preview Hasil Export Excel Tanda Terima Faktur')).toBeDefined();
    expect(screen.getByText('PT Maju Jaya')).toBeDefined();
    expect(screen.getByText('INV-2026-001')).toBeDefined();
    expect(screen.getByText('TOP30')).toBeDefined();
    expect(screen.getByText('Payment full')).toBeDefined();
    expect(screen.getByText('Download Excel')).toBeDefined();
  });

  it('calls onExport when Download Excel button is clicked', () => {
    const handleExport = vi.fn();
    render(
      <TandaTerimaFakturExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={sampleData}
        previewLoading={false}
        onExport={handleExport}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download Excel/i });
    fireEvent.click(downloadBtn);
    expect(handleExport).toHaveBeenCalled();
  });

  it('shows loading state when previewLoading is true', () => {
    render(
      <TandaTerimaFakturExportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        previewData={null}
        previewLoading={true}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('Menyiapkan preview data...')).toBeDefined();
  });
});
