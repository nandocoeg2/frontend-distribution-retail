import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import invoicePenagihanService from '@/services/invoicePenagihanService';

const DEFAULT_LIMIT = 10;

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const extractRecords = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload.data?.data,
    payload.data?.results,
    payload.data?.items,
    payload.data,
    payload.results,
    payload.items,
    payload.records,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate !== payload) {
      const extracted = extractRecords(candidate);
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
};

const mapInvoiceOption = (invoice) => {
  if (!invoice) {
    return null;
  }

  const id = invoice.id ?? invoice.invoicePenagihanId;
  if (!id) {
    return null;
  }

  const idString = normalizeId(id);
  const number =
    invoice.no_invoice_penagihan ?? invoice.noInvoicePenagihan ?? '';
  const recipient =
    invoice.kepada ??
    invoice.purchaseOrder?.customer?.namaCustomer ??
    invoice.customer?.namaCustomer ??
    '';

  const parts = [number, recipient].filter(Boolean);
  const label = parts.length > 0 ? parts.join(' • ') : idString;

  return {
    id: idString,
    label,
    raw: invoice,
  };
};

const mergeUniqueOptions = (primary = [], secondary = []) => {
  const seen = new Set();
  const results = [];

  const push = (option) => {
    if (!option?.id) {
      return;
    }

    if (seen.has(option.id)) {
      return;
    }

    seen.add(option.id);
    results.push(option);
  };

  primary.forEach(push);
  secondary.forEach(push);

  return results;
};

const useInvoicePenagihanAutocomplete = ({
  selectedValue,
  initialFetch = true,
  pageSize = DEFAULT_LIMIT,
} = {}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const optionsRef = useRef([]);
  const selectedValueRef = useRef(normalizeId(selectedValue));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetOptions = useCallback((updater) => {
    if (!mountedRef.current) {
      return;
    }

    setOptions((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      optionsRef.current = Array.isArray(next) ? next : [];
      return optionsRef.current;
    });
  }, []);

  const safeSetLoading = useCallback((value) => {
    if (mountedRef.current) {
      setLoading(value);
    }
  }, []);

  const safeSetError = useCallback((value) => {
    if (mountedRef.current) {
      setError(value);
    }
  }, []);

  const fetchOptions = useCallback(
    async (query = '') => {
      const trimmedQuery = query.trim();

      safeSetLoading(true);
      safeSetError(null);

      try {
        const response = trimmedQuery
          ? await invoicePenagihanService.searchInvoicePenagihan(
              { no_invoice_penagihan: trimmedQuery },
              1,
              pageSize
            )
          : await invoicePenagihanService.getAllInvoicePenagihan(1, pageSize);

        const records = extractRecords(response);
        let mapped = records.map(mapInvoiceOption).filter(Boolean);

        if (trimmedQuery && mapped.length === 0) {
          try {
            const fallbackResponse =
              await invoicePenagihanService.getInvoicePenagihanById(
                trimmedQuery
              );
            const fallbackRecord =
              fallbackResponse?.data || fallbackResponse || null;
            const fallbackOption = mapInvoiceOption(fallbackRecord);
            if (fallbackOption) {
              mapped = mergeUniqueOptions([fallbackOption], mapped);
            }
          } catch (fallbackError) {
            if (fallbackError?.response?.status !== 404) {
              console.error(
                'Failed to resolve invoice penagihan fallback option:',
                fallbackError
              );
            }
          }
        }

        const selectedId = selectedValueRef.current;
        const selectedOption = selectedId
          ? mapped.find((option) => option.id === selectedId) ||
            optionsRef.current.find((option) => option.id === selectedId) ||
            null
          : null;

        const nextOptions = selectedOption
          ? mergeUniqueOptions(mapped, [selectedOption])
          : mapped;

        safeSetOptions(nextOptions);
        return nextOptions;
      } catch (err) {
        console.error('Failed to fetch invoice penagihan options:', err);
        safeSetError(
          err?.message || 'Gagal memuat daftar invoice penagihan'
        );
        return [];
      } finally {
        safeSetLoading(false);
      }
    },
    [pageSize, safeSetError, safeSetLoading, safeSetOptions]
  );

  const ensureOptionById = useCallback(
    async (value) => {
      const normalized = normalizeId(value);
      if (!normalized) {
        return null;
      }

      const existing =
        optionsRef.current.find((option) => option.id === normalized) || null;

      if (existing) {
        return existing;
      }

      safeSetLoading(true);
      safeSetError(null);

      try {
        const response =
          await invoicePenagihanService.getInvoicePenagihanById(normalized);
        const record = response?.data || response;
        const option = mapInvoiceOption(record);

        if (option) {
          safeSetOptions((prev) => mergeUniqueOptions(prev, [option]));
        }

        return option || null;
      } catch (err) {
        console.error('Failed to load invoice penagihan option:', err);
        safeSetError(
          err?.message || 'Gagal mengambil invoice penagihan'
        );
        return null;
      } finally {
        safeSetLoading(false);
      }
    },
    [safeSetError, safeSetLoading, safeSetOptions]
  );

  useEffect(() => {
    selectedValueRef.current = normalizeId(selectedValue);
    if (!selectedValueRef.current) {
      return;
    }

    ensureOptionById(selectedValueRef.current);
  }, [ensureOptionById, selectedValue]);

  useEffect(() => {
    if (!initialFetch) {
      return;
    }

    fetchOptions('');
  }, [fetchOptions, initialFetch]);

  const autocompleteOptions = useMemo(() => options, [options]);

  return {
    options: autocompleteOptions,
    loading,
    error,
    fetchOptions,
    searchInvoicePenagihan: fetchOptions,
    ensureOptionById,
    setOptions: safeSetOptions,
  };
};

export default useInvoicePenagihanAutocomplete;
