import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import termOfPaymentService from '@/services/termOfPaymentService';

const DEFAULT_LIMIT = 10;

const normalizeId = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

const extractTermRecords = (payload) => {
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
    payload.records
  ];

  for (const candidate of candidates) {
    if (candidate && candidate !== payload) {
      const extracted = extractTermRecords(candidate);
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
};

const mapTermRecordToOption = (term) => {
  if (!term) {
    return null;
  }

  const id = normalizeId(term.id ?? term.termOfPaymentId ?? term.kode_top);
  if (!id) {
    return null;
  }

  const code = term.kode_top ?? term.kodeTop ?? term.code ?? '';
  const name = term.nama_top ?? term.namaTop ?? term.name ?? '';
  const daysRaw = term.batas_hari ?? term.batasHari ?? term.days ?? term.daysLimit;
  const days = Number.isFinite(Number(daysRaw)) ? Number(daysRaw) : null;

  const parts = [];

  if (isNonEmptyString(code)) {
    parts.push(code.trim());
  }

  if (isNonEmptyString(name)) {
    parts.push(name.trim());
  }

  if (days !== null) {
    parts.push(`${days} hari`);
  }

  const label = parts.length > 0 ? parts.join(' • ') : id;

  return {
    id,
    label,
    kode_top: code || null,
    nama_top: name || null,
    batas_hari: days,
    raw: term
  };
};

const mergeUniqueOptions = (incoming = [], existing = []) => {
  const map = new Map();

  existing.forEach((option) => {
    if (option?.id) {
      map.set(option.id, option);
    }
  });

  incoming.forEach((option) => {
    if (option?.id) {
      map.set(option.id, option);
    }
  });

  return Array.from(map.values());
};

const useTermOfPaymentAutocomplete = ({
  selectedValue,
  selectedId,
  valueKey = 'id',
  initialFetch = true,
  pageSize = DEFAULT_LIMIT
} = {}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef([]);
  const selectionKey = valueKey || 'id';
  const selectedValueRef = useRef(
    normalizeId(selectedValue ?? selectedId)
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    selectedValueRef.current = normalizeId(selectedValue ?? selectedId);
  }, [selectedId, selectedValue]);

  const safelySetState = useCallback((setter) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);

  const upsertOptions = useCallback((nextOptions, mergeWithExisting = false) => {
    const normalized = Array.isArray(nextOptions) ? nextOptions : [];
    safelySetState(() => {
      setOptions((prev) => {
        const merged = mergeWithExisting
          ? mergeUniqueOptions(normalized, prev)
          : normalized;
        optionsRef.current = merged;
        return merged;
      });
    });
  }, [safelySetState]);

  const fetchOptions = useCallback(
    async (query = '') => {
      const trimmedQuery = normalizeId(query);
      const limit = pageSize;

      safelySetState(() => {
        setLoading(true);
        setError(null);
      });

      try {
        const response = trimmedQuery
          ? await termOfPaymentService.searchTermOfPayments(trimmedQuery, 1, limit)
          : await termOfPaymentService.getAllTermOfPayments(1, limit);

        const records = extractTermRecords(response);
        const mappedOptions = records
          .map(mapTermRecordToOption)
          .filter(Boolean);

        const currentOptions = optionsRef.current || [];
        const selectedOption = (() => {
          const currentSelectedValue = selectedValueRef.current;
          if (!currentSelectedValue) {
            return null;
          }
          return mappedOptions.find(
            (option) => normalizeId(option?.[selectionKey]) === currentSelectedValue
          )
            || currentOptions.find(
              (option) => normalizeId(option?.[selectionKey]) === currentSelectedValue
            )
            || null;
        })();

        const nextOptions = selectedOption
          ? mergeUniqueOptions(mappedOptions, [selectedOption])
          : mappedOptions;

        if (trimmedQuery) {
          upsertOptions(nextOptions, false);
        } else {
          upsertOptions(nextOptions, true);
        }

        return nextOptions;
      } catch (err) {
        console.error('Failed to fetch term of payment options:', err);
        safelySetState(() => {
          setError(err?.message || 'Gagal memuat term of payment');
        });
        return [];
      } finally {
        safelySetState(() => {
          setLoading(false);
        });
      }
    },
    [pageSize, safelySetState, selectionKey, upsertOptions]
  );

  const ensureOptionByValue = useCallback(
    async (value) => {
      const normalizedValue = normalizeId(value);
      if (!normalizedValue) {
        return null;
      }

      const existingOption = (optionsRef.current || []).find(
        (option) => normalizeId(option?.[selectionKey]) === normalizedValue
      );
      if (existingOption) {
        return existingOption;
      }

      safelySetState(() => {
        setLoading(true);
        setError(null);
      });

      try {
        if (selectionKey === 'id') {
          const response = await termOfPaymentService.getTermOfPaymentById(
            normalizedValue
          );
          const record = response?.data || response;
          const option = mapTermRecordToOption(record);

          if (option) {
            upsertOptions([option], true);
          }

          return option;
        }

        const response = await termOfPaymentService.searchTermOfPayments(
          normalizedValue,
          1,
          Math.max(pageSize, DEFAULT_LIMIT)
        );
        const records = extractTermRecords(response);
        const mappedOptions = records
          .map(mapTermRecordToOption)
          .filter(Boolean);

        const match = mappedOptions.find(
          (option) => normalizeId(option?.[selectionKey]) === normalizedValue
        );

        if (match) {
          upsertOptions([match], true);
        }

        return match || null;
      } catch (err) {
        console.error('Failed to load term of payment option:', err);
        safelySetState(() => {
          setError(err?.message || 'Gagal mengambil term of payment');
        });
        return null;
      } finally {
        safelySetState(() => {
          setLoading(false);
        });
      }
    },
    [pageSize, safelySetState, selectionKey, upsertOptions]
  );

  useEffect(() => {
    if (!initialFetch) {
      return;
    }

    fetchOptions('');
  }, [fetchOptions, initialFetch]);

  useEffect(() => {
    const normalized = normalizeId(selectedValue ?? selectedId);
    if (!normalized) {
      return;
    }

    ensureOptionByValue(normalized);
  }, [ensureOptionByValue, selectedId, selectedValue]);

  const autocompleteOptions = useMemo(() => options, [options]);

  return {
    options: autocompleteOptions,
    loading,
    error,
    fetchOptions,
    searchTermOfPayments: fetchOptions,
    ensureOptionByValue,
    ensureOptionById: ensureOptionByValue,
    ensureOption: ensureOptionByValue,
    setOptions: (nextOptions) => {
      upsertOptions(Array.isArray(nextOptions) ? nextOptions : [], false);
    },
    addOptions: (incomingOptions) => {
      upsertOptions(
        Array.isArray(incomingOptions) ? incomingOptions : [],
        true
      );
    },
    valueKey: selectionKey
  };
};

export default useTermOfPaymentAutocomplete;
