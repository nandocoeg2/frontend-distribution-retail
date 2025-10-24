import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import companyService from '@/services/companyService';

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

const extractCompanyRecords = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload.data?.data,
    payload.data?.items,
    payload.data?.results,
    payload.data?.companies,
    payload.data,
    payload.results,
    payload.items,
    payload.companies,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate !== payload) {
      const extracted = extractCompanyRecords(candidate);
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  return [];
};

const unwrapCompanyRecord = (payload) => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (payload.company && payload.company !== payload) {
    return unwrapCompanyRecord(payload.company);
  }

  if (payload.data && payload.data !== payload) {
    return unwrapCompanyRecord(payload.data);
  }

  return payload;
};

const mapCompanyOption = (company) => {
  if (!company) {
    return null;
  }

  const idCandidate =
    company.id ??
    company.companyId ??
    company.uuid ??
    company.company_id ??
    company._id ??
    company.companyID;

  const id = normalizeId(idCandidate);
  if (!id) {
    return null;
  }

  const code =
    company.kode_company ??
    company.code ??
    company.companyCode ??
    company.company_code ??
    '';

  const name =
    company.nama_perusahaan ??
    company.name ??
    company.companyName ??
    company.company_name ??
    company.display_name ??
    '';

  const labelParts = [];
  if (isNonEmptyString(code)) {
    labelParts.push(code.trim());
  }
  if (isNonEmptyString(name)) {
    labelParts.push(name.trim());
  }

  const label = labelParts.length > 0 ? labelParts.join(' - ') : id;

  return {
    id,
    label,
    code: code || null,
    name: name || null,
    raw: company,
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

const useCompanyAutocomplete = ({
  selectedValue,
  selectedId,
  initialFetch = true,
  pageSize = DEFAULT_LIMIT,
} = {}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const optionsRef = useRef([]);
  const selectedValueRef = useRef(
    normalizeId(selectedValue ?? selectedId)
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeUpdateOptions = useCallback((updater) => {
    if (!mountedRef.current) {
      return;
    }

    setOptions((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : updater;
      const normalized = Array.isArray(next) ? next : [];
      optionsRef.current = normalized;
      return normalized;
    });
  }, []);

  const safeSetLoading = useCallback((value) => {
    if (!mountedRef.current) {
      return;
    }
    setLoading(value);
  }, []);

  const safeSetError = useCallback((value) => {
    if (!mountedRef.current) {
      return;
    }
    setError(value);
  }, []);

  const fetchOptions = useCallback(
    async (query = '') => {
      safeSetLoading(true);
      safeSetError(null);

      try {
        const trimmed =
          typeof query === 'string' ? query.trim() : '';
        const response = trimmed
          ? await companyService.searchCompanies(trimmed, 1, pageSize)
          : await companyService.getCompanies(1, pageSize);

        const records = extractCompanyRecords(response);
        const mapped = records.map(mapCompanyOption).filter(Boolean);

        const selectedIdValue = selectedValueRef.current;
        const selectedOption = selectedIdValue
          ? mapped.find((option) => option.id === selectedIdValue) ||
            optionsRef.current.find(
              (option) => option.id === selectedIdValue
            ) ||
            null
          : null;

        const nextOptions = selectedOption
          ? mergeUniqueOptions(mapped, [selectedOption])
          : mapped;

        safeUpdateOptions(nextOptions);
        return nextOptions;
      } catch (err) {
        console.error('Failed to fetch company options:', err);
        safeSetError(err?.message || 'Gagal memuat daftar perusahaan');
        safeUpdateOptions([]);
        return [];
      } finally {
        safeSetLoading(false);
      }
    },
    [pageSize, safeSetError, safeSetLoading, safeUpdateOptions]
  );

  const ensureOptionById = useCallback(
    async (value) => {
      const normalized = normalizeId(value);
      if (!normalized) {
        return null;
      }

      const existingOption =
        optionsRef.current.find((option) => option.id === normalized) ||
        null;

      if (existingOption) {
        return existingOption;
      }

      safeSetLoading(true);
      safeSetError(null);

      try {
        const response =
          await companyService.getCompanyById(normalized);
        const record = unwrapCompanyRecord(response);
        const option = mapCompanyOption(record);

        if (option) {
          safeUpdateOptions((prev) => mergeUniqueOptions([option], prev));
        }

        return option || null;
      } catch (err) {
        console.error('Failed to load company option:', err);
        safeSetError(err?.message || 'Gagal mengambil perusahaan');
        return null;
      } finally {
        safeSetLoading(false);
      }
    },
    [safeSetError, safeSetLoading, safeUpdateOptions]
  );

  useEffect(() => {
    const normalized = normalizeId(selectedValue ?? selectedId);
    selectedValueRef.current = normalized;
    if (!normalized) {
      return;
    }

    ensureOptionById(normalized);
  }, [ensureOptionById, selectedId, selectedValue]);

  useEffect(() => {
    if (!initialFetch) {
      return;
    }

    fetchOptions('');
  }, [fetchOptions, initialFetch]);

  const memoizedOptions = useMemo(() => options, [options]);

  return {
    options: memoizedOptions,
    loading,
    error,
    fetchOptions,
    searchCompanies: fetchOptions,
    ensureOptionById,
    setOptions: safeUpdateOptions,
  };
};

export default useCompanyAutocomplete;
