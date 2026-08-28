import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TandaTerimaFakturTableServerSide from '../../components/tandaTerimaFaktur/TandaTerimaFakturTableServerSide';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

vi.mock('../../services/authService', () => ({
  default: {
    getCompanyData: () => ({ id: 'comp-1' }),
    getToken: () => 'token',
  },
}));

vi.mock('../../hooks/useTandaTerimaFakturQuery', () => ({
  useTandaTerimaFakturQuery: () => ({
    data: {
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
      },
    },
    isLoading: false,
    isFetching: false,
    error: null,
  }),
}));

describe('TandaTerimaFakturTableServerSide', () => {
  it('renders updated column header names: Tanggal Tagihan, Tanggal Kirim Pos, Tanggal Proses DC', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TandaTerimaFakturTableServerSide />
      </QueryClientProvider>
    );

    expect(screen.getByText('Tanggal Tagihan')).toBeDefined();
    expect(screen.getByText('Tanggal Kirim Pos')).toBeDefined();
    expect(screen.getByText('Tanggal Proses DC')).toBeDefined();
  });

  it('renders Invoice and Keterangan column headers with their filters', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TandaTerimaFakturTableServerSide />
      </QueryClientProvider>
    );

    expect(screen.getByText('Invoice')).toBeDefined();
    expect(screen.getByText('Keterangan')).toBeDefined();
  });
});
