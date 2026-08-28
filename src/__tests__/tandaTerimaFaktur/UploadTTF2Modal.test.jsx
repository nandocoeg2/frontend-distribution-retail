import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadTTF2Modal from '../../components/tandaTerimaFaktur/UploadTTF2Modal';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';
import toastService from '@/services/toastService';

vi.mock('@/services/tandaTerimaFakturService', () => ({
  default: {
    bulkUpload: vi.fn(),
  },
}));

vi.mock('@/services/groupCustomerService', () => ({
  default: {
    search: vi.fn().mockResolvedValue({ data: { data: [] } }),
    getAllGroupCustomers: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

vi.mock('@/services/toastService', () => ({
  default: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UploadTTF2Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal header when isOpen is true', () => {
    render(<UploadTTF2Modal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText('Upload Tanda Terima Faktur (Bulk Upload)')).toBeDefined();
    expect(
      screen.getByText('Upload dokumen PDF Form Tanda Penyerahan Faktur dari customer')
    ).toBeDefined();
  });

  it('handles mixed success and failed files accurately in summary and toast', async () => {
    const file1 = new File(['dummy1'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['dummy2'], 'file2.pdf', { type: 'application/pdf' });
    const file3 = new File(['dummy3'], 'file3.pdf', { type: 'application/pdf' });
    const file4 = new File(['dummy4'], 'file4.pdf', { type: 'application/pdf' });

    // Mock API responses: 2 success, 2 failed
    tandaTerimaFakturService.bulkUpload
      .mockResolvedValueOnce({
        data: {
          validation: {
            updatedCount: 1,
            invalidFakturPajak: [],
            validFakturPajak: [
              { noFakturPajak: '04001', customerName: 'DC A', newStatus: 'COMPLETED' },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          validation: {
            updatedCount: 1,
            invalidFakturPajak: [],
            validFakturPajak: [
              { noFakturPajak: '04002', customerName: 'DC B', newStatus: 'COMPLETED' },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          validation: {
            updatedCount: 0,
            invalidFakturPajak: [
              { noFakturPajak: '04003', reason: 'Dokumen milik Group Customer yang berbeda', status: 'GROUP_MISMATCH' },
            ],
            validFakturPajak: [],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          validation: {
            updatedCount: 0,
            invalidFakturPajak: [
              { noFakturPajak: '04004', reason: 'Dokumen milik Group Customer yang berbeda', status: 'GROUP_MISMATCH' },
            ],
            validFakturPajak: [],
          },
        },
      });

    const { container } = render(
      <UploadTTF2Modal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    const fileInput = container.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2, file3, file4],
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Hasil Upload')).toBeDefined();
    });

    // Check summary display
    expect(screen.getByText('Total File: 4')).toBeDefined();
    expect(screen.getByText('Berhasil: 2')).toBeDefined();
    expect(screen.getByText('Gagal: 2')).toBeDefined();
    expect(screen.getByText('Total Faktur Diupdate: 2')).toBeDefined();
    expect(screen.getByText('Total Faktur Gagal: 2')).toBeDefined();

    // Check warning toast called with exact counts
    expect(toastService.warning).toHaveBeenCalledWith(
      expect.stringContaining('2/4 file berhasil (2 file gagal). Total 2 faktur diupdate, 2 faktur gagal.')
    );
    expect(toastService.success).not.toHaveBeenCalled();
  });

  it('handles 100% successful files and shows success toast', async () => {
    const file1 = new File(['dummy1'], 'file1.pdf', { type: 'application/pdf' });

    tandaTerimaFakturService.bulkUpload.mockResolvedValueOnce({
      data: {
        validation: {
          updatedCount: 1,
          invalidFakturPajak: [],
          validFakturPajak: [
            { noFakturPajak: '04001', customerName: 'DC A', newStatus: 'COMPLETED' },
          ],
        },
      },
    });

    const { container } = render(
      <UploadTTF2Modal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    const fileInput = container.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file1],
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Hasil Upload')).toBeDefined();
    });

    expect(screen.getByText('Total File: 1')).toBeDefined();
    expect(screen.getByText('Berhasil: 1')).toBeDefined();
    expect(screen.getByText('Gagal: 0')).toBeDefined();

    expect(toastService.success).toHaveBeenCalledWith(
      expect.stringContaining('Semua file berhasil diupload! Total 1 faktur pajak diupdate.')
    );
  });
});
