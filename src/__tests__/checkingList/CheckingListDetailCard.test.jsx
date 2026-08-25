// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckingListDetailCard from '../../components/checkingList/CheckingListDetailCard';

describe('CheckingListDetailCard', () => {
  it('renders 2 tabs: PO and Activity Timeline', () => {
    const mockChecklist = {
      id: 'chk-1',
      no_checklist_surat_jalan: 'CHK/2026/001',
      suratJalan: [
        {
          id: 'sj-1',
          no_surat_jalan: 'SJ/2026/001',
          purchaseOrder: {
            id: 'po-1',
            po_number: 'PO/2026/101',
            customer: {
              namaCustomer: 'PT Maju Bersama',
            },
          },
        },
      ],
      auditTrails: [],
    };

    render(
      <CheckingListDetailCard
        checklist={mockChecklist}
        onClose={() => {}}
      />
    );

    // Check title and checklist number
    expect(screen.getByText('Detail Checklist Surat Jalan')).toBeDefined();
    expect(screen.getByText(/CHK\/2026\/001/)).toBeDefined();

    // Check tabs
    expect(screen.getByRole('button', { name: /Surat Jalan & No PO/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Informasi/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Timeline/i })).toBeDefined();

    // In PO tab (active by default), verify table contents
    expect(screen.getByText('No Surat Jalan')).toBeDefined();
    expect(screen.getByText('No PO')).toBeDefined();
    expect(screen.getByText('Customer / Tujuan')).toBeDefined();
    expect(screen.getByText('SJ/2026/001')).toBeDefined();
    expect(screen.getByText('PO/2026/101')).toBeDefined();
    expect(screen.getByText('PT Maju Bersama')).toBeDefined();
  });
});
