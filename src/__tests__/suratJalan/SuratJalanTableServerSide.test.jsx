// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SuratJalanTableServerSide from '../../components/suratJalan/SuratJalanTableServerSide';

vi.mock('../../services/authService', () => ({
  default: {
    getCompanyData: vi.fn(() => ({ id: 'comp-1', name: 'PT Test' })),
    hasPermission: vi.fn(() => true),
  },
}));

vi.mock('../../services/suratJalanService', () => ({
  default: {
    getUniqueValues: vi.fn().mockResolvedValue({ data: [] }),
    getSuratJalan: vi.fn().mockResolvedValue({
      data: {
        suratJalan: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 },
      },
    }),
  },
}));

vi.mock('../../hooks/useSuratJalanQuery', () => ({
  useSuratJalanQuery: vi.fn(() => ({
    data: {
      suratJalan: [],
      pagination: { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 },
    },
    isLoading: false,
    isFetching: false,
    error: null,
  })),
}));

describe('SuratJalanTableServerSide', () => {
  it('renders without ReferenceError or initialization errors', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SuratJalanTableServerSide />
      </QueryClientProvider>
    );

    expect(container).toBeDefined();
  });
});
