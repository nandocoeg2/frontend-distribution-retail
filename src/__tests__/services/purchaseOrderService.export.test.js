import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import purchaseOrderService from '../../services/purchaseOrderService';
import authService from '../../services/authService';

describe('purchaseOrderService export methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token-123');
    vi.spyOn(authService, 'getToken').mockReturnValue('mock-token-123');
    vi.spyOn(authService, 'getCompanyData').mockReturnValue({ id: 'comp-1' });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('exportPurchaseOrder', () => {
    it('should fetch single PO HTML document and return HTML string', async () => {
      const mockHtml = '<html><body><h1>Formulir Pesanan Pembelian</h1></body></html>';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockHtml),
      });

      const html = await purchaseOrderService.exportPurchaseOrder('po-123', 'comp-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/po-123/export?companyId=comp-1'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Accept: 'text/html',
            Authorization: 'Bearer mock-token-123',
          }),
        })
      );
      expect(html).toBe(mockHtml);
    });

    it('should throw error when server returns failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Purchase order tidak ditemukan' }),
      });

      await expect(
        purchaseOrderService.exportPurchaseOrder('po-not-found', 'comp-1')
      ).rejects.toThrow('Purchase order tidak ditemukan');
    });
  });

  describe('exportPurchaseOrderBulk', () => {
    it('should post bulk IDs and return HTML string', async () => {
      const mockHtml = '<html><body><h1>Bulk POs</h1></body></html>';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(mockHtml),
      });

      const html = await purchaseOrderService.exportPurchaseOrderBulk(['po-1', 'po-2'], 'comp-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/export/bulk'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'text/html',
            Authorization: 'Bearer mock-token-123',
          }),
          body: JSON.stringify({ ids: ['po-1', 'po-2'], companyId: 'comp-1' }),
        })
      );
      expect(html).toBe(mockHtml);
    });
  });
});
