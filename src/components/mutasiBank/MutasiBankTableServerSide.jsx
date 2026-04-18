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



const resolveMutationId = (mutation) => {
  return mutation?.id ?? null;
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
  const type = mutation?.mutation_type || '';
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
    mutation?.invoicePenagihanId ||
    mutation?.invoicePengirimanId ||
    mutation?.tandaTerimaFakturId
  );
};

const resolveMatchedDocument = (mutation) => {
  const invoicePenagihan = mutation?.invoicePenagihan;
  const invoicePengiriman = mutation?.invoicePengiriman;
  const tandaTerimaFaktur = mutation?.tandaTerimaFaktur;

  if (invoicePenagihan) {
    return {
      type: 'Invoice Penagihan',
      number: invoicePenagihan.id || invoicePenagihan.nomor_invoice || '',
      amount: invoicePenagihan.grandTotal || null,
    };
  }

  if (invoicePengiriman) {
    return {
      type: 'Invoice Pengiriman',
      number: invoicePengiriman.id || invoicePengiriman.nomor_invoice || '',
      amount: invoicePengiriman.grandTotal || null,
    };
  }

  if (tandaTerimaFaktur) {
    return {
      type: 'Tanda Terima Faktur',
      number: tandaTerimaFaktur.id || tandaTerimaFaktur.nomor_ttf || '',
      amount: tandaTerimaFaktur.totalAmount || null,
    };
  }

  return null;
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
        (row) => row.tanggal_transaksi || null,
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
        (row) => row.keterangan || '',
        {
          id: 'description',
          header: 'Deskripsi',
          size: 410,
          cell: (info) => {
            const value = info.getValue() || '-';
            return (
              <div className='w-full truncate' title={value !== '-' ? value : ''}>
                {value}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => Number(row.jumlah || 0),
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
          const status = row.original.validation_status || '-';
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
        size: 160,
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
