import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  TrashIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useKwitansiQuery } from '../../hooks/useKwitansiQuery';
import { formatCurrency, formatDate } from '@/utils/formatUtils';
import kwitansiService from '../../services/kwitansiService';
import toastService from '../../services/toastService';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import PdfPreviewModal from '../common/PdfPreviewModal';
import { ConfirmationDialog, useConfirmationDialog } from '../ui/ConfirmationDialog';
import customerService from '../../services/customerService';
import authService from '../../services/authService';
import DateFilter from '../common/DateFilter';

const columnHelper = createColumnHelper();

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('paid')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('overdue')) {
    return 'danger';
  }

  if (value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const STATUS_OPTIONS = [
  { id: 'PENDING KWITANSI', name: 'Pending' },
  { id: 'PROCESSING KWITANSI', name: 'Processing' },
  { id: 'PAID KWITANSI', name: 'Paid' },
  { id: 'OVERDUE KWITANSI', name: 'Overdue' },
  { id: 'COMPLETED KWITANSI', name: 'Completed' },
  { id: 'CANCELLED KWITANSI', name: 'Cancelled' },
];

const resolveKwitansiId = (kwitansi) => {
  if (!kwitansi) {
    return null;
  }
  return kwitansi.id || kwitansi._id || kwitansi.uuid || null;
};

const KwitansiTableServerSide = ({
  onDelete,
  deleteLoading = false,
  initialPage = 1,
  initialLimit = 10,
  onRowClick,
  selectedKwitansiId,
  selectedKwitansis = [],
  onSelectKwitansi,
  hasSelectedKwitansis = false,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingPaket, setIsPrintingPaket] = useState(false);
  const [customers, setCustomers] = useState([]);

  // PDF Preview states
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('document.pdf');

  const {
    showDialog,
    hideDialog,
    setLoading,
    ConfirmationDialog: ConfirmationDialogComponent,
  } = useConfirmationDialog();

  // Fetch customers for multi-select filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100, { hasKwitansi: true });
        // Handle response format: { success: true, data: { data: [...] } }
        // After axios interceptor unwraps: { data: { data: [...] } } or { data: [...] }
        let data = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (response?.data?.customers) {
          data = response.data.customers;
        } else if (response?.customers) {
          data = response.customers;
        } else if (Array.isArray(response?.data)) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        }
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const getQueryParams = useMemo(
    () => ({ filters, ...rest }) => {
      const companyId = authService.getCompanyData()?.id;
      return {
        ...rest,
        filters: {
          ...filters,
          ...(companyId ? { companyId } : {}),
        },
      };
    },
    []
  );

  const {
    data: kwitansis,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
  } = useServerSideTable({
    queryHook: useKwitansiQuery,
    selectData: (response) => response?.kwitansis ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage: 1,
    initialLimit: 9999,
    globalFilter: globalFilterConfig,
    getQueryParams,
  });

  // Handler untuk select all toggle
  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageKwitansiIds = kwitansis
      .map((kwitansi) => resolveKwitansiId(kwitansi))
      .filter(Boolean);

    const allCurrentPageSelected = currentPageKwitansiIds.every((id) =>
      selectedKwitansis.includes(id)
    );

    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageKwitansiIds.forEach((id) => {
        if (selectedKwitansis.includes(id)) {
          onSelectKwitansi(id, false);
        }
      });
    } else {
      // Select all on current page
      currentPageKwitansiIds.forEach((id) => {
        if (!selectedKwitansis.includes(id)) {
          onSelectKwitansi(id, true);
        }
      });
    }
  }, [kwitansis, selectedKwitansis, onSelectKwitansi]);

  // Handler untuk print Kwitansi
  const handlePrintSelected = async () => {
    if (!selectedKwitansis || selectedKwitansis.length === 0) {
      toastService.error('Tidak ada kwitansi yang dipilih');
      return;
    }

    setIsPrinting(true);
    try {
      toastService.info(`Memproses ${selectedKwitansis.length} kwitansi...`);

      // Get companyId from the first selected kwitansi
      const firstKwitansiId = selectedKwitansis[0];
      const firstKwitansi = kwitansis.find(k => resolveKwitansiId(k) === firstKwitansiId);
      // Get company ID from authService
      const companyIdOverride = authService.getCompanyData()?.id;

      // Fallback to existing logic if needed
      const companyId = String(companyIdOverride || firstKwitansi?.invoicePenagihan?.purchaseOrder?.company?.id || 'cm3c5v8g60000356c35478440');

      const html = await kwitansiService.exportKwitansiBulk(selectedKwitansis, companyId);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Kwitansi Preview (${selectedKwitansis.length} dokumen)`);
      setPreviewFileName(`kwitansi-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success(`Berhasil memproses ${selectedKwitansis.length} kwitansi.`);

    } catch (error) {
      console.error('Error in bulk print kwitansi:', error);
      toastService.error(error.message || 'Gagal memproses kwitansi');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handler untuk print Kwitansi Paket
  const handlePrintPaketSelected = async () => {
    if (!selectedKwitansis || selectedKwitansis.length === 0) {
      toastService.error('Tidak ada kwitansi yang dipilih');
      return;
    }

    setIsPrintingPaket(true);
    try {
      toastService.info(`Memproses ${selectedKwitansis.length} kwitansi paket...`);

      // Get companyId from the first selected kwitansi or localStorage
      const firstKwitansiId = selectedKwitansis[0];
      const firstKwitansi = kwitansis.find(k => resolveKwitansiId(k) === firstKwitansiId);

      // Get company ID from authService
      const companyIdOverride = authService.getCompanyData()?.id;

      // Fallback to existing logic if needed
      const companyId = String(companyIdOverride || firstKwitansi?.invoicePenagihan?.purchaseOrder?.company?.id || 'cm3c5v8g60000356c35478440');

      const html = await kwitansiService.exportKwitansiPaketBulk(selectedKwitansis, companyId);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Kwitansi Paket Preview (${selectedKwitansis.length} dokumen)`);
      setPreviewFileName(`kwitansi-paket-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success(`Berhasil memproses ${selectedKwitansis.length} kwitansi paket.`);

    } catch (error) {
      console.error('Error in bulk print kwitansi paket:', error);
      toastService.error(error.message || 'Gagal memproses kwitansi paket');
    } finally {
      setIsPrintingPaket(false);
    }
  };

  const confirmBulkDelete = async () => {
    setLoading(true);
    try {
      const result = await kwitansiService.bulkDeleteKwitansi(selectedKwitansis);

      if (result.deletedCount > 0) {
        toastService.success(`Berhasil menghapus ${result.deletedCount} kwitansi.`);

        if (result.failedIds && result.failedIds.length > 0) {
          toastService.warning(`${result.failedIds.length} kwitansi gagal dihapus.`);
        }

        // Clear selection
        selectedKwitansis.forEach(id => {
          onSelectKwitansi(id, false);
        });

        // Refresh data
        setPage(1);
      } else {
        toastService.error('Gagal menghapus kwitansi.');
      }
    } catch (error) {
      console.error('Error in bulk delete kwitansi:', error);
      toastService.error(error.message || 'Gagal menghapus kwitansi');
    } finally {
      setLoading(false);
      hideDialog();
    }
  };

  const handleBulkDelete = () => {
    if (!selectedKwitansis || selectedKwitansis.length === 0) {
      toastService.error('Tidak ada kwitansi yang dipilih');
      return;
    }

    showDialog({
      title: 'Hapus Kwitansi',
      message: `Apakah Anda yakin ingin menghapus ${selectedKwitansis.length} kwitansi yang dipilih? Data yang dihapus tidak dapat dikembalikan.`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: confirmBulkDelete
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const currentPageKwitansiIds = kwitansis
            .map((kwitansi) => resolveKwitansiId(kwitansi))
            .filter(Boolean);

          const isAllSelected =
            kwitansis.length > 0 &&
            currentPageKwitansiIds.length > 0 &&
            currentPageKwitansiIds.every((id) => selectedKwitansis.includes(id));

          const isIndeterminate =
            currentPageKwitansiIds.some((id) => selectedKwitansis.includes(id)) &&
            !isAllSelected;

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAllInternalToggle}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        cell: ({ row }) => {
          const kwitansiId = resolveKwitansiId(row.original);
          return (
            <input
              type="checkbox"
              checked={selectedKwitansis.includes(kwitansiId)}
              onChange={() =>
                onSelectKwitansi(kwitansiId, !selectedKwitansis.includes(kwitansiId))
              }
              onClick={(e) => e.stopPropagation()}
              disabled={!kwitansiId}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-1">
              <div className="font-medium text-xs">Tanggal</div>
              <div className="flex flex-col gap-0.5">
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
        cell: (info) => (
          <div className="text-xs text-gray-900">
            {formatDate(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('invoicePenagihan.no_invoice_penagihan', {
        id: 'no_invoice_penagihan',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No Invoice</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const invoicePenagihan = info.row.original?.invoicePenagihan;
          return (
            <div>
              <div className="text-xs font-medium text-gray-900">
                {invoicePenagihan?.no_invoice_penagihan || '-'}
              </div>
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('no_kwitansi', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Kwitansi</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const kwitansi = info.row.original;
          return (
            <div>
              <div className="text-xs font-medium text-gray-900">
                {kwitansi?.no_kwitansi || '-'}
              </div>
            </div>
          );
        },
        enableSorting: true,
      }),

      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Total</div>
              <div className="flex flex-col gap-0.5">
                <input
                  type="number"
                  value={filterValue.min ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                  placeholder="Min"
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="number"
                  value={filterValue.max ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                  placeholder="Max"
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          );
        },
        cell: (info) => (
          <div className="text-xs text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.accessor((row) => row.invoicePenagihan?.purchaseOrder?.customer?.namaCustomer, {
        id: 'customer_name',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customers}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="namaCustomer"
              valueKey="namaCustomer"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const customer = info.row.original?.invoicePenagihan?.purchaseOrder?.customer;
          return (
            <div>
              <div className="text-xs text-gray-900">{`${info.getValue()} (${customer?.kodeCustomer || '-'})`}</div>
              {customer?.groupCustomer?.nama_group && (
                <div className="text-xs text-gray-500">
                  {customer.groupCustomer?.nama_group}
                </div>
              )}
            </div>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.status?.status_name || row.status?.status_code, {
        id: 'status_code',
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={STATUS_OPTIONS}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
              sx={{ minWidth: '100px' }}
            />
          </div>
        ),
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size="sm"
            dot
          />
        ),
        enableSorting: true,
      }),

    ],
    [
      kwitansis,
      selectedKwitansis,
      onSelectKwitansi,
      handleSelectAllInternalToggle,
      customers,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar - Reset Filter */}
      {hasActiveFilters && (
        <div className="flex justify-end items-center">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset Filter
          </button>
        </div>
      )}

      {hasSelectedKwitansis && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded border border-blue-100">
          <span className="text-xs font-medium text-blue-700">
            {selectedKwitansis.length} kwitansi dipilih
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={deleteLoading}
            className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Bulk Delete"
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            Hapus
          </button>
          <button
            onClick={handlePrintSelected}
            disabled={isPrinting || isPrintingPaket}
            className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PrinterIcon className="h-3 w-3 mr-1" />
            {isPrinting ? '...' : 'Print'}
          </button>
          <button
            onClick={handlePrintPaketSelected}
            disabled={isPrinting || isPrintingPaket}
            className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PrinterIcon className="h-3 w-3 mr-1" />
            {isPrintingPaket ? '...' : 'Print Paket'}
          </button>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data kwitansi..."
        emptyMessage="Belum ada data kwitansi."
        emptyFilteredMessage="Kwitansi tidak ditemukan."
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-8"
        getRowClassName={({ row }) => {
          const kwitansiId = resolveKwitansiId(row.original);

          if (kwitansiId === selectedKwitansiId) {
            return 'bg-blue-50 border-l-4 border-blue-500';
          }

          if (kwitansiId && selectedKwitansis.includes(kwitansiId)) {
            return 'bg-blue-50';
          }

          return undefined;
        }}
        onRowClick={(rowData, event) => {
          if (onRowClick) {
            onRowClick(rowData);
          }
        }}
        cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
        footerRowClassName="bg-gray-200 font-bold sticky bottom-0 z-10"
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-2 py-1 text-xs border-t border-gray-300 text-center"
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

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent />
    </div>
  );
};

export default KwitansiTableServerSide;
