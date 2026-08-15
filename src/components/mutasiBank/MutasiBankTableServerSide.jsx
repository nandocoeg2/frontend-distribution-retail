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
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import toastService from '../../services/toastService';
import mutasiBankService from '../../services/mutasiBankService';

const STATUS_OPTIONS = [
  { id: 'MATCHED', name: 'Matched' },
  { id: 'UNMATCHED', name: 'Unmatched' },
];

const HAS_DOCUMENT_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'true', label: 'Ada Dokumen' },
  { value: 'false', label: 'Belum Ada Dokumen' },
];

const columnHelper = createColumnHelper();



const resolveMutationId = (mutation) => {
  return mutation?.id ?? null;
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toUpperCase() : '';

  if (value === 'MATCHED') {
    return 'success';
  }
  if (value === 'UNMATCHED') {
    return 'warning';
  }
  return 'secondary';
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
  const [localFilters, setLocalFilters] = useState({
    tanggal: '',
    customer: '',
    keterangan: '',
    invoice: '',
    jumlah: '',
    status: '',
  });

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
        (row) => row.customer?.namaCustomer || '',
        {
          id: 'customer',
          header: 'Customer',
          size: 180,
          cell: ({ row }) => {
            const customer = row.original.customer;
            if (!customer) return <span className='text-xs text-gray-400'>-</span>;
            return (
              <div className='text-xs leading-tight font-medium text-gray-800'>
                {customer.namaCustomer} <span className='text-gray-500 font-normal'>({customer.kodeCustomer})</span>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor(
        (row) => row.keterangan || '',
        {
          id: 'description',
          header: 'Deskripsi',
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
        id: 'invoice_number',
        header: ({ column }) => (
          <div className='space-y-0.5'>
            <div className='font-medium text-[11px]'>No Invoice</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            >
              {HAS_DOCUMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ),
        size: 140,
        cell: ({ row }) => {
          const matched = resolveMatchedDocument(row.original);
          if (!matched) {
            return <span className='text-xs text-gray-400'>-</span>;
          }
          return (
            <div className='text-xs font-semibold text-gray-900' title={`${matched.type}: ${matched.number}`}>
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
          header: 'Keterangan (Retur/Rebate)',
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
              options={STATUS_OPTIONS}
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
          const status = row.original.validation_status || '-';
          return (
            <StatusBadge status={status} variant={resolveStatusVariant(status)} size='xs' />
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

  const filteredPreviewData = useMemo(() => {
    if (!previewData || !previewData.data) return [];
    return previewData.data
      .map((row) => ({
        tanggal: row[0] || '',
        customer: row[1] || '',
        keterangan: row[2] || '',
        invoice: row[3] || '',
        jumlah: String(row[4] || ''),
        notes: row[5] || '',
        raw: row,
      }))
      .filter((item) => {
        let matchTanggal = true;
        if (localFilters.tanggal) {
          // Format selected date (YYYY-MM-DD) to compare with formatted date or raw date
          const selectedDateStr = localFilters.tanggal; // e.g. "2026-06-12"
          const itemDateStr = String(item.tanggal);
          matchTanggal = itemDateStr.includes(selectedDateStr) ||
            new Date(selectedDateStr).toLocaleDateString('id-ID') === itemDateStr ||
            new Date(selectedDateStr).toLocaleDateString('en-GB') === itemDateStr;
        }
        const matchCustomer = !localFilters.customer || String(item.customer).toLowerCase().includes(localFilters.customer.toLowerCase());
        const matchKeterangan = !localFilters.keterangan || String(item.keterangan).toLowerCase().includes(localFilters.keterangan.toLowerCase());
        const matchInvoice = !localFilters.invoice || String(item.invoice).toLowerCase().includes(localFilters.invoice.toLowerCase());
        const matchJumlah = !localFilters.jumlah || String(item.jumlah).toLowerCase().includes(localFilters.jumlah.toLowerCase());
        return matchTanggal && matchCustomer && matchKeterangan && matchInvoice && matchJumlah;
      });
  }, [previewData, localFilters]);

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
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" onClick={() => setShowPreviewModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border border-gray-100">
              <div className="bg-white px-6 pt-6 pb-4 sm:pb-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                    <span className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Preview Hasil Export Excel Mutasi Bank
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Menyiapkan preview data...</p>
                  </div>
                ) : !previewData || previewData.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900">Tidak ada data untuk diexport</p>
                    <p className="text-xs text-gray-500 mt-1">Silakan sesuaikan filter pencarian Anda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh] border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {previewData.headers?.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-100/50">
                          <th className="px-3 py-1.5 border-b border-gray-200">
                            <input
                              type="date"
                              value={localFilters.tanggal}
                              onChange={(e) => setLocalFilters({ ...localFilters, tanggal: e.target.value })}
                              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                            />
                          </th>
                          <th className="px-3 py-1.5 border-b border-gray-200">
                            <input
                              type="text"
                              value={localFilters.customer}
                              onChange={(e) => setLocalFilters({ ...localFilters, customer: e.target.value })}
                              placeholder="Filter Customer..."
                              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                            />
                          </th>
                          <th className="px-3 py-1.5 border-b border-gray-200">
                            <input
                              type="text"
                              value={localFilters.keterangan}
                              onChange={(e) => setLocalFilters({ ...localFilters, keterangan: e.target.value })}
                              placeholder="Filter Deskripsi..."
                              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                            />
                          </th>
                          <th className="px-3 py-1.5 border-b border-gray-200">
                            <input
                              type="text"
                              value={localFilters.invoice}
                              onChange={(e) => setLocalFilters({ ...localFilters, invoice: e.target.value })}
                              placeholder="Filter Invoice..."
                              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                            />
                          </th>
                          <th className="px-3 py-1.5 border-b border-gray-200">
                            <input
                              type="text"
                              value={localFilters.jumlah}
                              onChange={(e) => setLocalFilters({ ...localFilters, jumlah: e.target.value })}
                              placeholder="Filter Nominal..."
                              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                            />
                          </th>
                          <th className="px-3 py-1.5 border-b border-gray-200"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredPreviewData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium bg-gray-50/50">
                              Tidak ada data yang cocok dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewData.map((item, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-50/70 transition-colors odd:bg-white even:bg-gray-50/30">
                              <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{item.tanggal}</td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{item.customer}</td>
                              <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate" title={item.keterangan}>{item.keterangan}</td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-mono">{item.invoice}</td>
                              <td className="px-4 py-2.5 text-gray-900 font-semibold whitespace-nowrap text-right pr-4">{formatCurrency(Number(item.jumlah) || 0)}</td>
                              <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{item.notes || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <div>
                    Menampilkan <span className="font-semibold text-gray-700">{filteredPreviewData.length}</span> dari <span className="font-semibold text-gray-700">{previewData?.totalItems || 0}</span> total baris.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleConfirmExport}
                      disabled={!previewData || previewData.data?.length === 0}
                      className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MutasiBankTableServerSide.displayName = 'MutasiBankTableServerSide';

export default MutasiBankTableServerSide;
