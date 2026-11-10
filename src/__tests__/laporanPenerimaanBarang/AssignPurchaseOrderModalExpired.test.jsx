import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import purchaseOrderService from '../../services/purchaseOrderService';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/purchaseOrderService', () => ({
  default: {
    getPurchaseOrders: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 'po1',
            po_number: '10698',
            customer: { namaCustomer: 'DC Cikokol' },
            // sama seperti kolom Tgl Expired di Packing (delivery_date)
            delivery_date: '2026-11-13T00:00:00.000Z',
            // tanggal batas kirim berbeda: tidak boleh ditampilkan sebagai expired
            tanggal_batas_kirim: '2026-12-24T00:00:00.000Z',
            grand_total: 1000,
          },
        ],
      },
    }),
  },
}));

import AssignPurchaseOrderModal, {
  getPoExpiredDate,
} from '../../components/laporanPenerimaanBarang/AssignPurchaseOrderModal';

describe('AssignPurchaseOrderModal - tanggal expired', () => {
  it('getPoExpiredDate memprioritaskan delivery_date (sama dengan Packing)', () => {
    expect(getPoExpiredDate({ delivery_date: 'A', tanggal_batas_kirim: 'B' })).toBe('A');
    expect(getPoExpiredDate({ tanggal_batas_kirim: 'B' })).toBe('B');
    expect(getPoExpiredDate({})).toBeNull();
  });

  it('pencarian memakai parameter search (No. PO atau Nama DC)', async () => {
    render(<AssignPurchaseOrderModal show onClose={() => {}} onAssign={() => {}} lpbData={{ companyId: 'c' }} />);
    await screen.findByText('10698');
    fireEvent.change(screen.getByPlaceholderText(/Nama DC/i), { target: { value: 'cikokol' } });
    await waitFor(() =>
      expect(purchaseOrderService.getPurchaseOrders).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'cikokol' })
      )
    );
    const calls = purchaseOrderService.getPurchaseOrders.mock.calls.map((c) => c[0]);
    expect(calls.some((p) => 'po_number' in p)).toBe(false);
  });

  it('menampilkan delivery_date, bukan tanggal_batas_kirim', async () => {
    render(<AssignPurchaseOrderModal show onClose={() => {}} onAssign={() => {}} lpbData={{ companyId: 'c' }} />);
    const row = (await screen.findByText('10698')).closest('tr');
    await waitFor(() => expect(row.textContent).toMatch(/13/));
    expect(row.textContent).not.toMatch(/24/);
  });
});
