import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';

const DEFAULT_LIMIT = 50;

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
    payload.data?.tandaTerimaFakturs,
    payload.data,
    payload.results,
    payload.items,
    payload.tandaTerimaFakturs,
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

const mapTtfOption = (ttf) => {
  if (!ttf) {
    return null;
  }

  const id = ttf.id ?? ttf.tandaTerimaFakturId;
  if (!id) {
    return null;
  }

  const idString = normalizeId(id);
  const groupName =
    ttf.groupCustomer?.nama_group ??
    ttf.customer?.namaCustomer ??
    ttf.invoicePenagihan?.kepada ??
    '';
  const invoiceNo =
    ttf.invoicePenagihan?.no_invoice_penagihan ??
    ttf.invoicePenagihan?.noInvoicePenagihan ??
    '';
  const amountStr = ttf.grand_total ? `Rp ${Number(ttf.grand_total).toLocaleString('id-ID')}` : '';

  const details = [groupName, invoiceNo, amountStr].filter(Boolean).join(' • ');
  const label = details ? `${idString} (${details})` : idString;

  return {
    id: idString,
    label,
    raw: ttf,
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

const useTandaTerimaFakturAutocomplete = ({
  selectedValue,
  initialFetch = true,
  pageSize = DEFAULT_LIMIT,
} = {}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedValueRef = useRef(selectedValue);
  useEffect(() => {
    selectedValueRef.current = selectedValue;
  }, [selectedValue]);

  const selectedOptionRef = useRef(null);

  const formatOptions = useCallback((items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map(mapTtfOption)
      .filter((opt) => Boolean(opt && opt.id));
  }, []);

  const fetchOptions = useCallback(
    async (query = '') => {
      setLoading(true);
      try {
        const response = await tandaTerimaFakturService.getAll({
          page: 1,
          limit: pageSize,
          search: query || undefined,
          status_codes: ['PENDING PAYMENT', 'Menunggu Pembayaran'],
        });

        const records = extractRecords(response);
        const fetchedOptions = formatOptions(records);

        setOptions((prev) => {
          if (selectedOptionRef.current) {
            return mergeUniqueOptions([selectedOptionRef.current], fetchedOptions);
          }
          return fetchedOptions;
        });
      } catch (error) {
        console.error('Error fetching TTF options:', error);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, formatOptions]
  );

  useEffect(() => {
    if (initialFetch) {
      fetchOptions('');
    }
  }, [initialFetch, fetchOptions]);

  useEffect(() => {
    const normalizedSelected = normalizeId(selectedValue);
    if (!normalizedSelected) {
      selectedOptionRef.current = null;
      return;
    }

    const foundInCurrent = options.find((opt) => opt.id === normalizedSelected);
    if (foundInCurrent) {
      selectedOptionRef.current = foundInCurrent;
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const detail = await tandaTerimaFakturService.getById(normalizedSelected);
        const record = detail?.data ?? detail;
        const mapped = mapTtfOption(record);

        if (isMounted && mapped) {
          selectedOptionRef.current = mapped;
          setOptions((prev) => mergeUniqueOptions([mapped], prev));
        }
      } catch (err) {
        console.error('Failed to resolve selected TTF:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedValue]);

  return {
    options,
    loading,
    fetchOptions,
  };
};

export default useTandaTerimaFakturAutocomplete;
