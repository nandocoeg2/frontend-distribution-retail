import { describe, it, expect, vi, beforeEach } from 'vitest';
import tandaTerimaFakturService from '../../services/tandaTerimaFakturService';

describe('TandaTerimaFakturService.previewExportExcel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles response where response.data is an object containing nested data array', async () => {
    vi.spyOn(tandaTerimaFakturService, 'getAll').mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 'ttf-1',
            tanggal: '2026-08-28',
            grand_total: 5000000,
            invoicePenagihan: {
              no_invoice_penagihan: 'INV-001',
              purchaseOrder: {
                customer: {
                  namaCustomer: 'PT Sumber Makmur',
                  kodeCustomer: 'CUST01',
                },
              },
            },
            termOfPayment: {
              kode_top: 'TOP30',
            },
            bankMutation: {
              jumlah: 5000000,
              tanggal_transaksi: '2026-09-01',
            },
            status: {
              status_name: 'PAID',
            },
          },
        ],
        pagination: {
          totalItems: 1,
        },
      },
    });

    const result = await tandaTerimaFakturService.previewExportExcel({});
    expect(result.headers).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].customer).toBe('PT Sumber Makmur (CUST01)');
    expect(result.data[0].invoice_no).toBe('INV-001');
    expect(result.data[0].grand_total).toBe(5000000);
    expect(result.data[0].payment).toBe(5000000);
    expect(result.data[0].selisih).toBe(0);
    expect(result.data[0].status).toBe('PAID');
  });

  it('handles response where response.data is directly the array', async () => {
    vi.spyOn(tandaTerimaFakturService, 'getAll').mockResolvedValue({
      data: [
        {
          id: 'ttf-2',
          grand_total: 2500000,
          customer: { namaCustomer: 'Toko Berkah' },
          status: { status_name: 'UNPAID' },
        },
      ],
      pagination: { totalItems: 1 },
    });

    const result = await tandaTerimaFakturService.previewExportExcel({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].customer).toBe('Toko Berkah');
    expect(result.data[0].grand_total).toBe(2500000);
    expect(result.data[0].selisih).toBe(2500000);
  });

  it('handles empty response gracefully without throwing', async () => {
    vi.spyOn(tandaTerimaFakturService, 'getAll').mockResolvedValue(null);

    const result = await tandaTerimaFakturService.previewExportExcel({});
    expect(result.data).toHaveLength(0);
    expect(result.totalItems).toBe(0);
  });
});
