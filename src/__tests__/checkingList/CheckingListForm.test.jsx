// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckingListForm from '../../components/checkingList/CheckingListForm';

// Mock statusService and suratJalanService
vi.mock('../../services/statusService', () => ({
  default: {
    getSuratJalanStatuses: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('../../services/suratJalanService', () => ({
  default: {
    getSuratJalan: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

describe('CheckingListForm', () => {
  const mockInitialValues = {
    id: 'chk-1',
    no_checklist_surat_jalan: 'CHK/001',
    tanggal: '2026-08-25T10:00:00.000Z',
    checker: 'Budi',
    ekspedisi: 'JNE Trucking',
    mobil: 'B 1234 ABC',
    kota: 'Jakarta',
    companyId: 'comp-1',
    status: { id: 'status-1', status_code: 'DRAFT SURAT JALAN' },
    suratJalan: [
      {
        id: 'sj-1',
        no_surat_jalan: 'SJ/2026/001',
        purchaseOrder: { po_number: 'PO/2026/101', customer: { namaCustomer: 'PT Maju' } },
      },
    ],
  };

  it('renders form inputs and assigned surat jalan list', () => {
    render(
      <CheckingListForm
        initialValues={mockInitialValues}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Budi')).toBeDefined();
    expect(screen.getByDisplayValue('JNE Trucking')).toBeDefined();
    expect(screen.getByDisplayValue('B 1234 ABC')).toBeDefined();
    expect(screen.getByDisplayValue('Jakarta')).toBeDefined();
    expect(screen.getByText('SJ/2026/001')).toBeDefined();
    expect(screen.getByText('PO/2026/101')).toBeDefined();
    expect(screen.getByText('PT Maju')).toBeDefined();
  });

  it('prevents removing the last surat jalan and displays validation error', () => {
    render(
      <CheckingListForm
        initialValues={mockInitialValues}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const removeButtons = screen.getAllByTitle(/Minimal 1 Surat Jalan/i);
    expect(removeButtons.length).toBe(1);

    fireEvent.click(removeButtons[0]);

    expect(
      screen.getByText('Checklist harus memiliki minimal 1 Surat Jalan.')
    ).toBeDefined();
  });

  it('submits updated values along with suratJalanIds', () => {
    const handleSubmit = vi.fn();
    render(
      <CheckingListForm
        initialValues={mockInitialValues}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
      />
    );

    const checkerInput = screen.getByDisplayValue('Budi');
    fireEvent.change(checkerInput, { target: { name: 'checker', value: 'Budi Updated' } });

    const form = checkerInput.closest('form');
    fireEvent.submit(form);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        checker: 'Budi Updated',
        ekspedisi: 'JNE Trucking',
        mobil: 'B 1234 ABC',
        kota: 'Jakarta',
        suratJalanIds: ['sj-1'],
      })
    );
  });
});
