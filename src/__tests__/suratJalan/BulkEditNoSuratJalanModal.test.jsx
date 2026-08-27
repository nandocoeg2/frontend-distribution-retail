import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkEditNoSuratJalanModal, {
  replaceMonthInSuratJalan,
} from '../../components/suratJalan/BulkEditNoSuratJalanModal';

describe('replaceMonthInSuratJalan', () => {
  it('correctly replaces roman month and year in 6-part surat jalan number', () => {
    const rawNo = 'BJM/0001/SJ/SAT/VIII/26';
    const updated = replaceMonthInSuratJalan(rawNo, 'IX', '26');
    expect(updated).toBe('BJM/0001/SJ/SAT/IX/26');
  });

  it('updates only month if year is not provided', () => {
    const rawNo = 'DVT/0005/SJ/IDM/I/25';
    const updated = replaceMonthInSuratJalan(rawNo, 'XII');
    expect(updated).toBe('DVT/0005/SJ/IDM/XII/25');
  });

  it('returns rawNo if format does not have 6 parts', () => {
    const rawNo = 'SJ-2026-001';
    const updated = replaceMonthInSuratJalan(rawNo, 'IX', '26');
    expect(updated).toBe('SJ-2026-001');
  });
});

describe('BulkEditNoSuratJalanModal', () => {
  const mockItems = [
    {
      id: 'sj-1',
      no_surat_jalan: 'BJM/0001/SJ/SAT/VIII/26',
      deliver_to: 'Toko Makmur',
      purchaseOrder: { po_number: 'PO-001' },
    },
    {
      id: 'sj-2',
      no_surat_jalan: 'BJM/0002/SJ/SAT/VIII/26',
      deliver_to: 'Toko Jaya',
      purchaseOrder: { po_number: 'PO-002' },
    },
  ];

  it('renders modal with items when open', () => {
    render(
      <BulkEditNoSuratJalanModal
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/Ganti Bulan \/ Edit Nomor Surat Jalan/i)).toBeDefined();
    expect(screen.getByText('Toko Makmur')).toBeDefined();
    expect(screen.getByText('Toko Jaya')).toBeDefined();
    expect(screen.getAllByDisplayValue('BJM/0001/SJ/SAT/VIII/26').length).toBeGreaterThan(0);
  });

  it('applies bulk month change to all items when "Terapkan ke Semua" is clicked', () => {
    const handleSubmit = vi.fn();
    render(
      <BulkEditNoSuratJalanModal
        isOpen={true}
        onClose={vi.fn()}
        items={mockItems}
        onSubmit={handleSubmit}
      />
    );

    // Select month IX
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'IX' } });

    // Click Apply
    const applyButton = screen.getByRole('button', { name: /Terapkan ke Semua/i });
    fireEvent.click(applyButton);

    // Check changed status
    expect(screen.getAllByText('Berubah').length).toBe(2);

    // Click Submit
    const submitButton = screen.getByRole('button', { name: /Simpan Perubahan/i });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith([
      { id: 'sj-1', no_surat_jalan: 'BJM/0001/SJ/SAT/IX/26' },
      { id: 'sj-2', no_surat_jalan: 'BJM/0002/SJ/SAT/IX/26' },
    ]);
  });
});
