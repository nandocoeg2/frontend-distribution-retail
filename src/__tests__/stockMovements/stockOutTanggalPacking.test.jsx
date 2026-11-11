import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T03:00:00.000Z`;
};
const OLD = '2026-01-05T03:00:00.000Z';

let movements = [];
vi.mock('../../hooks/useStockMovementsQuery', () => ({
  useStockOutMovementsQuery: () => ({
    data: { movements, pagination: { page: 1, limit: 9999, total: movements.length, totalPages: 1 } },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import StockOutTable from '../../components/stockMovements/StockOutTable';

const mk = (id, customer, { packing, sj, created }) => ({
  id,
  type: 'STOCK_OUT',
  movementNumber: `MV-${id}`,
  createdAt: created,
  customer: { namaCustomer: customer },
  suratJalan: {
    id: `sj-${id}`,
    no_surat_jalan: `SJ-${id}`,
    tanggal_surat_jalan: sj,
    invoice: { no_invoice: `INV-${id}` },
    purchaseOrder: {
      id: `po-${id}`,
      po_number: `PO-${id}`,
      packing: packing ? { tanggal_packing: packing } : null,
      purchaseOrderDetails: [],
      invoicePenagihan: [],
      invoice: { no_invoice: `INV-${id}` },
    },
  },
  items: [{ itemId: 'i1', quantity: 10, item: { id: 'i1', plu: '4225502', nama_barang: 'BAG' } }],
});

describe('Stock Out - Tgl Surat Jalan mengikuti tanggal faktur (packing)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('memakai tanggal packing, bukan tanggal Surat Jalan/pembuatan checklist', () => {
    // packing = hari ini (tanggal faktur), sedangkan tanggal SJ & createdAt = lama.
    // Filter default tabel = hari ini, jadi baris hanya tampil jika tanggal yang dipakai = packing.
    movements = [mk('A', 'DC PAKAI PACKING', { packing: todayIso(), sj: OLD, created: OLD })];
    render(<StockOutTable />);
    expect(screen.getByText('DC PAKAI PACKING')).toBeTruthy();
  });

  it('tanggal checklist (SJ/createdAt hari ini) tidak dipakai bila packing berbeda', () => {
    // packing = lama, SJ/createdAt = hari ini (saat checklist dibuat) -> tidak boleh tampil di filter hari ini
    movements = [mk('B', 'DC TANGGAL CHECKLIST', { packing: OLD, sj: todayIso(), created: todayIso() })];
    render(<StockOutTable />);
    expect(screen.queryByText('DC TANGGAL CHECKLIST')).toBeNull();
  });

  it('judul kolom tetap "Tgl Surat Jalan" (nama kolom tidak diubah)', () => {
    movements = [mk('D', 'DC JUDUL', { packing: todayIso(), sj: OLD, created: OLD })];
    render(<StockOutTable />);
    expect(screen.getByText('Tgl Surat Jalan', { selector: 'div.font-medium.text-xs' })).toBeTruthy();
  });

  it('tanpa packing: fallback ke tanggal Surat Jalan', () => {
    movements = [mk('C', 'DC TANPA PACKING', { packing: null, sj: todayIso(), created: OLD })];
    render(<StockOutTable />);
    expect(screen.getByText('DC TANPA PACKING')).toBeTruthy();
  });
});
