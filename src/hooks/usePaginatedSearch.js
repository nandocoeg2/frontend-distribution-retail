import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const DEFAULT_PAGINATION = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
};

const isValueEmpty = (value) => {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  if (typeof value === 'number') {
    return Number.isNaN(value);
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.values(value).every(isValueEmpty);
  }

  return false;
};

const defaultParseResponse = (response) => {
  if (!response?.success) {
    throw new Error(response?.error?.message || 'Failed to perform search');
  }

  return {
    results: response?.data?.data || [],
    pagination: response?.data?.pagination || DEFAULT_PAGINATION
  };
};

const defaultErrorResolver = (error) => {
  return error?.response?.data?.error?.message || error?.message || 'Failed to perform search';
};

const usePaginatedSearch = ({
  initialInput = '',
  initialPagination = DEFAULT_PAGINATION,
  searchFn,
  parseResponse = defaultParseResponse,
  requireInput = false,
  debounceMs = 500,
  onAuthError,
  resolveErrorMessage = defaultErrorResolver,
  toastOnError = true
} = {}) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInputState] = useState(initialInput);
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimeoutRef = useRef(null);
  const currentInputRef = useRef(initialInput);

  const defaultAuthHandler = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const authHandler = onAuthError || defaultAuthHandler;

  const clearDebounce = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setSearchResults([]);
    setPagination(initialPagination);
    setError(null);
    setIsSearching(false);
  }, [initialPagination]);

  const shouldSkipSearch = useCallback((value) => {
    if (!requireInput) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(isValueEmpty);
    }

    return value == null;
  }, [requireInput]);

  const resolveLimit = useCallback((pageState = pagination) => {
    if (!pageState) {
      return initialPagination.itemsPerPage || initialPagination.limit || 10;
    }

    return pageState.itemsPerPage || pageState.limit || initialPagination.itemsPerPage || 10;
  }, [pagination, initialPagination]);

  const performSearch = useCallback(async (value = currentInputRef.current, page = 1, limit = resolveLimit()) => {
    clearDebounce();

    currentInputRef.current = value;
    setInputState(value);

    if (shouldSkipSearch(value)) {
      resetState();
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);

      const response = await searchFn(value, page, limit);
      const { results, pagination: nextPagination } = parseResponse(response) || {};

      setSearchResults(results || []);
      setPagination(nextPagination || initialPagination);

      return response;
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        authHandler();
        return null;
      }

      const message = resolveErrorMessage(err);
      setError(message);
      if (toastOnError && message) {
        toastService.error(message);
      }
      setIsSearching(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authHandler, clearDebounce, initialPagination, parseResponse, resolveErrorMessage, resetState, resolveLimit, searchFn, shouldSkipSearch, toastOnError]);

  const debouncedSearch = useCallback((value = currentInputRef.current, page = 1, limit) => {
    clearDebounce();

    const effectiveLimit = typeof limit === 'number' ? limit : resolveLimit();

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(value, page, effectiveLimit);
    }, debounceMs);
  }, [clearDebounce, debounceMs, performSearch, resolveLimit]);

  const handlePageChange = useCallback((newPage) => {
    performSearch(currentInputRef.current, newPage, resolveLimit());
  }, [performSearch, resolveLimit]);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: newLimit,
      limit: newLimit
    }));

    performSearch(currentInputRef.current, 1, newLimit);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    clearDebounce();
    currentInputRef.current = initialInput;
    setInputState(initialInput);
    resetState();
  }, [clearDebounce, initialInput, resetState]);

  const setInput = useCallback((valueOrUpdater) => {
    setInputState(prev => {
      const nextValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      currentInputRef.current = nextValue;
      return nextValue;
    });
  }, []);

  useEffect(() => clearDebounce, [clearDebounce]);

  return {
    input,
    setInput,
    searchResults,
    setSearchResults,
    pagination,
    setPagination,
    loading,
    error,
    setError,
    isSearching,
    performSearch,
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    clearSearch,
    clearDebounce,
    resolveLimit,
    handleAuthError: authHandler
  };
};

export default usePaginatedSearch;
