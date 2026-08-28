import React, { useMemo, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
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
import { DataTable, TableFooterCell } from '../table';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import DateFilter from '../common/DateFilter';
import RangeColumnFilter from '../common/RangeColumnFilter';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import TextColumnFilter from '../common/TextColumnFilter';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import MutasiBankExportPreviewModal from './MutasiBankExportPreviewModal';
import toastService from '../../services/toastService';
import mutasiBankService from '../../services/mutasiBankService';
import customerService from '../../services/customerService';

const STATUS_OPTIONS = [
  { id: 'MATCHED', name: 'Match' },
  { id: 'UNMATCHED', name: 'Unmatched' },
];

const HAS_DOCUMENT_OPTIONS = [
  { id: 'true', name: 'Ada Dokumen' },
  { id: 'false', name: 'Belum Ada Dokumen' },
];

const columnHelper = createColumnHelper();

const resolveMutationId = (mutation) => {
  return mutation?.id ?? null;
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toUpperCase() : '';

  if (value === 'MATCHED' || value === 'VALID' || value === 'MATCH') {
    return 'success';
  }
  if (value === 'UNMATCHED' || value === 'INVALID') {
    return 'warning';
  }
  return 'secondary';
};

const resolveStatusLabel = (status) => {
  const value = typeof status === 'string' ? status.toUpperCase() : '';

  if (value === 'MATCHED' || value === 'VALID' || value === 'MATCH') {
    return 'Match';
  }
  if (value === 'UNMATCHED' || value === 'INVALID') {
    return 'Unmatched';
  }
  return status || '-';
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

const resolveCustomer = (mutation) => {
  if (mutation?.customer) {
    return {
      name: mutation.customer.namaCustomer,
      code: mutation.customer.kodeCustomer,
    };
  }

  const invCust = mutation?.invoicePenagihan?.purchaseOrder?.customer;
  if (invCust) {
    return {
      name: invCust.namaCustomer,
      code: invCust.kodeCustomer,
    };
  }

  const ttfCust = mutation?.tandaTerimaFaktur?.invoicePenagihan?.purchaseOrder?.customer;
  if (ttfCust) {
    return {
      name: ttfCust.namaCustomer,
      code: ttfCust.kodeCustomer,
    };
  }

  const groupCust = mutation?.tandaTerimaFaktur?.groupCustomer;
  if (groupCust) {
    return {
      name: groupCust.nama_group,
      code: groupCust.kode_group,
    };
  }

  return null;
};

const resolveMatchedDocument = (mutation) => {
  const invoicePenagihan = mutation?.invoicePenagihan;
  const invoicePengiriman = mutation?.invoicePengiriman;
  const tandaTerimaFaktur = mutation?.tandaTerimaFaktur;

  if (invoicePenagihan?.no_invoice_penagihan) {
    return {
      type: 'Invoice Penagihan',
      number: invoicePenagihan.no_invoice_penagihan,
      amount: invoicePenagihan.grand_total || invoicePenagihan.grandTotal || null,
    };
  }

  if (tandaTerimaFaktur?.invoicePenagihan?.no_invoice_penagihan) {
    return {
      type: 'Tanda Terima Faktur',
      number: tandaTerimaFaktur.invoicePenagihan.no_invoice_penagihan,
      amount: tandaTerimaFaktur.grand_total || tandaTerimaFaktur.totalAmount || null,
    };
  }

  if (invoicePengiriman?.no_invoice) {
    return {
      type: 'Invoice Pengiriman',
      number: invoicePengiriman.no_invoice,
      amount: invoicePengiriman.grand_total || invoicePengiriman.grandTotal || null,
    };
  }

  if (invoicePenagihan) {
    return {
      type: 'Invoice Penagihan',
      number: invoicePenagihan.no_invoice_penagihan || invoicePenagihan.id || '',
      amount: invoicePenagihan.grand_total || null,
    };
  }

  if (tandaTerimaFaktur) {
    return {
      type: 'Tanda Terima Faktur',
      number: tandaTerimaFaktur.id || '',
      amount: tandaTerimaFaktur.grand_total || null,
    };
  }

  if (invoicePengiriman) {
    return {
      type: 'Invoice Pengiriman',
      number: invoicePengiriman.no_invoice || invoicePengiriman.id || '',
      amount: invoicePengiriman.grand_total || null,
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

const MutasiBankTableServerSide = forwardRef(({
  filters = {},
  onViewMutation,
  onValidateMutation,
  onAssignDocument,
  onUnassignDocument,
  isValidating = false,
  isAssigning = false,
  isUnassigning = false,
  initialPage = 1,
  initialLimit = 999999,
}, ref) => {
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const {
    data: mutations,
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
        const mappedFilters = { ...sanitized };

        if (columnFilters) {
          if (columnFilters.transaction_date) {
            mappedFilters.tanggal_start = columnFilters.transaction_date.from;
            mappedFilters.tanggal_end = columnFilters.transaction_date.to;
          }
          if (columnFilters.amount) {
            mappedFilters.min_amount = columnFilters.amount.min;
            mappedFilters.max_amount = columnFilters.amount.max;
          }
          if (columnFilters.validation_status) {
            mappedFilters.validation_status = columnFilters.validation_status;
          }
          if (columnFilters.invoice_number) {
            if (Array.isArray(columnFilters.invoice_number)) {
              if (columnFilters.invoice_number.length === 1) {
                mappedFilters.has_document = columnFilters.invoice_number[0];
              }
            } else if (columnFilters.invoice_number !== '') {
              mappedFilters.has_document = columnFilters.invoice_number;
            }
          }
          if (columnFilters.description) {
            mappedFilters.description = columnFilters.description;
          }
          if (columnFilters.customer) {
            if (Array.isArray(columnFilters.customer)) {
              if (columnFilters.customer.length > 0) {
                mappedFilters.customer = columnFilters.customer;
              }
            } else if (columnFilters.customer !== '') {
              mappedFilters.customer = columnFilters.customer;
            }
          }
          if (columnFilters.validation_notes) {
            mappedFilters.validation_notes = columnFilters.validation_notes;
          }
          if (columnFilters.matched_document) {
            mappedFilters.has_document = columnFilters.matched_document;
          }
        }

        return {
          ...rest,
          filters: mappedFilters,
        };
      },
      [filters]
    ),
  });

  const activeQueryFilters = useMemo(() => {
    const state = tableOptions?.state?.columnFilters || [];
    const filterObj = {};
    state.forEach((f) => {
      filterObj[f.id] = f.value;
    });
    return filterObj;
  }, [tableOptions?.state?.columnFilters]);

  const handleConfirmExport = async () => {
    try {
      setShowExportConfirmation(false);
      toastService.info('Mengunduh file Excel...');

      const blob = await mutasiBankService.exportExcel(activeQueryFilters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Mutasi_Bank_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toastService.success('Berhasil mendownload Excel Mutasi Bank');
    } catch (err) {
      console.error('Error exporting excel:', err);
      toastService.error('Gagal memproses export excel');
    }
  };

  const handleConfirmPreview = async () => {
    setShowPreviewModal(true);
    setPreviewLoading(true);
    try {
      const res = await mutasiBankService.previewExportExcel(activeQueryFilters);
      setPreviewData(res);
    } catch (err) {
      console.error('Error loading preview:', err);
      toastService.error('Gagal memuat preview data excel');
    } finally {
      setPreviewLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openExportDialog: () => {
      setShowExportConfirmation(true);
    },
    openPreviewDialog: () => {
      handleConfirmPreview();
    },
  }));

  const dynamicStatusOptions = useMemo(() => {
    const map = new Map();
    (mutations || []).forEach((item) => {
      const code = item.validation_status ? String(item.validation_status).toUpperCase() : null;
      if (code) {
        const fallback = STATUS_OPTIONS.find((s) => s.id === code);
        const name = fallback?.name || (code === 'MATCHED' ? 'Match' : code === 'UNMATCHED' ? 'Unmatched' : code);
        if (!map.has(code)) {
          map.set(code, { id: code, name });
        }
      }
    });

    const activeFilter = tableOptions?.state?.columnFilters?.find((f) => f.id === 'validation_status');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = STATUS_OPTIONS.find((s) => s.id === val);
        map.set(val, { id: val, name: fallback?.name || val });
      }
    });

  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 9999);
        const data = response?.data?.data || response?.data?.customers || response?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const dynamicCustomerOptions = useMemo(() => {
    const map = new Map();

    (mutations || []).forEach((item) => {
      const resolved = resolveCustomer(item);
      const id = item.customerId || item.customer?.id || resolved?.code || resolved?.name;
      const name = resolved?.name ? (resolved.code ? `${resolved.name} (${resolved.code})` : resolved.name) : null;
      if (id && name && !map.has(id)) {
        map.set(id, { id, name });
      }
    });

    (customers || []).forEach((c) => {
      const id = c.id || c.kodeCustomer;
      const name = c.namaCustomer ? (c.kodeCustomer ? `${c.namaCustomer} (${c.kodeCustomer})` : c.namaCustomer) : null;
      if (id && name && !map.has(id)) {
        map.set(id, { id, name });
      }
    });

    const activeFilter = tableOptions?.state?.columnFilters?.find((f) => f.id === 'customer');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = customers.find((c) => c.id === val || c.kodeCustomer === val || c.namaCustomer === val);
        const name = fallback ? `${fallback.namaCustomer} (${fallback.kodeCustomer})` : val;
        map.set(val, { id: val, name });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [mutations, customers, tableOptions?.state?.columnFilters]);

  const tableColumns = useMemo(() => {
    return [
      columnHelper.accessor(
        (row) => row.tanggal_transaksi || null,
        {
          id: 'transaction_date',
          header: ({ column }) => {
            const filterValue = column.getFilterValue() || { from: '', to: '' };
            return (
              <div className='space-y-0.5'>
                <div className='font-medium text-[11px]'>Tanggal</div>
                <div className='flex flex-col gap-0.5'>
                  <DateFilter
                    value={filterValue.from ?? ''}
                    onChange={(val) => { column.setFilterValue({ ...filterValue, from: val }); setPage(1); }}
                    placeholder="Dari"
                  />
                  <DateFilter
                    value={filterValue.to ?? ''}
                    onChange={(val) => { column.setFilterValue({ ...filterValue, to: val }); setPage(1); }}
                    placeholder="Sampai"
                  />
                </div>
              </div>
            );
          },
          size: 140,
          cell: (info) => {
            const value = info.getValue();
            return value ? formatDate(value) : '-';
          },
          enableSorting: true,
        }
      ),
      columnHelper.accessor(
        (row) => row.keterangan || '',
        {
          id: 'description',
          header: ({ column }) => (
            <div className='space-y-0.5' onClick={(e) => e.stopPropagation()}>
              <div className='font-medium text-[11px]'>Deskripsi</div>
              <TextColumnFilter column={column} placeholder="Filter..." />
            </div>
          ),
          size: 250,
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
      columnHelper.display({
        id: 'customer',
        header: ({ column }) => (
          <div className='space-y-0.5 max-w-[160px]' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-[11px]'>Customer</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicCustomerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='All'
              displayKey='name'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
              sx={{ minWidth: '130px' }}
            />
          </div>
        ),
        size: 180,
        cell: ({ row }) => {
          const customer = resolveCustomer(row.original);
          if (!customer?.name) return <span className='text-xs text-gray-400'>-</span>;
          return (
            <div className='text-xs leading-tight font-medium text-gray-800'>
              {customer.name} {customer.code ? <span className='text-gray-500 font-normal'>({customer.code})</span> : null}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'invoice_number',
        header: ({ column }) => (
          <div className='space-y-0.5 max-w-[130px]' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-[11px]'>No Invoice</div>
            <AutocompleteCheckboxLimitTag
              options={HAS_DOCUMENT_OPTIONS}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='Semua'
              displayKey='name'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
              sx={{ minWidth: '110px' }}
            />
          </div>
        ),
        size: 210,
        minSize: 180,
        cell: ({ row }) => {
          const matched = resolveMatchedDocument(row.original);
          if (!matched) {
            return <span className='text-xs text-gray-400'>-</span>;
          }
          return (
            <div
              className='text-xs font-semibold text-gray-900 truncate'
              title={`${matched.type}: ${matched.number}`}
            >
              {matched.number || '-'}
            </div>
          );
        },
      }),
      columnHelper.accessor(
        (row) => Number(row.jumlah || 0),
        {
          id: 'amount',
          header: ({ column }) => (
            <div className='space-y-0.5'>
              <div className='font-medium text-[11px]'>Nominal</div>
              <RangeColumnFilter column={column} setPage={setPage} />
            </div>
          ),
          size: 150,
          cell: (info) => formatCurrency(info.getValue() || 0),
          enableSorting: true,
        }
      ),
      columnHelper.accessor(
        (row) => row.validation_notes || '',
        {
          id: 'validation_notes',
          header: ({ column }) => (
            <div className='space-y-0.5' onClick={(e) => e.stopPropagation()}>
              <div className='font-medium text-[11px]'>Keterangan</div>
              <TextColumnFilter column={column} placeholder="Filter..." />
            </div>
          ),
          size: 200,
          cell: (info) => {
            const value = info.getValue() || '-';
            return (
              <div className='w-full truncate text-gray-600' title={value !== '-' ? value : ''}>
                {value}
              </div>
            );
          },
        }
      ),
      columnHelper.display({
        id: 'validation_status',
        header: ({ column }) => (
          <div className='space-y-0.5 max-w-[120px]' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-[11px]'>Status</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicStatusOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='All'
              displayKey='name'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
              sx={{ minWidth: '100px' }}
            />
          </div>
        ),
        size: 150,
        cell: ({ row }) => {
          const rawStatus = row.original.validation_status || '-';
          const label = resolveStatusLabel(rawStatus);
          const variant = resolveStatusVariant(rawStatus);
          return (
            <StatusBadge status={label} variant={variant} size='xs' />
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        size: 90,
        cell: ({ row }) => {
          const mutation = row.original;
          const mutationId = resolveMutationId(mutation);
          const hasDocument = hasAssignedDocument(mutation);

          return (
            <div className='flex items-center justify-left gap-1'>
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
                </button>
              ) : null}

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
    dynamicStatusOptions,
    dynamicCustomerOptions,
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
          tableClassName='min-w-[1390px] w-full divide-y divide-gray-200 text-xs table-fixed'
          headerRowClassName='bg-gray-50'
          headerCellClassName='px-2.5 py-1.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider'
          bodyClassName='divide-y divide-gray-100 bg-white'
          rowClassName='hover:bg-gray-50 transition-colors'
          cellClassName='px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900'
          emptyCellClassName='px-3 py-6 text-center text-xs text-gray-500'
          footerRowClassName={`bg-gray-200 font-bold sticky bottom-0 ${(pagination?.totalItems || 0) > 0 ? 'z-10' : 'z-0'}`}
          footerContent={
            <tr>
              {table.getVisibleLeafColumns().map((column) => {
                const isFirst = column.id === 'transaction_date';
                const isAmount = column.id === 'amount';
                return (
                  <td key={column.id} className="px-2.5 py-1 text-xs border-t border-gray-300 text-center font-bold">
                    {isFirst ? (
                      <span className="text-gray-700 uppercase font-semibold">Total</span>
                    ) : isAmount ? (
                      <TableFooterCell column={column} table={table} />
                    ) : null}
                  </td>
                );
              })}
            </tr>
          }
        />
      </div>

      {/* Export Confirmation Dialog */}
      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={handleConfirmExport}
        title="Export Excel Mutasi Bank"
        message="Apakah Anda yakin ingin meng-export data mutasi bank ke Excel berdasarkan filter saat ini?"
        confirmText="Export Excel"
        cancelText="Batal"
        type="info"
      />

      {/* Excel Preview Modal */}
      <MutasiBankExportPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        previewData={previewData}
        previewLoading={previewLoading}
        onExport={handleConfirmExport}
      />
    </div>
  );
});

MutasiBankTableServerSide.displayName = 'MutasiBankTableServerSide';

export default MutasiBankTableServerSide;
