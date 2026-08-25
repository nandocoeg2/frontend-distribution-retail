import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import termOfPaymentService from '../../services/termOfPaymentService';
import authService from '../../services/authService';

describe('termOfPaymentService', () => {
  const originalFetch = global.fetch;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    vi.spyOn(authService, 'getCompanyData').mockReturnValue({ id: 'comp-123' });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock-token');

    const storage = {
      token: 'mock-token',
    };
    global.localStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, val) => { storage[key] = val; },
      removeItem: (key) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.localStorage = originalLocalStorage;
  });

  describe('getTermOfPaymentById', () => {
    it('should include x-company-id header and companyId query parameter', async () => {
      const mockData = { id: 'top-1', kode_top: 'TOP01', batas_hari: 30, companyId: 'comp-123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await termOfPaymentService.getTermOfPaymentById('top-1');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toContain('/top-1?companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
      expect(options.headers['Authorization']).toBe('Bearer mock-token');
      expect(result.data).toEqual(mockData);
    });

    it('should allow explicit companyId override', async () => {
      const mockData = { id: 'top-2', kode_top: 'TOP02', batas_hari: 60, companyId: 'comp-override' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await termOfPaymentService.getTermOfPaymentById('top-2', 'comp-override');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];

      expect(url).toContain('/top-2?companyId=comp-override');
      expect(options.headers['x-company-id']).toBe('comp-override');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('getAllTermOfPayments', () => {
    it('should include x-company-id header and companyId query parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });

      await termOfPaymentService.getAllTermOfPayments(1, 10);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('page=1&limit=10&companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
    });
  });

  describe('searchTermOfPayments', () => {
    it('should include x-company-id header and companyId query parameter', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });

      await termOfPaymentService.searchTermOfPayments('TOP', 1, 10);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/search/TOP?page=1&limit=10&companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
    });
  });

  describe('createTermOfPayment', () => {
    it('should attach active companyId to body and x-company-id header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: { id: 'new-1' } }),
      });

      await termOfPaymentService.createTermOfPayment({ kode_top: 'TOP99', batas_hari: 15 });

      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers['x-company-id']).toBe('comp-123');
      const body = JSON.parse(options.body);
      expect(body.companyId).toBe('comp-123');
      expect(body.kode_top).toBe('TOP99');
    });
  });

  describe('updateTermOfPayment', () => {
    it('should include x-company-id header and companyId query param', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 'top-1' } }),
      });

      await termOfPaymentService.updateTermOfPayment('top-1', { batas_hari: 45 });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/top-1?companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
    });
  });

  describe('deleteTermOfPayment', () => {
    it('should include x-company-id header and companyId query param', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => null },
      });

      const result = await termOfPaymentService.deleteTermOfPayment('top-1');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('/top-1?companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
      expect(result.success).toBe(true);
    });
  });

  describe('exportExcel', () => {
    it('should include x-company-id and companyId query param', async () => {
      const mockBlob = new Blob(['mock content']);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'attachment; filename="TOP.xlsx"' },
        blob: async () => mockBlob,
      });
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      const result = await termOfPaymentService.exportExcel('search-val');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('q=search-val&companyId=comp-123');
      expect(options.headers['x-company-id']).toBe('comp-123');
      expect(result.success).toBe(true);
      expect(result.filename).toBe('TOP.xlsx');
    });
  });
});
