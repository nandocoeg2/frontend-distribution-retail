import React, { useMemo, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  LinkIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { TabContainer, Tab } from '../ui/Tabs.jsx';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { useMutasiBankQuery } from '../../hooks/useMutasiBankQuery';
import { DataTable, DataTablePagination } from '../table';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'Semua', filters: {} },
  pending: { label: 'Pending', filters: { validation_status: 'PENDING' } },
  matched: { label: 'Matched', filters: { validation_status: 'MATCHED' } },
  unmatched: { label: 'Unmatched', filters: { validation_status: 'UNMATCHED' } },
  valid: { label: 'Valid', filters: { validation_status: 'VALID' } },
  invalid: { label: 'Invalid', filters: { validation_status: 'INVALID' } },
  reconciled: { label: 'Reconciled', filters: { validation_status: 'RECONCILED' } },
};

const TAB_ORDER = ['all', 'pending', 'matched', 'unmatched', 'valid', 'invalid', 'reconciled'];

const toCamelCase = (value = '') =>
  value.replace(/[_-](\w)/g, (_, letter) => letter.toUpperCase());

const toSnakeCase = (value = '') =>
  value
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');

const getNestedValue = (source, path) => {
  if (!source || !path) {
    return undefined;
  }

  const segments = path.split('.');
  let current = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
      continue;
    }

    const camelSegment = toCamelCase(segment);
    if (Object.prototype.hasOwnProperty.call(current, camelSegment)) {
      current = current[camelSegment];
      continue;
    }

    const snakeSegment = toSnakeCase(segment);
    if (Object.prototype.hasOwnProperty.call(current, snakeSegment)) {
      current = current[snakeSegment];
      continue;
    }

    const lowerSegment = segment.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(current, lowerSegment)) {
      current = current[lowerSegment];
      continue;
    }

    return undefined;
  }

  return current;
};

const getFirstAvailableValue = (source, paths = []) => {
  if (!source || !Array.isArray(paths)) {
    return undefined;
  }

  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const resolveMutationId = (mutation) => {
  if (!mutation) {
    return null;
  }

  return (
    mutation.id ??
    mutation.mutationId ??
    mutation.uuid ??
    mutation._id ??
    mutation.transactionId ??
    mutation.bankMutationId ??
    null
  );
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toUpperCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('VALID') || value.includes('MATCH')) {
    return 'success';
  }

  if (value.includes('INVALID') || value.includes('FAIL')) {
    return 'danger';
  }

  if (value.includes('PENDING') || value.includes('UNMATCH')) {
    return 'warning';
  }

  return 'info';
};

const resolveMutationTypeLabel = (mutation) => {
  const type =
    getFirstAvailableValue(mutation, ['mutation_type', 'mutationType']) || '';
  const normalized = String(type).toUpperCase();

  if (normalized === 'CR' || normalized === 'CREDIT') {
    return 'CR';
  }
  if (normalized === 'DB' || normalized === 'DEBIT') {
    return 'DB';
  }
  return type || '-';
};

const resolveMatchedDocument = (mutation) => {
  const matched = getFirstAvailableValue(mutation, [
    'matched_document',
    'matchedDocument',
    'document',
    'matched',
  ]);

  if (!matched || typeof matched !== 'object') {
    return null;
  }

  const documentType =
    getFirstAvailableValue(matched, ['type', 'document_type', 'documentType']) ||
    getFirstAvailableValue(mutation, ['matched_type', 'matchedType']);
  const documentNumber =
    getFirstAvailableValue(matched, [
      'number',
      'document_number',
      'invoice_number',
      'reference',
    ]) ||
    getFirstAvailableValue(mutation, [
      'matched_number',
      'matched_reference',
      'matchedNumber',
    ]);

  const documentAmount =
    getFirstAvailableValue(matched, ['amount', 'total']) ||
    getFirstAvailableValue(mutation, ['matched_amount', 'matchedAmount']);

  return {
    type: documentType || 'Dokumen',
    number: documentNumber || '',
    amount: documentAmount || null,
  };
};

const sanitizeFilters = (filters = {}) => {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
};

const shouldFormatAsCurrency = (keyPath = '') => {
  const normalized = String(keyPath).toLowerCase();
  return (
    normalized.includes('amount') ||
    normalized.includes('nominal') ||
    normalized.includes('value') ||
    normalized.includes('total_nominal')
  );
};

const formatSummaryValue = (keyPath, value) => {
  if (typeof value === 'number') {
    if (shouldFormatAsCurrency(keyPath)) {
      return formatCurrency(value);
    }
    return value.toLocaleString('id-ID');
  }

  if (value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '-';
    }

    return value
      .map((item, index) => formatSummaryValue(`${keyPath}[${index}]`, item))
      .join(', ');
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '-';
    }

    return entries
      .map(([innerKey, innerValue]) => {
        const label = innerKey.replace(/[_-]/g, ' ').toUpperCase();
        const formattedValue = formatSummaryValue(innerKey, innerValue);
        return `${label}: ${formattedValue}`;
      })
      .join(', ');
  }

  return String(value);
};

