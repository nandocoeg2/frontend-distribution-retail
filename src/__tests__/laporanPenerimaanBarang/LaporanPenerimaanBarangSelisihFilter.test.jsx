import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeRow = (id, lpb, inv) => ({
  id,
  no_lpb: `LPB-${id}`,
  detailInvoice: { grand_total: lpb },
  purchaseOrder: { id: `po-${id}`, po_number: `PO-${id}`, invoice: { no_invoice: `INV-${id}`, grand_total: inv } },
  customer: { id: 'c1', namaCustomer: 'Cust A' },
  status: { status_code: 'NORMAL', status_name: 'Normal' },
});

const rows = [
  makeRow('1', 1000, 1000), // 0
  makeRow('2', 5000, 4000), // 1000
  makeRow('3', 3000, 2000), // 1000
  makeRow('4', 2000, 2500), // -500
];

vi.mock('../../hooks/useLaporanPenerimaanBarangQuery', () => ({
  useLaporanPenerimaanBarangQuery: () => ({
    data: { reports: rows, pagination: { page: 1, limit: 9999, total: rows.length, totalPages: 1 } },
    isLoading: false,
    isFetching: false,
    error: null,
  }),
}));
vi.mock('../../hooks/useLaporanPenerimaanBarangOperations', () => ({
  default: () => ({
    isAssigning: false,
    isUnassigning: false,
    assignPurchaseOrder: vi.fn(),
    unassignPurchaseOrder: vi.fn(),
  }),
}));
vi.mock('../../services/laporanPenerimaanBarangService', () => ({ default: {} }));
vi.mock('../../services/toastService', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/statusService', () => ({
  default: { getLaporanPenerimaanBarangStatuses: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../../services/customerService', () => ({
  default: { getAllCustomers: vi.fn().mockResolvedValue({ data: [] }) },
}));
vi.mock('../../services/authService', () => ({
  default: { getCompanyData: () => ({ id: 'comp1' }) },
}));
vi.mock('./AssignPurchaseOrderModal', () => ({ default: () => null }));

import LaporanPenerimaanBarangTableServerSide from '../../components/laporanPenerimaanBarang/LaporanPenerimaanBarangTableServerSide';

describe('LPB table - filter Selisih (checklist)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('menampilkan nilai selisih unik dan menyaring baris saat dipilih', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    render(<LaporanPenerimaanBarangTableServerSide />);

    // semua baris tampil
    for (const r of rows) expect(screen.getByText(r.no_lpb)).toBeTruthy();

    // buka dropdown Selisih: input ke-? di header kolom Selisih
    const header = screen.getByText('Selisih', { selector: 'div.font-medium.text-xs' }).parentElement;
    const input = within(header).getByRole('textbox');
    fireEvent.focus(input);

    // nilai unik: -500, 0, 1000 (1000 hanya sekali)
    const items = Array.from(document.body.querySelectorAll('ul > li'));
    expect(items).toHaveLength(4); // (Select All) + 3 nilai
    expect(items[0].textContent).toContain('Select All');
    const optionEl = items.find((li) => /1[.,]000/.test(li.textContent));
    expect(optionEl).toBeTruthy();
    fireEvent.click(optionEl);

    // tutup dropdown (fetchOnClose) -> klik di luar
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('LPB-1')).toBeNull();
      expect(screen.queryByText('LPB-4')).toBeNull();
      expect(screen.getByText('LPB-2')).toBeTruthy();
      expect(screen.getByText('LPB-3')).toBeTruthy();
    });

    const reactErrors = errorSpy.mock.calls.filter((c) => /Warning|Error|Uncaught/i.test(String(c[0])));
    expect(reactErrors).toEqual([]);
  });

  it('(Select All) memilih semua nilai lalu semua baris tetap tampil', async () => {
    render(<LaporanPenerimaanBarangTableServerSide />);
    const header = screen.getByText('Selisih', { selector: 'div.font-medium.text-xs' }).parentElement;
    fireEvent.focus(within(header).getByRole('textbox'));

    fireEvent.click(Array.from(document.body.querySelectorAll('ul > li'))[0]); // Select All
    fireEvent.mouseDown(document.body);

    // 3 nilai terpilih -> 1 tag + "+2"
    const selisihHeader = () =>
      screen.getByText('Selisih', { selector: 'div.font-medium.text-xs' }).parentElement;
    await waitFor(() => expect(selisihHeader().textContent).toContain('+2'));
    for (const r of rows) expect(screen.getByText(r.no_lpb)).toBeTruthy();

    // buka lagi, klik (Select All) untuk mengosongkan
    await waitFor(() => {
      fireEvent.focus(within(selisihHeader()).getByRole('textbox'));
      expect(document.body.querySelectorAll('ul > li').length).toBe(4);
    });
    fireEvent.click(document.body.querySelectorAll('ul > li')[0]);
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(selisihHeader().textContent).not.toContain('+2'));
    for (const r of rows) expect(screen.getByText(r.no_lpb)).toBeTruthy();
  });

  it.each([
    ['Grandtotal LPB', ['1.000', '5.000', '3.000', '2.000'], '5.000', ['LPB-2']],
    ['Grandtotal Inv', ['1.000', '4.000', '2.000', '2.500'], '2.000', ['LPB-3']],
  ])('filter checklist %s menyaring baris', async (title, optionTexts, pick, expectedRows) => {
    render(<LaporanPenerimaanBarangTableServerSide />);
    const headerOf = () => screen.getByText(title, { selector: 'div.font-medium.text-xs' }).parentElement;
    fireEvent.focus(within(headerOf()).getByRole('textbox'));

    const items = Array.from(document.body.querySelectorAll('ul > li'));
    expect(items).toHaveLength(5); // (Select All) + 4 nilai unik
    expect(items[0].textContent).toContain('Select All');
    const target = items.find((li) => li.textContent.replace(/\s/g, '').includes(pick.replace('.', '')) || li.textContent.includes(pick));
    expect(target).toBeTruthy();
    fireEvent.click(target);
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      for (const r of rows) {
        if (expectedRows.includes(r.no_lpb)) expect(screen.getByText(r.no_lpb)).toBeTruthy();
        else expect(screen.queryByText(r.no_lpb)).toBeNull();
      }
    });
  });

  it('filter lama berbentuk {min,max} dari storage tidak membuat error', () => {
    sessionStorage.setItem(
      'laporan-penerimaan-barang',
      JSON.stringify({ columnFilters: [{ id: 'selisih', value: { min: '1', max: '5' } }] })
    );
    expect(() => render(<LaporanPenerimaanBarangTableServerSide />)).not.toThrow();
    expect(screen.getByText('LPB-1')).toBeTruthy();
  });
});
