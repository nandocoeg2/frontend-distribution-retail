import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import purchaseOrderService from '@/services/purchaseOrderService';

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

  if (typeof payload === 'object') {
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
      if (!candidate || candidate === payload) {
        continue;
      }

      const extracted = extractRecords(candidate);
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
};

const mapPurchaseOrderOption = (po) => {
  if (!po) {
    return null;
  }

  const id = po.id || po.purchaseOrderId;
  if (!id) {
    return null;
  }

  const idString = String(id);
  const number = po.po_number || po.poNumber;
  const customerName =
    po.customer?.namaCustomer || po.customer?.name || po.customerName;

  const labelParts = [number, customerName].filter(Boolean);
  const label = labelParts.length > 0 ? labelParts.join(' - ') : idString;

  return {
    id: idString,
    label,
    raw: po,
  };
};

const mergeUniqueOptions = (primary = [], secondary = []) => {
  const seen = new Set();
  const results = [];

  const pushOption = (option) => {
    if (!option || !option.id) {
      return;
    }

    if (seen.has(option.id)) {
      return;
    }

    seen.add(option.id);
    results.push(option);
  };

  primary.forEach(pushOption);
  secondary.forEach(pushOption);

  return results;
};

const usePurchaseOrderAutocomplete = ({
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
      safeSetLoading(true);
      safeSetError(null);

      try {
        const response = query
          ? await purchaseOrderService.searchPurchaseOrders(
              { po_number: query },
              1,
              pageSize
            )
          : await purchaseOrderService.getAllPurchaseOrders(1, pageSize);

        const records = extractRecords(response);
        const mapped = records.map(mapPurchaseOrderOption).filter(Boolean);

        const selectedId = selectedValueRef.current;
        const selectedOption = selectedId
          ? optionsRef.current.find(
              (option) => normalizeId(option.id) === selectedId
            )
          : null;

        const nextOptions = selectedOption
          ? mergeUniqueOptions(mapped, [selectedOption])
          : mapped;

        safeSetOptions(nextOptions);
        return nextOptions;
      } catch (err) {
        console.error('Failed to fetch purchase order options:', err);
        safeSetError(err?.message || 'Gagal memuat purchase order');
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
        optionsRef.current.find(
          (option) => normalizeId(option.id) === normalized
        ) || null;

      if (existing) {
        return existing;
      }

      safeSetLoading(true);
      safeSetError(null);

      try {
        const response = await purchaseOrderService.getPurchaseOrderById(
          normalized
        );
        const record = response?.data || response;
        const option = mapPurchaseOrderOption(record);

        if (option) {
          safeSetOptions((prev) => mergeUniqueOptions(prev, [option]));
        }

        return option || null;
      } catch (err) {
        console.error('Failed to load purchase order option:', err);
        safeSetError(err?.message || 'Gagal mengambil purchase order');
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
    searchPurchaseOrders: fetchOptions,
    ensureOptionById,
    ensureOption: ensureOptionById,
    valueKey: 'id',
    setOptions: safeSetOptions,
    addOptions: (incoming = []) => {
      safeSetOptions((prev) => mergeUniqueOptions(prev, incoming));
    },
  };
};

export default usePurchaseOrderAutocomplete;