const MutasiBankTableServerSide = ({
  filters = {},
  activeTab = 'all',
  selectedMutationIds = [],
  onSelectMutation,
  onSelectAllMutations,
  onViewMutation,
  onMatchMutation,
  onUnmatchMutation,
  onValidateMutation,
  isMatching = false,
  isUnmatching = false,
  isValidating = false,
  initialPage = 1,
  initialLimit = 10,
  onTabChange,
  onManualRefresh,
}) => {
  const lockedFilters = useMemo(() => {
    const config = TAB_STATUS_CONFIG[activeTab] || {};
    const statusFilters = config.filters || {};
    return Object.entries(statusFilters).map(([key, value]) => ({
      id: key,
      value,
    }));
  }, [activeTab]);

  const {
    data: mutations,
    pagination,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
    queryResult,
  } = useServerSideTable({
    queryHook: useMutasiBankQuery,
    selectData: (response) => response?.mutations ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    lockedFilters,
    getQueryParams: useCallback(
      ({ filters: columnFilters, ...rest }) => {
        const sanitized = sanitizeFilters(filters);
        return {
          ...rest,
          filters: {
            ...columnFilters,
            ...sanitized,
          },
        };
      },
      [filters]
    ),
  });

  const tableColumns = useMemo(() => {
    return [
      columnHelper.display({
        id: 'select',
        header: () => {
          const currentIds = mutations
            .map((mutation) => resolveMutationId(mutation))
            .filter(Boolean);
          const isAllSelected =
            currentIds.length > 0 &&
            currentIds.every((id) => selectedMutationIds.includes(id));
          const isIndeterminate =
            !isAllSelected &&
            currentIds.some((id) => selectedMutationIds.includes(id));

          return (
            <input
              type='checkbox'
              checked={isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isIndeterminate;
                }
              }}
              onChange={() => {
                if (typeof onSelectAllMutations === 'function') {
                  onSelectAllMutations(currentIds, !isAllSelected);
                }
              }}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          );
        },
        cell: ({ row }) => {
          const mutation = row.original;
          const mutationId = resolveMutationId(mutation);
          const isSelected = mutationId
            ? selectedMutationIds.includes(mutationId)
            : false;
          return (
            <input
              type='checkbox'
              checked={isSelected}
              onChange={(event) => {
                if (typeof onSelectMutation === 'function') {
                  onSelectMutation(mutationId, event.target.checked);
                }
              }}
              disabled={!mutationId}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor(
        (row) =>
          getFirstAvailableValue(row, [
            'transaction_date',
            'transactionDate',
            'tanggal_transaksi',
            'tanggalTransaksi',
            'mutation_date',
            'mutationDate',
          ]) || null,
        {
          id: 'transaction_date',
          header: 'Tanggal',
          cell: (info) => {
            const value = info.getValue();
            return value ? formatDate(value) : '-';
          },
        }
      ),
      columnHelper.accessor(
        (row) =>
          getFirstAvailableValue(row, [
            'description',
            'keterangan',
            'details',
            'remark',
          ]) || '',
        {
          id: 'description',
          header: 'Deskripsi',
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.accessor(
        (row) =>
          Number(
            getFirstAvailableValue(row, ['amount', 'nominal', 'total_amount']) ||
              0
          ),
        {
          id: 'amount',
          header: 'Nominal',
          cell: (info) => formatCurrency(info.getValue() || 0),
        }
      ),
      columnHelper.display({
        id: 'mutation_type',
        header: 'Tipe',
        cell: ({ row }) => {
          const type = resolveMutationTypeLabel(row.original);
          const baseClass =
            type === 'CR'
              ? 'bg-green-100 text-green-800'
              : type === 'DB'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-700';
          return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${baseClass}`}>
              {type || '-'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'validation_status',
        header: 'Status',
        cell: ({ row }) => {
          const status =
            getFirstAvailableValue(row.original, [
              'validation_status',
              'validationStatus',
              'status',
            ]) || '-';
          return (
            <StatusBadge status={status} variant={resolveStatusVariant(status)} />
          );
        },
      }),
      columnHelper.accessor(
        (row) =>
          getFirstAvailableValue(row, ['bank_code', 'bankCode', 'bank']) || '',
        {
          id: 'bank_code',
          header: 'Bank',
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.accessor(
        (row) =>
          getFirstAvailableValue(row, [
            'reference_number',
            'referenceNumber',
            'nomor_referensi',
            'nomorReferensi',
            'reference',
          ]) || '',
        {
          id: 'reference_number',
          header: 'Referensi',
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.accessor(
        (row) =>
          getFirstAvailableValue(row, [
            'batch_number',
            'batchNumber',
            'batch',
          ]) || '',
        {
          id: 'batch_number',
          header: 'Batch',
          cell: (info) => info.getValue() || '-',
        }
      ),
      columnHelper.display({
        id: 'matched_document',
        header: 'Dokumen Cocok',
        cell: ({ row }) => {
          const matched = resolveMatchedDocument(row.original);
          if (!matched) {
            return <span className='text-sm text-gray-400'>Belum ada</span>;
          }

          return (
            <div className='text-sm leading-tight'>
              <div className='font-medium text-gray-800'>{matched.type}</div>
              {matched.number && (
                <div className='text-gray-600'>No: {matched.number}</div>
              )}
              {matched.amount ? (
                <div className='text-gray-600'>
                  {formatCurrency(matched.amount)}
                </div>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const mutation = row.original;
          const mutationId = resolveMutationId(mutation);
          const mutationType = resolveMutationTypeLabel(mutation);
          const matched = resolveMatchedDocument(mutation);

          const isCredit =
            mutationType === 'CR' ||
            String(mutationType).toUpperCase() === 'CREDIT';

          return (
            <div className='flex items-center space-x-2'>
              <button
                type='button'
                onClick={() => {
                  if (typeof onViewMutation === 'function') {
                    onViewMutation(mutation, mutationId);
                  }
                }}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800'
              >
                <EyeIcon className='w-4 h-4 mr-1' />
                Detail
              </button>

              <button
                type='button'
                onClick={() => {
                  if (typeof onMatchMutation === 'function') {
                    onMatchMutation(mutation, mutationId);
                  }
                }}
                disabled={!isCredit || isMatching}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-40'
                title={
                  isCredit
                    ? 'Lakukan pencocokan mutasi'
                    : 'Pencocokan hanya tersedia untuk mutasi credit (CR)'
                }
              >
                <LinkIcon className='w-4 h-4 mr-1' />
                Match
              </button>

              <button
                type='button'
                onClick={() => {
                  if (typeof onUnmatchMutation === 'function') {
                    onUnmatchMutation(mutation, mutationId);
                  }
                }}
                disabled={!matched || isUnmatching}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-800 disabled:opacity-40'
                title={
                  matched
                    ? 'Lepaskan pencocokan'
                    : 'Mutasi belum memiliki dokumen terhubung'
                }
              >
                <XMarkIcon className='w-4 h-4 mr-1' />
                Unmatch
              </button>

              <button
                type='button'
                onClick={() => {
                  if (typeof onValidateMutation === 'function') {
                    onValidateMutation(mutation, mutationId);
                  }
                }}
                disabled={isValidating}
                className='inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40'
              >
                <CheckBadgeIcon className='w-4 h-4 mr-1' />
                Validasi
              </button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
    ];
  }, [
    mutations,
    onMatchMutation,
    onSelectAllMutations,
    onSelectMutation,
    onUnmatchMutation,
    onValidateMutation,
    onViewMutation,
    selectedMutationIds,
    isMatching,
    isUnmatching,
    isValidating,
  ]);

  const table = useReactTable({
    ...tableOptions,
    columns: tableColumns,
  });

  const summaryData = useMemo(() => {
    const meta = queryResult?.data?.meta;
    if (!meta) {
      return null;
    }

    const summary =
      meta.summary || meta.appliedFilters?.summary || meta.stats || null;

    if (!summary || typeof summary !== 'object') {
      return null;
    }

    return summary;
  }, [queryResult?.data?.meta]);

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm'>
      <div className='p-4 border-b border-gray-200 overflow-x-auto'>
        <TabContainer
          activeTab={activeTab}
          onTabChange={onTabChange}
          size='sm'
          variant='underline'
          className='min-w-max'
        >
          {TAB_ORDER.map((tabId) => {
            const config = TAB_STATUS_CONFIG[tabId] || { label: tabId };
            return (
              <Tab
                key={tabId}
                id={tabId}
                label={config.label}
              />
            );
          })}
        </TabContainer>
      </div>

      {summaryData ? (() => {
        const summaryEntries = Object.entries(summaryData).filter(([key, value]) => {
          const normalizedKey = String(key).toLowerCase();
          if (normalizedKey.includes('breakdown')) {
            return false;
          }
          return !isPlainObject(value);
        });

        if (summaryEntries.length === 0) {
          return null;
        }

        return (
        <div className='px-4 py-3 border-b border-gray-200 bg-gray-50'>
          <div className='flex flex-wrap gap-3'>
            {summaryEntries.map(([key, value]) => (
              <div
                key={key}
                className='px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm'
              >
                <div className='text-xs uppercase tracking-wide text-gray-500'>
                  {key.replace(/[_-]/g, ' ')}
                </div>
                <div className='text-base font-semibold text-gray-900'>
                  {formatSummaryValue(key, value)}
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })() : null}

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        emptyMessage='Belum ada mutasi bank.'
        emptyFilteredMessage='Tidak ditemukan mutasi sesuai filter.'
      />

      <DataTablePagination table={table} pagination={pagination} itemLabel='mutasi' />
    </div>
  );
};

export default MutasiBankTableServerSide;
