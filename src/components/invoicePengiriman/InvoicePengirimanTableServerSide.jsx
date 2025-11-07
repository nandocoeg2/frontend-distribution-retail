import React, { useMemo, useState } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { useInvoicePengirimanQuery } from '../../hooks/useInvoicePengirimanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import toastService from '../../services/toastService';

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED INVOICE' },
  pending: { label: 'Pending', statusCode: 'PENDING INVOICE' },
  paid: { label: 'Paid', statusCode: 'PAID INVOICE' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE INVOICE' },
};

const getStatusVariant = (status) => {
  const value = (status?.status_name || status?.status_code || '').toLowerCase();
  if (value.includes('paid') || value.includes('completed')) return 'success';
  if (value.includes('cancelled') || value.includes('failed')) return 'danger';
  if (value.includes('overdue')) return 'danger';
  if (value.includes('pending')) return 'secondary';
  return 'default';
};

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
  activeTab = 'all',
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

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
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status', value: statusCode }];
  }, [activeTab]);

  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
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
    lockedFilters,
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
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          );
        },
        cell: ({ row }) => (
          <input
            type='checkbox'
            checked={selectedInvoices.includes(row.original.id)}
            onChange={() => onSelectInvoice(row.original.id)}
            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_invoice', {
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>No Invoice</div>
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
          <div className='space-y-2'>
            <div className='font-medium'>No PO</div>
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
        id: 'nama_customer',
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Customer</div>
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
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className='space-y-2'>
            <div className='font-medium'>Tanggal Invoice</div>
            <input
              type='date'
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('grand_total', {
        header: 'Jumlah',
        cell: (info) => formatCurrency(info.getValue()),
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'is_printed',
        header: 'Print',
        cell: ({ row }) => {
          const isPrinted = row.original.is_printed;
          return (
            <StatusBadge
              dot={true}
              status={isPrinted ? 'Sudah di Print' : 'Belum Print'}
              variant={isPrinted ? 'success' : 'secondary'}
              size='sm'
            />
          );
        },
        enableColumnFilter: false,
        enableSorting: true,
      }),
      columnHelper.accessor('updatedAt', {
        id: 'print_date',
        header: 'Tanggal Print',
        cell: (info) => {
          const isPrinted = info.row.original.is_printed;
          return isPrinted ? formatDateTime(info.getValue()) : '-';
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor('statusPembayaran.status_name', {
        id: 'status',
        header: ({ column }) => {
          const statusConfig = TAB_STATUS_CONFIG[activeTab];
          const isLocked = activeTab !== 'all' && statusConfig?.statusCode;

          return (
            <div className='space-y-2'>
              <div className='font-medium'>Status</div>
              {isLocked ? (
                <div className='w-full px-2 py-1 text-xs text-gray-700 bg-gray-100 border border-gray-300 rounded'>
                  {statusConfig?.label || 'N/A'}
                </div>
              ) : (
                <select
                  value={column.getFilterValue() ?? ''}
                  onChange={(event) => {
                    column.setFilterValue(event.target.value);
                    setPage(1);
                  }}
                  className='w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                  onClick={(event) => event.stopPropagation()}
                >
                  <option value=''>Semua</option>
                  <option value='CANCELLED INVOICE'>Cancelled</option>
                  <option value='PENDING INVOICE'>Pending</option>
                  <option value='PAID INVOICE'>Paid</option>
                  <option value='OVERDUE INVOICE'>Overdue</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => {
          const status = info.row.original?.statusPembayaran;
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
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className='flex justify-center space-x-2'>
            <button
              onClick={() => onView(row.original)}
              className='text-indigo-600 hover:text-indigo-900'
              title='Lihat detail'
            >
              <EyeIcon className='w-5 h-5' />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className='text-green-600 hover:text-green-900'
              title='Edit'
            >
              <PencilIcon className='w-5 h-5' />
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              disabled={deleteLoading}
              className='text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed'
              title='Delete'
            >
              <TrashIcon className='w-5 h-5' />
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
      onEdit,
      onDelete,
      deleteLoading,
      activeTab,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const loading = isLoading || isFetching;

  return (
    <div className='space-y-4'>
      {hasActiveFilters && (
        <div className='flex justify-end'>
          <button
            onClick={resetFilters}
            className='px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:text-gray-800 hover:bg-gray-50'
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {hasSelectedInvoices && (
        <div className='flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium text-blue-900'>
              {selectedInvoices.length} invoice dipilih
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={handleBulkPrintInvoice}
              disabled={isPrinting}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <PrinterIcon className='h-4 w-4' />
              <span>{isPrinting ? 'Mencetak...' : 'Print Invoice'}</span>
            </button>
          </div>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage='Memuat data invoice pengiriman...'
        emptyMessage='Tidak ada data invoice pengiriman.'
        emptyFilteredMessage='Tidak ada data yang sesuai dengan pencarian.'
        wrapperClassName='overflow-x-auto border border-gray-200 rounded-lg'
        tableClassName='min-w-full bg-white'
        headerRowClassName='bg-gray-50'
        headerCellClassName='px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider'
        bodyClassName='divide-y divide-gray-200'
        rowClassName='hover:bg-gray-50'
        getRowClassName={({ row }) =>
          selectedInvoices.includes(row.original.id)
            ? 'bg-blue-50 hover:bg-blue-100'
            : undefined
        }
        cellClassName='px-6 py-4 whitespace-nowrap text-sm text-gray-900'
        emptyCellClassName='px-6 py-4 text-center text-sm text-gray-500'
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
