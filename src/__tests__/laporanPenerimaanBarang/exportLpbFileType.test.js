import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: () => ({ get: (...a) => getMock(...a), interceptors: { request: { use: vi.fn() } } }),
  },
}));
vi.mock('../../services/authService', () => ({ default: { getToken: () => 't', getCompanyData: () => null } }));

import service from '../../services/laporanPenerimaanBarangService';

const toBlob = (bytes, type = '') => new Blob([new Uint8Array(bytes)], { type });
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0];

describe('exportLPB - deteksi tipe file', () => {
  beforeEach(() => getMock.mockReset());

  it('gambar PNG yang dilabeli PDF/octet-stream dikenali sebagai image (bukan PDF)', async () => {
    getMock.mockResolvedValue({
      data: toBlob(PNG),
      headers: { 'content-type': 'application/octet-stream', 'content-disposition': 'inline; filename = "LPB-1.pdf"' },
    });
    const r = await service.exportLPB('1');
    expect(r.contentType).toBe('image/png');
    expect(r.filename).toBe('LPB-1.png');
  });

  it('PDF asli tetap PDF', async () => {
    getMock.mockResolvedValue({
      data: toBlob(PDF),
      headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline; filename = "LPB-2.pdf"' },
    });
    const r = await service.exportLPB('2');
    expect(r.contentType).toBe('application/pdf');
    expect(r.filename).toBe('LPB-2.pdf');
  });

  it('header content-disposition dengan spasi sekitar "=" tetap terbaca', async () => {
    getMock.mockResolvedValue({
      data: toBlob([1, 2, 3, 4], 'application/pdf'),
      headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline; filename = "scan lpb.pdf"' },
    });
    const r = await service.exportLPB('3');
    expect(r.filename).toBe('scan lpb.pdf');
  });
});
