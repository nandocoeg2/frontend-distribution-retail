// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckingListPOTable from '../../components/checkingList/CheckingListPOTable';

describe('CheckingListPOTable', () => {
  it('renders empty message when no surat jalan data is provided', () => {
    render(<CheckingListPOTable suratJalan={[]} />);
    expect(screen.getByText('Tidak ada data PO.')).toBeDefined();
  });

  it('renders table headers and rows correctly from suratJalan data structure', () => {
    const mockSuratJalan = [
      {
        id: 'sj-1',
        no_surat_jalan: 'SJ/2026/001',
        purchaseOrder: {
          id: 'po-1',
          po_number: 'PO/2026/101',
          customer: { namaCustomer: 'PT Maju Bersama' },
        },
      },
      {
        id: 'sj-2',
        no_surat_jalan: 'SJ/2026/002',
        purchaseOrder: {
          id: 'po-2',
          po_number: 'PO/2026/102',
          customer: { namaCustomer: 'CV Berkah Sentosa' },
        },
      },
    ];

    render(<CheckingListPOTable suratJalan={mockSuratJalan} />);

    // Check headers
    expect(screen.getByText('No Surat Jalan')).toBeDefined();
    expect(screen.getByText('No PO')).toBeDefined();
    expect(screen.getByText('Customer / Tujuan')).toBeDefined();

    // Check row values
    expect(screen.getByText('SJ/2026/001')).toBeDefined();
    expect(screen.getByText('PO/2026/101')).toBeDefined();
    expect(screen.getByText('PT Maju Bersama')).toBeDefined();
    expect(screen.getByText('SJ/2026/002')).toBeDefined();
    expect(screen.getByText('PO/2026/102')).toBeDefined();
    expect(screen.getByText('CV Berkah Sentosa')).toBeDefined();
  });

  it('handles fallback po_number formats and null values gracefully', () => {
    const mockSuratJalan = [
      {
        id: 'sj-3',
        no_surat_jalan: 'SJ/2026/003',
        po_number: 'PO-DIRECT-99',
      },
      {
        id: 'sj-4',
        no_surat_jalan: null,
        purchaseOrder: null,
      },
    ];

    render(<CheckingListPOTable suratJalan={mockSuratJalan} />);

    expect(screen.getByText('SJ/2026/003')).toBeDefined();
    expect(screen.getByText('PO-DIRECT-99')).toBeDefined();
    // Fallback '-' should be rendered for missing values
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1);
  });
});
