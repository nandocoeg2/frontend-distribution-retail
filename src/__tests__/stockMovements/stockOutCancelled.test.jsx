import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T03:00:00.000Z`;
};

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

const mk = (id, customer, qty, extra = {}) => ({
  id,
  type: 'STOCK_OUT',
  status: 'COMPLETED',
  movementNumber: `MV-${id}`,
  createdAt: todayIso(),
  customer: { namaCustomer: customer },
  notes: `Stock out for Surat Jalan SJ-${id}`,
  suratJalan: {
    id: `sj-${id}`,
    tanggal_surat_jalan: todayIso(),
    invoice: { no_invoice: `INV-${id}` },
    purchaseOrder: { id: `po-${id}`, po_number: `PO-${id}`, purchaseOrderDetails: [], invoicePenagihan: [], invoice: { no_invoice: `INV-${id}` } },
  },
  items: [{ itemId: 'i1', quantity: qty, item: { id: 'i1', plu: '4225502', nama_barang: 'BAG' } }],
  ...extra,
});

describe('Stock Out - riwayat batal & kolom Keterangan', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('menampilkan kolom Keterangan; stock out aktif tidak punya keterangan', () => {
    movements = [mk('A', 'DC AKTIF', 10)];
    render(<StockOutTable />);
    expect(screen.getByText('Keterangan', { selector: 'div.font-medium.text-xs' })).toBeTruthy();
    expect(screen.getByText('DC AKTIF')).toBeTruthy();
  });

  it('stock out dibatalkan: tetap tampil sebagai riwayat dengan alasan, angkanya 0 dan tidak masuk total', () => {
    movements = [
      mk('A', 'DC AKTIF', 10),
      mk('B', 'DC BATAL', 7777, { status: 'REJECTED', notes: 'Dibatalkan: PO PO-B dibatalkan - salah kirim' }),
    ];
    const { container } = render(<StockOutTable />);

    // riwayat tampil + alasan
    expect(screen.getByText('DC BATAL')).toBeTruthy();
    expect(screen.getByText('Dibatalkan: PO PO-B dibatalkan - salah kirim')).toBeTruthy();

    // qty 7777 tidak ditampilkan di mana pun (jumlah riwayat batal dinolkan)
    expect(container.textContent).not.toContain('7.777');
    expect(container.textContent).not.toContain('7777');

    // baris batal diberi penanda warna
    const row = screen.getByText('DC BATAL').closest('tr');
    expect(row.className).toContain('bg-red-50');
    // baris aktif tidak
    expect(screen.getByText('DC AKTIF').closest('tr').className).not.toContain('bg-red-50');
  });

  it('total pengiriman di baris batal = 0', () => {
    movements = [mk('B', 'DC BATAL', 250, { status: 'REJECTED', notes: 'Dibatalkan: x' })];
    render(<StockOutTable />);
    const row = screen.getByText('DC BATAL').closest('tr');
    expect(within(row).queryByText('250')).toBeNull();
  });
});
