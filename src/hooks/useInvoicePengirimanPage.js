import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import invoicePengirimanService from '../services/invoicePengirimanService';
// usePaginatedSearch is no longer needed
import { useDeleteConfirmation } from './useDeleteConfirmation';

const INITIAL_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  page: 1,
  limit: 10,
  total: 0,
};

// Helper functions for search are no longer needed as search
// functionality is handled by TanStack Table

// Response parsing is now handled by TanStack Query hook
// No need for parse and error resolve functions

const useInvoicePengiriman = () => {
  const navigate = useNavigate();
  // Search functionality is now handled by TanStack Table
  // No need for search-related state

  const handleAuthRedirect = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  // State management for CRUD operations only
  const [invoicePengiriman, setInvoicePengiriman] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // authHandler is now handleAuthRedirect directly

  const resolveLimit = useCallback(() => {
    return pagination.itemsPerPage || pagination.limit || INITIAL_PAGINATION.itemsPerPage;
  }, [pagination]);

  const handlePageChange = useCallback((page) => {
    // Page change is now handled by TanStack Table
    // This function is kept for backward compatibility with modals
  }, []);

  const handleLimitChange = useCallback((limit) => {
    // Limit change is now handled by TanStack Table
    // This function is kept for backward compatibility with modals
  }, []);

  // Search functionality is now handled by TanStack Table
  // No need for search-related functions

  // fetchInvoicePengiriman function is no longer needed as data fetching
  // is handled by TanStack Query in the table component

  // Search functionality is now handled by TanStack Table
  // No need for search-related functions

  // refreshAfterMutation is no longer needed as TanStack Query
  // handles cache invalidation automatically

  const createInvoicePengiriman = useCallback(
    async (invoiceData) => {
      try {
        const result =
          await invoicePengirimanService.createInvoicePengiriman(
            invoiceData
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman created successfully');
        // TanStack Query will automatically invalidate and refetch data
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthRedirect();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to create invoice pengiriman';
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthRedirect]
  );

  const createInvoicePenagihan = useCallback(
    async (id, payload = {}) => {
      try {
        const result =
          await invoicePengirimanService.createInvoicePenagihan(
            id,
            payload
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to create invoice penagihan'
          );
        }
        toastService.success('Invoice penagihan berhasil dibuat');
        // TanStack Query will automatically invalidate and refetch data
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthRedirect();
          return undefined;
        }
        const apiMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message;
        const message =
          apiMessage ||
          err?.message ||
          'Failed to create invoice penagihan';
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthRedirect]
  );

  const updateInvoicePengiriman = useCallback(
    async (id, updateData) => {
      try {
        const result =
          await invoicePengirimanService.updateInvoicePengiriman(
            id,
            updateData
          );
        if (result?.success === false) {
          throw new Error(
            result?.error?.message ||
              'Failed to update invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman updated successfully');
        // TanStack Query will automatically invalidate and refetch data
        return result?.data;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthRedirect();
          return undefined;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to update invoice pengiriman';
        toastService.error(message);
        throw err;
      }
    },
    [handleAuthRedirect]
  );

  const deleteInvoicePengirimanFn = useCallback(
    async (id) => {
      try {
        const result =
          await invoicePengirimanService.deleteInvoicePengiriman(id);
        if (
          !(
            result?.success ||
            result === '' ||
            result === undefined
          )
        ) {
          throw new Error(
            result?.error?.message ||
              'Failed to delete invoice pengiriman'
          );
        }
        toastService.success('Invoice pengiriman berhasil dihapus');
        // TanStack Query will automatically invalidate and refetch data
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthRedirect();
          return;
        }
        const message =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to delete invoice pengiriman';
        setError(message);
        toastService.error(message);
      }
    },
    [
      handleAuthRedirect,
      invoicePengiriman.length,
      pagination,
      resolveLimit,
      setError,
    ]
  );

  const deleteInvoicePengirimanConfirmation = useDeleteConfirmation(
    deleteInvoicePengirimanFn,
    'Apakah Anda yakin ingin menghapus invoice pengiriman ini?',
    'Hapus Invoice Pengiriman'
  );

  // Data fetching is now handled by TanStack Query in the table component
  // No need for initial fetch here

  // Search functionality is now handled by TanStack Table
  // No need for search-related variables

  return {
    invoicePengiriman,
    setInvoicePengiriman,
    pagination,
    setPagination,
    loading,
    error,
    handlePageChange,
    handleLimitChange,
    createInvoice: createInvoicePengiriman,
    createInvoicePengiriman,
    createInvoicePenagihan,
    updateInvoice: updateInvoicePengiriman,
    updateInvoicePengiriman,
    deleteInvoiceConfirmation: deleteInvoicePengirimanConfirmation,
    handleAuthError: handleAuthRedirect,
  };
};

export default useInvoicePengiriman;
