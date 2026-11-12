// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckingListDetailCard from '../../components/checkingList/CheckingListDetailCard';
import checkingListService from '../../services/checkingListService';

describe('CheckingListDetailCard', () => {
  it('renders tabs and details correctly', () => {
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
        onClose={() => { }}
      />
    );

    // Check title
    expect(screen.getByText('Detail Checklist Surat Jalan')).toBeDefined();

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

    // Check Tambah Faktur / Surat Jalan button exists
    expect(screen.getByRole('button', { name: /Tambah Faktur \/ Surat Jalan/i })).toBeDefined();
  });

  const buildChecklist = (statusCode = 'PENDING CHECKLIST SURAT JALAN') => ({
    id: 'chk-1',
    status: { status_code: statusCode },
    suratJalan: [
      { id: 'sj-1', no_surat_jalan: 'SJ-PARUNG', purchaseOrder: { po_number: 'PO-1' } },
      { id: 'sj-2', no_surat_jalan: 'SJ-KARAWANG', purchaseOrder: { po_number: 'PO-2' } },
    ],
    auditTrails: [],
  });

  it('removes a surat jalan from the checklist after confirmation', async () => {
    const assignSpy = vi
      .spyOn(checkingListService, 'assignSuratJalan')
      .mockResolvedValue({ data: { id: 'chk-1' } });
    const onUpdate = vi.fn();

    render(<CheckingListDetailCard checklist={buildChecklist()} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: /Hapus SJ-KARAWANG dari checklist/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Hapus$/ }));

    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith('chk-1', ['sj-1']));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    assignSpy.mockRestore();
  });

  it('disables removal when only one surat jalan is left', () => {
    const checklist = buildChecklist();
    checklist.suratJalan = [checklist.suratJalan[0]];
    render(<CheckingListDetailCard checklist={checklist} onUpdate={() => {}} />);

    const btn = screen.getByRole('button', { name: /Hapus SJ-PARUNG dari checklist/i });
    expect(btn.disabled).toBe(true);
  });

  it('disables removal for completed checklists', () => {
    render(
      <CheckingListDetailCard
        checklist={buildChecklist('COMPLETED CHECKLIST SURAT JALAN')}
        onUpdate={() => {}}
      />
    );
    const btn = screen.getByRole('button', { name: /Hapus SJ-PARUNG dari checklist/i });
    expect(btn.disabled).toBe(true);
  });
});
