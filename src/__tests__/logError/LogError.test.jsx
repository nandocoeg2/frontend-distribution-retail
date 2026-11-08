import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../services/logService', () => ({
  default: { getLogs: vi.fn() },
}));
vi.mock('../../services/toastService', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import LogError from '../../pages/LogError.jsx';
import logService from '../../services/logService';

const sampleResult = {
  data: [
    {
      timestamp: '2026-11-08T09:18:38.146Z',
      level: 'error',
      message: 'Application Error: Failed to save LPB data to database',
      meta: { method: 'POST', url: '/api/v1/laporan-penerimaan-barang/bulk-upload', statusCode: 500 },
    },
  ],
  pagination: { currentPage: 1, itemsPerPage: 50, hasNextPage: false },
  file: 'error',
  fileSizeBytes: 2048,
  scanLimited: false,
};

describe('LogError page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads error.log on mount and shows entries', async () => {
    logService.getLogs.mockResolvedValue(sampleResult);
    render(<LogError />);

    expect(await screen.findByText(/Failed to save LPB data/)).toBeTruthy();
    expect(screen.getByText(/POST \/api\/v1\/laporan-penerimaan-barang\/bulk-upload/)).toBeTruthy();
    expect(logService.getLogs).toHaveBeenCalledWith(expect.objectContaining({ file: 'error', page: 1, limit: 50 }));
  });

  it('sends the keyword filter when searching', async () => {
    logService.getLogs.mockResolvedValue(sampleResult);
    render(<LogError />);
    await screen.findByText(/Failed to save LPB data/);

    fireEvent.change(screen.getByPlaceholderText(/Cari/), { target: { name: 'q', value: 'J25-008754' } });
    fireEvent.click(screen.getByText('Cari'));

    await waitFor(() =>
      expect(logService.getLogs).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'J25-008754', page: 1 }))
    );
  });

  it('shows a friendly message on 403', async () => {
    logService.getLogs.mockRejectedValue({ response: { status: 403 }, message: 'Request failed' });
    render(<LogError />);

    expect(await screen.findByText(/tidak memiliki akses ke log aplikasi/)).toBeTruthy();
  });
});
