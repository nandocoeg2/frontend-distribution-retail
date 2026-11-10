import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UploadFailedFilesMessage } from '../../components/laporanPenerimaanBarang/LaporanPenerimaanBarangModal';

describe('UploadFailedFilesMessage', () => {
  it('menampilkan SEMUA file gagal beserta alasannya (tidak dibatasi 3)', () => {
    const failed = ['1281', '1282', '1318', '1334', '1444'].map((n) => ({
      filename: `${n}.pdf`,
      reason: `alasan ${n}`,
    }));
    render(<UploadFailedFilesMessage title="5 file gagal diproses (Text Extraction)" failedFiles={failed} />);

    expect(screen.getByText('5 file gagal diproses (Text Extraction)')).toBeTruthy();
    const items = within(screen.getByTestId('failed-files-list')).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[2].textContent).toContain('1318.pdf');
    expect(items[2].textContent).toContain('alasan 1318');
  });

  it('alasan panjang dipotong dan tanpa daftar bila tidak ada detail', () => {
    const long = 'x'.repeat(300);
    const { rerender } = render(
      <UploadFailedFilesMessage title="t" failedFiles={[{ filename: 'a.pdf', reason: long }]} />
    );
    expect(screen.getByTestId('failed-files-list').textContent.length).toBeLessThan(200);
    rerender(<UploadFailedFilesMessage title="t" failedFiles={[]} />);
    expect(screen.queryByTestId('failed-files-list')).toBeNull();
  });
});
