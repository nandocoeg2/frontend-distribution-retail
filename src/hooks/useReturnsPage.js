import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getReturns,
  classifyReturn as classifyReturnRequest,
  deleteReturn as deleteReturnRequest,
} from '@/services/returnsService';
import toastService from '@/services/toastService';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const sanitizeParams = (params) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const normalizePagination = (pagination = {}, fallback = DEFAULT_PAGINATION) => {
  const page = Number(pagination.page ?? pagination.currentPage ?? fallback.page);
  const limit = Number(pagination.limit ?? pagination.itemsPerPage ?? fallback.limit);
  const total = Number(pagination.total ?? pagination.totalItems ?? fallback.total);
  const totalPages = Number(pagination.totalPages ?? fallback.totalPages);

  return {
    page: Number.isNaN(page) ? fallback.page : page,
    limit: Number.isNaN(limit) ? fallback.limit : limit,
    total: Number.isNaN(total) ? fallback.total : total,
    totalPages: Number.isNaN(totalPages) ? fallback.totalPages : totalPages,
  };
};

const extractReturnsData = (response) => {
  if (!response) {
    return {
      returns: [],
      pagination: DEFAULT_PAGINATION,
    };
  }

  if (Array.isArray(response)) {
    return {
      returns: response,
      pagination: DEFAULT_PAGINATION,
    };
  }

  if (Array.isArray(response.data?.returns)) {
    return {
      returns: response.data.returns,
      pagination: normalizePagination(response.data.pagination),
    };
  }

  if (Array.isArray(response.data)) {
    return {
      returns: response.data,
      pagination: normalizePagination(response.data.pagination),
    };
  }

  if (Array.isArray(response.returns)) {
    return {
      returns: response.returns,
      pagination: normalizePagination(response.pagination),
    };
  }

  return {
    returns: [],
    pagination: DEFAULT_PAGINATION,
  };
};

const useReturnsPage = () => {
  const [returnsData, setReturnsData] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(DEFAULT_PAGINATION.page);
  const [limit, setLimit] = useState(DEFAULT_PAGINATION.limit);
  const [total, setTotal] = useState(DEFAULT_PAGINATION.total);
  const [totalPages, setTotalPages] = useState(DEFAULT_PAGINATION.totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [classifyTarget, setClassifyTarget] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReturns = async () => {
      setLoading(true);
      setError(null);

      const params = sanitizeParams({
        page,
        limit,
        search: appliedFilters.search,
        status: appliedFilters.status,
      });

      try {
        const response = await getReturns(params);
        if (!isMounted) {
          return;
        }

        const { returns, pagination } = extractReturnsData(response);
        const safeReturns = Array.isArray(returns) ? returns : [];
        const normalizedPagination = normalizePagination(pagination, {
          page,
          limit,
          total: safeReturns.length,
          totalPages: Math.max(1, Math.ceil(safeReturns.length / Math.max(limit, 1))),
        });

        setReturnsData(safeReturns);
        setPage((prev) => (prev === normalizedPagination.page ? prev : normalizedPagination.page));
        setLimit((prev) => (prev === normalizedPagination.limit ? prev : normalizedPagination.limit));
        setTotal(normalizedPagination.total);
        setTotalPages(normalizedPagination.totalPages);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = err.message || 'Gagal memuat data retur.';
        setError(message);
        setReturnsData([]);
        setTotal(0);
        setTotalPages(1);
        toastService.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReturns();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters.search, appliedFilters.status, limit, page, reloadToken]);

  const pagination = useMemo(
    () => ({
      page,
      limit,
      total,
      totalPages,
    }),
    [limit, page, total, totalPages]
  );

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  const handleLimitChange = useCallback((nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSearch = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
      }

      setAppliedFilters(filters);
      setPage(1);
    },
    [filters]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const openClassifyModal = useCallback((returnItem) => {
    setClassifyTarget(returnItem);
  }, []);

  const closeClassifyModal = useCallback(() => {
    setClassifyTarget(null);
  }, []);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const handleClassify = useCallback(
    async (action) => {
      if (!classifyTarget) {
        return;
      }

      setClassifyLoading(true);

      try {
        await classifyReturnRequest(classifyTarget.id, action);
        toastService.success(
          action === 'restock'
            ? 'Retur berhasil diklasifikasikan sebagai stok ulang.'
            : 'Retur berhasil diklasifikasikan sebagai ditolak.'
        );
        setClassifyTarget(null);
        refresh();
      } catch (err) {
        toastService.error(err.message || 'Gagal mengklasifikasikan retur.');
      } finally {
        setClassifyLoading(false);
      }
    },
    [classifyTarget, refresh]
  );

  const handleDeleteReturn = useCallback(
    async (id) => {
      if (!id) {
        return false;
      }

      setDeleteLoading(true);
      setDeleteLoadingId(id);

      try {
        await deleteReturnRequest(id);
        toastService.success('Retur berhasil dihapus.');

        const isLastItemOnPage = returnsData.length <= 1 && page > 1;
        if (isLastItemOnPage) {
          setPage((prev) => Math.max(1, prev - 1));
        } else {
          refresh();
        }

        return true;
      } catch (err) {
        toastService.error(err.message || 'Gagal menghapus retur.');
        return false;
      } finally {
        setDeleteLoading(false);
        setDeleteLoadingId(null);
      }
    },
    [page, refresh, returnsData.length]
  );

  const statusOptions = useMemo(
    () => [
      { label: 'Semua Status', value: '' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'Restocked', value: 'RESTOCKED' },
      { label: 'Rejected', value: 'REJECTED' },
    ],
    []
  );

  return {
    returns: returnsData,
    filters,
    appliedFilters,
    pagination,
    loading,
    error,
    classifyTarget,
    classifyLoading,
    deleteLoading,
    deleteLoadingId,
    statusOptions,
    handleFiltersChange,
    handleSearch,
    handleResetFilters,
    handlePageChange,
    handleLimitChange,
    openClassifyModal,
    closeClassifyModal,
    handleClassify,
    handleDeleteReturn,
    refresh,
  };
};

export default useReturnsPage;
