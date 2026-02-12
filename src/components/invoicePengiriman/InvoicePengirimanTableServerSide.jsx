import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  TrashIcon,
  PrinterIcon,
  DocumentPlusIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import { useInvoicePengirimanQuery } from '../../hooks/useInvoicePengirimanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable } from '../table';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import PdfPreviewModal from '../common/PdfPreviewModal';
import toastService from '../../services/toastService';
import authService from '../../services/authService';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';
import RangeColumnFilter from '../common/RangeColumnFilter';

const columnHelper = createColumnHelper();

const getStatusVariant = (status) => {
  const value = (status?.status_name || status?.status_code || '').toLowerCase();
  if (value.includes('paid') || value.includes('completed') || value.includes('sudah') || value.includes('terkirim')) return 'success';
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
  onBulkDelete,
  deleteLoading = false,
  selectedInvoices = [],
  onSelectInvoice,
  onSelectAllInvoices,
  hasSelectedInvoices = false,
  initialPage = 1,
  initialLimit = 9999,
  onViewDetail,
  selectedInvoiceId,
  onExportExcel,
  exportLoading = false,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customers, setCustomers] = useState([]);

  // PDF Preview states
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('document.pdf');

  // Fetch customers for autocomplete filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100, { hasInvoicePengiriman: true });
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

      // Call backend API to get bulk HTML
      const html = await invoicePengirimanService.exportInvoicePengirimanBulk(selectedInvoices);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Invoice Pengiriman Preview (${selectedInvoices.length} dokumen)`);
      setPreviewFileName(`invoice-pengiriman-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success(`Berhasil memproses ${selectedInvoices.length} invoice.`);
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

  const handleBulkDeleteInvoice = async () => {
    if (!selectedInvoices || selectedInvoices.length === 0) {
      toastService.error('Tidak ada invoice yang dipilih');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await invoicePengirimanService.bulkDeleteInvoicePengiriman(selectedInvoices);

      if (result?.success) {
        const { deletedCount, failedIds } = result.data || {};
        if (failedIds && failedIds.length > 0) {
          toastService.warning(`Berhasil menghapus ${deletedCount} invoice. ${failedIds.length} gagal dihapus.`);
        } else {
          toastService.success(`Berhasil menghapus ${deletedCount} invoice.`);
        }
        // Trigger refresh via parent callback
        if (onBulkDelete) {
          onBulkDelete(selectedInvoices);
        }
      } else {
        toastService.error('Gagal menghapus invoice');
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toastService.error(error?.response?.data?.error?.message || error.message || 'Gagal menghapus invoice');
    } finally {
      setIsDeleting(false);
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
      const companyId = authService.getCompanyData()?.id;
      const mappedFilters = { ...filters };

      if (companyId) {
        mappedFilters.companyId = companyId;
      }

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
    initialLimit: 9999,
    initialPage: 1,
    globalFilter: globalFilterConfig,
    getQueryParams,
    columnFilterDebounceMs: 0,
    storageKey: 'invoice-pengiriman', // Persist filter state to sessionStorage
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
      columnHelper.accessor('tanggal', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Tanggal</div>
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
        cell: (info) => <span className='text-xs text-gray-600'>{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor('no_invoice', {
        header: ({ column }) => (
          <div className='space-y-1'>
            <div className='font-medium text-xs'>No Invoice</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
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
            <TextColumnFilter column={column} placeholder="Filter..." />
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
      columnHelper.accessor('grand_total', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Jumlah</div>
              <RangeColumnFilter column={column} setPage={setPage} />
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
    ],
    [
      invoices,
      selectedInvoices,
      onSelectInvoice,
      onSelectAllInvoices,
      onView,
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
      {/* Toolbar - Always show Export Excel, conditionally show selection and filter actions */}
      <div className='flex justify-between items-center'>
        {/* Left side: Selection actions */}
        {hasSelectedInvoices ? (
          <div className='flex items-center gap-2'>
            <span className='text-xs font-medium text-blue-700'>{selectedInvoices.length} dipilih</span>
            <button onClick={handleBulkGenerateInvoicePenagihan} disabled={isGenerating} className='inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'>
              <DocumentPlusIcon className='h-3 w-3 mr-1' />{isGenerating ? '...' : 'Generate'}
            </button>
            <button onClick={handleBulkPrintInvoice} disabled={isPrinting} className='inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'>
              <PrinterIcon className='h-3 w-3 mr-1' />{isPrinting ? '...' : 'Print'}
            </button>
            <button onClick={handleBulkDeleteInvoice} disabled={isDeleting || deleteLoading} className='inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'>
              <TrashIcon className='h-3 w-3 mr-1' />{isDeleting ? '...' : 'Delete'}
            </button>
          </div>
        ) : <div />}

        {/* Right side: Export Excel and Reset Filter actions */}
        <div className='flex items-center gap-2'>
          {onExportExcel && (
            <button
              onClick={() => onExportExcel(tableOptions.state?.columnFilters || [])}
              disabled={exportLoading}
              className='inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
            >
              {exportLoading ? (
                <>
                  <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1' />
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className='h-3 w-3 mr-1' />
                  Export Excel
                </>
              )}
            </button>
          )}
          {hasActiveFilters && (
            <button onClick={resetFilters} className='px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50'>Reset Filter</button>
          )}
        </div>
      </div>


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
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
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
        footerRowClassName="bg-gray-200 font-bold sticky bottom-0 z-10"
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-1.5 py-1 text-xs border-t border-gray-300 text-center"
              >
                {pagination?.totalItems || 0}
              </td>
            ))}
          </tr>
        }
      />

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => {
          setPdfPreviewOpen(false);
          setPreviewHtmlContent(null);
        }}
        htmlContent={previewHtmlContent}
        title={previewTitle}
        fileName={previewFileName}
      />
    </div>
  );
};

export default InvoicePengirimanTableServerSide;
