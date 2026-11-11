import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryArgs = [];
vi.mock('../../hooks/useCheckingListQuery', () => ({
  useCheckingListQuery: (args) => {
    queryArgs.push(args);
    return {
      data: { checklists: [], pagination: { page: 1, limit: 9999, total: 0, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      error: null,
    };
  },
}));
vi.mock('../../services/checkingListService', () => ({ default: {} }));
vi.mock('../../services/authService', () => ({
  default: { getCompanyData: () => ({ id: 'comp1' }) },
}));
vi.mock('../../services/toastService', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import CheckingListTableServerSide, {
  normalizeDateRange,
} from '../../components/checkingList/CheckingListTableServerSide';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('Checking List - filter tanggal rentang (seperti Surat Jalan)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    queryArgs.length = 0;
  });

  it('normalizeDateRange: rentang, string lama, dan kosong', () => {
    expect(normalizeDateRange({ from: 'a', to: 'b' })).toEqual({ from: 'a', to: 'b' });
    expect(normalizeDateRange('2026-11-10')).toEqual({ from: '2026-11-10', to: '2026-11-10' });
    expect(normalizeDateRange(undefined)).toEqual({ from: '', to: '' });
  });

  it('menampilkan dua kolom tanggal (Dari & Sampai) berisi hari ini', () => {
    render(<CheckingListTableServerSide />);
    const header = screen.getByText('Tanggal', { selector: 'div.font-medium.text-xs' }).parentElement;
    const inputs = within(header).getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe(today());
    expect(inputs[1].value).toBe(today());
  });

  it('mengirim tanggal_from & tanggal_to ke backend (bukan "tanggal" tunggal)', () => {
    render(<CheckingListTableServerSide />);
    const last = queryArgs[queryArgs.length - 1];
    expect(last.filters.tanggal_from).toBe(today());
    expect(last.filters.tanggal_to).toBe(today());
    expect(last.filters.tanggal).toBeUndefined();
  });

  it('filter lama (satu tanggal) di storage tidak membuat error', () => {
    sessionStorage.setItem('checking-list', JSON.stringify({ columnFilters: [{ id: 'tanggal', value: '2026-11-01' }] }));
    expect(() => render(<CheckingListTableServerSide />)).not.toThrow();
  });
});
