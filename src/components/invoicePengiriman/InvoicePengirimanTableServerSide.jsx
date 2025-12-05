import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  TrashIcon,
  PrinterIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { useInvoicePengirimanQuery } from '../../hooks/useInvoicePengirimanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import toastService from '../../services/toastService';

const columnHelper = createColumnHelper();

const getStatusVariant = (status) => {
  const value = (status?.status_name || status?.status_code || '').toLowerCase();
  if (value.includes('paid') || value.includes('completed') || value.includes('sudah')) return 'success';
  if (value.includes('cancelled') || value.includes('failed')) return 'danger';
  if (value.includes('overdue')) return 'danger';
  if (value.includes('pending')) return 'secondary';
  return 'default';
};

// Status options for invoice pengiriman (use full status_code from database)
const STATUS_OPTIONS = [
  { id: 'PENDING INVOICE', name: 'Pending' },
  { id: 'TERKIRIM INVOICE PENGIRIMAN', name: 'Terkirim' },
  { id: 'CANCELLED INVOICE', name: 'Cancelled' },
];

// Print status options
const PRINT_STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'true', label: 'Sudah Diprint' },
  { value: 'false', label: 'Belum Diprint' },
];

const InvoicePengirimanTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedInvoices = [],
  onSelectInvoice,
  onSelectAllInvoices,
  hasSelectedInvoices = false,
  initialPage = 1,
  initialLimit = 10,
  onViewDetail,
  selectedInvoiceId,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customers, setCustomers] = useState([]);

  // Fetch customers for autocomplete filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100);
        const data = response?.data?.data || response?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const handleBulkPrintInvoice = async () => {
    if (!selectedInvoices || selectedInvoices.length === 0) {
      toastService.error('Tidak ada invoice yang dipilih');
      return;
    }

    setIsPrinting(true);
    try {
      toastService.info(`Memproses ${selectedInvoices.length} invoice...`);

      let successCount = 0;
      let failCount = 0;

      // Loop through selected invoices and fetch print HTML
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoiceId = selectedInvoices[i];

        try {
          // Call backend API to get HTML
          const html = await invoicePengirimanService.exportInvoicePengiriman(invoiceId);

          // Open HTML in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();

            // Wait for content to load, then trigger print dialog
            printWindow.onload = () => {
              printWindow.focus();
              // Auto print for first window, manual for others
              if (i === 0) {
                printWindow.print();
              }
            };

            successCount++;
          } else {
            failCount++;
            console.error(`Failed to open print window for invoice ${invoiceId}`);
          }

          // Small delay between opening windows to prevent browser blocking
          if (i < selectedInvoices.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          failCount++;
          console.error(`Error printing invoice ${invoiceId}:`, error);
        }
      }

      if (successCount > 0) {
        toastService.success(
          `Berhasil membuka ${successCount} invoice${failCount > 0 ? `. ${failCount} gagal.` : ''}`
        );
      } else {
        toastService.error('Gagal membuka invoice');
      }
    } catch (error) {
      console.error('Error in bulk print:', error);
      toastService.error(error.message || 'Gagal mencetak invoice');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBulkGenerateInvoicePenagihan = async () => {
    if (!selectedInvoices || selectedInvoices.length === 0) {
      toastService.error('Tidak ada invoice yang dipilih');
      return;
    }

    setIsGenerating(true);
    try {
      toastService.info(`Memproses ${selectedInvoices.length} invoice (membuat 3 dokumen per invoice)...`);

      let successCount = 0;
      let failCount = 0;
      const failedInvoices = [];

      // Loop through selected invoices and generate invoice penagihan
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoiceId = selectedInvoices[i];

        try {
          const response = await invoicePengirimanService.generateInvoicePenagihan(invoiceId);

          if (response?.success) {
            successCount++;
          } else {
            failCount++;
            failedInvoices.push({ id: invoiceId, error: response?.error?.message || 'Unknown error' });
          }
        } catch (error) {
          failCount++;
          let errorMessage = 'Unknown error';

          if (error?.response?.status === 409) {
            errorMessage = 'Invoice Penagihan sudah ada';
          } else if (error?.response?.status === 404) {
            errorMessage = 'Invoice tidak ditemukan';
          } else if (error?.response?.status === 400) {
            errorMessage = error?.response?.data?.error?.message || 'Data tidak valid';
          } else {
            errorMessage = 'Gagal membuat dokumen invoice';
          }

          failedInvoices.push({ id: invoiceId, error: errorMessage });
          console.error(`Error generating invoice penagihan for ${invoiceId}:`, error);
        }

        // Small delay between requests to prevent overwhelming the server
        if (i < selectedInvoices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Show results with enhanced messaging
      if (successCount > 0 && failCount === 0) {
        toastService.success(`✅ Berhasil membuat semua dokumen untuk ${successCount} invoice (Invoice Penagihan + Kwitansi + Faktur Pajak)`);
      } else if (successCount > 0 && failCount > 0) {
        toastService.warning(`✅ Berhasil membuat semua dokumen untuk ${successCount} invoice. ${failCount} gagal.`);
      } else {
        toastService.error('❌ Gagal membuat dokumen invoice');
      }

      // Log failed invoices for debugging
      if (failedInvoices.length > 0) {
        console.log('Failed invoices:', failedInvoices);
      }
    } catch (error) {
      console.error('Error in bulk generate:', error);
      toastService.error(error.message || 'Gagal membuat dokumen invoice');
    } finally {
      setIsGenerating(false);
    }
  };
  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  // Map frontend filter keys to backend parameters
  const getQueryParams = useMemo(
    () => ({ filters, ...rest }) => {
      const mappedFilters = { ...filters };

      // Handle customer filter (array of IDs)
      if (mappedFilters.customerIds) {
        if (Array.isArray(mappedFilters.customerIds) && mappedFilters.customerIds.length > 0) {
          // Keep as customerIds
        } else {
          delete mappedFilters.customerIds;
        }
      }

      // Handle status filter (array of codes)
      if (mappedFilters.status_codes) {
        if (Array.isArray(mappedFilters.status_codes) && mappedFilters.status_codes.length > 0) {
          // Keep as status_codes
        } else {
          delete mappedFilters.status_codes;
        }
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    },
    []
  );

  const {
    data: invoices,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useInvoicePengirimanQuery,
    selectData: (response) => response?.invoicePengiriman ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    getQueryParams,
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const isAllSelected =
            invoices.length > 0 && selectedInvoices.length === invoices.length;
          const isIndeterminate =
            selectedInvoices.length > 0 &&
            selectedInvoices.length < invoices.length;

          return (
            <input
              type='checkbox'
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={() => onSelectAllInvoices(invoices)}
              className='h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          );
        },
        cell: ({ row }) => (
          <input
            type='checkbox'
            checked={selectedInvoices.includes(row.original.id)}
            onChange={() => onSelectInvoice(row.original.id)}
            className='h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_invoice', {
        header: ({ column }) => (
          <div className='space-y-1'>
            <div className='font-medium text-xs'>No Invoice</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => (
          <div className='font-medium text-gray-900'>
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className='space-y-1'>
            <div className='font-medium text-xs'>No PO</div>
            <input
              type='text'
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder='Filter...'
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => (
          <div className='font-medium text-gray-900'>
            {info.getValue() || '-'}
          </div>
        ),
      }),
      columnHelper.accessor('purchaseOrder.customer.namaCustomer', {
        id: 'customerIds',
        header: ({ column }) => (
          <div className='space-y-0.5' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customers}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='All'
              displayKey='namaCustomer'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className='text-xs truncate'>{info.row.original.purchaseOrder?.customer?.namaCustomer || '-'}</span>,
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Tanggal</div>
              <div className='flex flex-col gap-0.5'>
                <input
                  type='date'
                  value={filterValue.from ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                  title='Dari tanggal'
                />
                <input
                  type='date'
                  value={filterValue.to ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                  title='Sampai tanggal'
                />
              </div>
            </div>
          );
        },
        cell: (info) => <span className='text-xs text-gray-600'>{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor('grand_total', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Jumlah</div>
              <div className='flex flex-col gap-0.5'>
                <input
                  type='number'
                  value={filterValue.min ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                  placeholder='Min'
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type='number'
                  value={filterValue.max ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                  placeholder='Max'
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          );
        },
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor('is_printed', {
        id: 'is_printed',
        header: ({ column }) => (
          <div className='space-y-0.5'>
            <div className='font-medium text-xs'>Print</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
              onClick={(e) => e.stopPropagation()}
            >
              {PRINT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ),
        cell: ({ row }) => {
          const isPrinted = row.original.is_printed;
          return (
            <StatusBadge
              dot={true}
              status={isPrinted ? 'Sudah Diprint' : 'Belum Diprint'}
              variant={isPrinted ? 'success' : 'secondary'}
              size='sm'
            />
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('updatedAt', {
        id: 'print_date',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Tgl Print</div>
              <div className='flex flex-col gap-0.5'>
                <input
                  type='date'
                  value={filterValue.from ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                  title='Dari tanggal'
                />
                <input
                  type='date'
                  value={filterValue.to ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                  className='w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500'
                  onClick={(e) => e.stopPropagation()}
                  title='Sampai tanggal'
                />
              </div>
            </div>
          );
        },
        cell: (info) => {
          const isPrinted = info.row.original.is_printed;
          return <span className='text-xs text-gray-600'>{isPrinted ? formatDateTime(info.getValue()) : '-'}</span>;
        },
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_codes',
        header: ({ column }) => (
          <div className='space-y-0.5 max-w-[120px]' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>Status</div>
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
        cell: (info) => {
          const status =
            info.row.original?.status || info.row.original?.statusPembayaran;
          const statusText = status?.status_name || status?.status_code;

          if (!statusText) {
            return <span className='text-sm text-gray-400'>-</span>;
          }

          return (
            <StatusBadge
              status={statusText}
              variant={getStatusVariant(status)}
              size='sm'
              dot
            />
          );
        },
        enableSorting: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className='flex justify-center space-x-2'>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id);
              }}
              disabled={deleteLoading}
              className='text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed'
              title='Delete'
            >
              <TrashIcon className='h-4 w-4' />
            </button>
          </div>
        ),
        enableSorting: false,
      }),
    ],
    [
      invoices,
      selectedInvoices,
      onSelectInvoice,
      onSelectAllInvoices,
      onView,
      onDelete,
      deleteLoading,
      setPage,
      customers,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const loading = isLoading || isFetching;

  return (
    <div className='space-y-2'>
      {(hasActiveFilters || hasSelectedInvoices) && (
        <div className='flex justify-between items-center'>
          {hasSelectedInvoices ? (
            <div className='flex items-center gap-2'>
              <span className='text-xs font-medium text-blue-700'>{selectedInvoices.length} dipilih</span>
              <button onClick={handleBulkGenerateInvoicePenagihan} disabled={isGenerating} className='inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'>
                <DocumentPlusIcon className='h-3 w-3 mr-1' />{isGenerating ? '...' : 'Generate'}
              </button>
              <button onClick={handleBulkPrintInvoice} disabled={isPrinting} className='inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'>
                <PrinterIcon className='h-3 w-3 mr-1' />{isPrinting ? '...' : 'Print'}
              </button>
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button onClick={resetFilters} className='px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50'>Reset Filter</button>
          )}
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage='Memuat...'
        emptyMessage='Tidak ada data'
        emptyFilteredMessage='Tidak ada data sesuai filter'
        tableClassName='min-w-full bg-white border border-gray-200 text-xs table-fixed'
        headerRowClassName='bg-gray-50'
        headerCellClassName='px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider'
        bodyClassName='divide-y divide-gray-100'
        rowClassName='hover:bg-gray-50 cursor-pointer h-7'
        getRowClassName={({ row }) => {
          if (selectedInvoiceId === row.original.id) return 'bg-blue-50 border-l-2 border-blue-500';
          if (selectedInvoices.includes(row.original.id)) return 'bg-green-50';
          return undefined;
        }}
        onRowClick={onViewDetail}
        cellClassName='px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900'
        emptyCellClassName='px-1.5 py-0.5 text-center text-gray-500'
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel='invoice pengiriman'
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default InvoicePengirimanTableServerSide;
