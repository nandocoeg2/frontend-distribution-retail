import React, { useMemo, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  CheckBadgeIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { useMutasiBankQuery } from '../../hooks/useMutasiBankQuery';
import { DataTable } from '../table';
import Pagination from '../common/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

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

const hasAssignedDocument = (mutation) => {
  return Boolean(
    getFirstAvailableValue(mutation, [
      'invoicePenagihanId',
      'invoice_penagihan_id',
      'invoicePengirimanId',
      'invoice_pengiriman_id',
      'tandaTerimaFakturId',
      'tanda_terima_faktur_id',
    ])
  );
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
  onViewMutation,
  onValidateMutation,
  onAssignDocument,
  onUnassignDocument,
  isValidating = false,
  isAssigning = false,
  isUnassigning = false,
  initialPage = 1,
  initialLimit = 10,
}) => {

  const {
    pagination,
    setPage,
    setLimit,
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
          size: 110,
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
          size: 350,
          cell: (info) => {
            const value = info.getValue() || '-';
            return (
              <div className='max-w-[350px] truncate' title={value !== '-' ? value : ''}>
                {value}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) =>
          Number(
            getFirstAvailableValue(row, ['amount', 'nominal', 'jumlah', 'total_amount']) ||
            0
          ),
        {
          id: 'amount',
          header: 'Nominal',
          size: 140,
          cell: (info) => formatCurrency(info.getValue() || 0),
        }
      ),
      columnHelper.display({
        id: 'mutation_type',
        header: 'Tipe',
        size: 80,
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
        size: 100,
        cell: ({ row }) => {
          const status =
            getFirstAvailableValue(row.original, [
              'validation_status',
              'validationStatus',
              'status',
            ]) || '-';
          return (
            <StatusBadge status={status} variant={resolveStatusVariant(status)} size='xs' />
          );
        },
      }),

      columnHelper.display({
        id: 'matched_document',
        header: 'Dokumen Cocok',
        size: 180,
        cell: ({ row }) => {
          const matched = resolveMatchedDocument(row.original);
          if (!matched) {
            return <span className='text-xs text-gray-400'>Belum ada</span>;
          }

          return (
            <div className='text-xs leading-tight'>
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
        size: 220,
        cell: ({ row }) => {
          const mutation = row.original;
          const mutationId = resolveMutationId(mutation);
          const hasDocument = hasAssignedDocument(mutation);

          return (
            <div className='flex items-center justify-end gap-1'>
              <button
                type='button'
                onClick={() => {
                  if (typeof onViewMutation === 'function') {
                    onViewMutation(mutation, mutationId);
                  }
                }}
                className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                title='Detail'
              >
                <EyeIcon className='w-3.5 h-3.5 mr-0.5' />
                Detail
              </button>

              {hasDocument ? (
                <button
                  type='button'
                  onClick={() => {
                    if (typeof onUnassignDocument === 'function') {
                      onUnassignDocument(mutation, mutationId);
                    }
                  }}
                  disabled={isUnassigning}
                  className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40'
                  title='Lepas kaitan dokumen'
                >
                  <XMarkIcon className='w-3.5 h-3.5 mr-0.5' />
                  Unbind
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => {
                    if (typeof onAssignDocument === 'function') {
                      onAssignDocument(mutation, mutationId);
                    }
                  }}
                  disabled={isAssigning}
                  className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40'
                  title='Kaitkan dokumen ke mutasi'
                >
                  <LinkIcon className='w-3.5 h-3.5 mr-0.5' />
                  Bind
                </button>
              )}

              <button
                type='button'
                onClick={() => {
                  if (typeof onValidateMutation === 'function') {
                    onValidateMutation(mutation, mutationId);
                  }
                }}
                disabled={isValidating}
                className='inline-flex h-7 items-center justify-center rounded border border-gray-200 px-2 text-xs text-gray-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40'
                title='Validasi'
              >
                <CheckBadgeIcon className='w-3.5 h-3.5 mr-0.5' />
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
    onValidateMutation,
    onViewMutation,
    onAssignDocument,
    onUnassignDocument,
    isValidating,
    isAssigning,
    isUnassigning,
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
    <div className='space-y-2'>
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
          <div className='flex flex-wrap gap-2 p-2 bg-gray-50 rounded border border-gray-200'>
            {summaryEntries.map(([key, value]) => (
              <div key={key} className='px-2 py-1 bg-white border border-gray-200 rounded text-xs'>
                <span className='text-gray-500'>{key.replace(/[_-]/g, ' ')}: </span>
                <span className='font-medium text-gray-900'>{formatSummaryValue(key, value)}</span>
              </div>
            ))}
          </div>
        );
      })() : null}

      <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
        <DataTable
          table={table}
          isLoading={isLoading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          emptyMessage='Belum ada mutasi bank.'
          emptyFilteredMessage='Tidak ditemukan mutasi sesuai filter.'
          wrapperClassName='overflow-x-auto'
          tableClassName='min-w-[1180px] w-full divide-y divide-gray-200 text-xs table-fixed'
          headerRowClassName='bg-gray-50'
          headerCellClassName='px-2.5 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider'
          bodyClassName='divide-y divide-gray-100 bg-white'
          rowClassName='hover:bg-gray-50 transition-colors'
          cellClassName='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'
          emptyCellClassName='px-3 py-6 text-center text-xs text-gray-500'
        />

        {!error && (
          <Pagination
            compact
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setPage(1);
              setLimit(nextLimit);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MutasiBankTableServerSide;
