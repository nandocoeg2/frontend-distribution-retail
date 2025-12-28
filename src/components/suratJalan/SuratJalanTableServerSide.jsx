import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon, TruckIcon, PrinterIcon, XCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { useSuratJalanQuery } from '../../hooks/useSuratJalanQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import authService from '../../services/authService';
import suratJalanService from '../../services/suratJalanService';
import toastService from '../../services/toastService';

const columnHelper = createColumnHelper();

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('completed')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed')) {
    return 'danger';
  }

  if (value.includes('ready') || value.includes('ship')) {
    return 'primary';
  }

  if (value.includes('draft') || value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const isCancelAllowed = (suratJalan) => {
  if (!suratJalan?.status) {
    return true; // Allow cancel if no status
  }

  const normalize = (value) => {
    if (!value) return '';
    return value.toString().trim().toLowerCase().replace(/_/g, ' ');
  };

  const normalizedCode = normalize(suratJalan.status.status_code);
  // Cancel NOT allowed for already cancelled or delivered status
  return !normalizedCode.includes('cancelled') && !normalizedCode.includes('delivered');
};

const SuratJalanTableServerSide = ({
  onView,

  onDelete,
  onCancel,
  deleteLoading = false,
  cancelLoading = false,
  selectedSuratJalan = [],
  onSelectSuratJalan,
  onSelectAllSuratJalan,
  onProcessSelected,
  onUnprocessSelected,
  isProcessing = false,
  isUnprocessing = false,
  hasSelectedSuratJalan = false,
  initialPage = 1,
  initialLimit = 10,
  onRowClick,
  selectedSuratJalanId,
  onFiltersChange,
}) => {
  const queryClient = useQueryClient();
  const [isPrinting, setIsPrinting] = useState(false);
  const [unprocessDialog, setUnprocessDialog] = useState({
    show: false,
    item: null,
    loading: false,
  });

  // Handle checkbox click for processed items - show confirmation dialog
  const handleCheckboxChange = useCallback((item) => {
    const isProcessed = Boolean(item?.checklistSuratJalanId);

    if (isProcessed) {
      // User is trying to uncheck a processed item - show confirmation to unprocess
      setUnprocessDialog({
        show: true,
        item: item,
        loading: false,
      });
    } else {
      // Normal selection/deselection for unprocessed items
      onSelectSuratJalan && onSelectSuratJalan(item);
    }
  }, [onSelectSuratJalan]);

  // Handle unprocess confirmation
  const handleUnprocessConfirm = useCallback(async () => {
    if (!unprocessDialog.item) return;

    setUnprocessDialog(prev => ({ ...prev, loading: true }));
    try {
      const response = await suratJalanService.unprocessSuratJalan([unprocessDialog.item.id]);

      if (response?.success === false) {
        toastService.error(response?.message || 'Gagal unprocess surat jalan');
        return;
      }

      toastService.success(response?.data?.message || 'Surat jalan berhasil di-unprocess');

      // Close dialog
      setUnprocessDialog({ show: false, item: null, loading: false });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['surat-jalan'] });
      await queryClient.invalidateQueries({ queryKey: ['checklist-surat-jalan'] });
    } catch (err) {
      const message = err?.response?.data?.error?.message || err?.message || 'Gagal unprocess surat jalan';
      toastService.error(message);
    } finally {
      setUnprocessDialog(prev => ({ ...prev, loading: false }));
    }
  }, [unprocessDialog.item, queryClient]);

  const handleUnprocessCancel = useCallback(() => {
    setUnprocessDialog({ show: false, item: null, loading: false });
  }, []);

  const handleBulkPrint = async () => {
    try {
      if (!selectedSuratJalan || selectedSuratJalan.length === 0) {
        toastService.error('Tidak ada surat jalan yang dipilih');
        return;
      }

      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      setIsPrinting(true);
      toastService.info(`Generating bulk print for ${selectedSuratJalan.length} items...`);

      const ids = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);

      // Call bulk export endpoint
      const html = await suratJalanService.exportSuratJalanBulk(ids, companyData.id);

      // Open in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        toastService.error('Popup window diblokir');
      }

      toastService.success('Bulk print generated successfully');
    } catch (error) {
      console.error('Error bulk printing surat jalan:', error);
      toastService.error(error.message || 'Gagal mencetak surat jalan');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBulkPrintPaket = async () => {
    try {
      if (!selectedSuratJalan || selectedSuratJalan.length === 0) {
        toastService.error('Tidak ada surat jalan yang dipilih');
        return;
      }

      if (selectedSuratJalan.length > 50) {
        const confirm = window.confirm(
          `Anda memilih ${selectedSuratJalan.length} item untuk Print Paket (±${selectedSuratJalan.length * 5} halaman). \nBrowser mungkin akan mengalami lag/hang saat merender preview. \n\nLanjutkan?`
        );
        if (!confirm) return;
      }

      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      setIsPrinting(true);
      toastService.info(`Generating bulk paket print for ${selectedSuratJalan.length} items...`);

      const ids = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);

      // Call bulk export paket endpoint
      const html = await suratJalanService.exportSuratJalanPaketBulk(ids, companyData.id);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      } else {
        toastService.error('Popup window diblokir');
      }

      toastService.success('Bulk paket print generated successfully');
    } catch (error) {
      console.error('Error bulk printing surat jalan paket:', error);
      toastService.error(error.message || 'Gagal mencetak paket');
    } finally {
      setIsPrinting(false);
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

  const companyId = authService.getCompanyData()?.id;

  const getQueryParams = useCallback(({ filters, ...rest }) => {
    const mappedFilters = { ...filters };

    if (companyId) {
      mappedFilters.companyId = companyId;
    }

    return {
      ...rest,
      filters: mappedFilters,
    };
  }, [companyId]);

  const {
    data: suratJalan,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useSuratJalanQuery,
    selectData: (response) => response?.suratJalan ?? [],
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
          const selectedIds = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id);
          // All items are now selectable (including processed ones for unprocess)
          const selectableItems = suratJalan.filter(item => item?.id);
          const selectableIds = selectableItems.map(item => item?.id).filter(Boolean);
          const isAllSelected =
            selectableItems.length > 0 && selectableIds.every(id => selectedIds.includes(id));
          const isIndeterminate =
            selectedIds.length > 0 && !isAllSelected && selectableIds.some(id => selectedIds.includes(id));

          return (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={() => onSelectAllSuratJalan && onSelectAllSuratJalan(selectableItems)}
              disabled={selectableItems.length === 0}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            />
          );
        },
        cell: ({ row }) => {
          const selectedIds = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id);
          const isProcessed = Boolean(row.original.checklistSuratJalanId);
          const isInSelection = selectedIds.includes(row.original.id);
          // Processed items are checked by default, unprocessed items check based on selection
          const isChecked = isProcessed || isInSelection;
          return (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleCheckboxChange(row.original)}
              className={`h-3.5 w-3.5 focus:ring-blue-500 border-gray-300 rounded cursor-pointer ${isProcessed ? 'text-orange-600' : 'text-blue-600'
                }`}
              title={isProcessed
                ? 'Klik untuk unprocess (hapus dari checklist)'
                : 'Pilih surat jalan'}
            />
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('no_surat_jalan', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No Surat Jalan</div>
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
        cell: (info) => <span className="font-medium">{info.getValue() || 'N/A'}</span>,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">No PO</div>
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
        cell: (info) => <span className="font-medium">{info.getValue() || 'N/A'}</span>,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('deliver_to', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Deliver</div>
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
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('invoice.no_invoice', {
        id: 'no_invoice',
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
        cell: (info) => info.getValue() || 'N/A',
        enableColumnFilter: false,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_code',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Status</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            >
              <option value="">Semua</option>
              <option value="DRAFT SURAT JALAN">Draft</option>
              <option value="READY TO SHIP SURAT JALAN">Ready</option>
              <option value="DELIVERED SURAT JALAN">Delivered</option>
              <option value="CANCELLED SURAT JALAN">Cancelled</option>
            </select>
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
      }),
      columnHelper.accessor('is_printed', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Print</div>
            <select
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            >
              <option value="">Semua</option>
              <option value="true">Sudah Print</option>
              <option value="false">Belum Print</option>
            </select>
          </div>
        ),
        cell: (info) => (
          <StatusBadge
            status={info.getValue() ? 'Sudah Print' : 'Belum Print'}
            variant={info.getValue() ? 'success' : 'secondary'}
            size="sm"
            dot
          />
        ),
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => {
          const suratJalanItem = row.original;
          const cancelAllowed = isCancelAllowed(suratJalanItem);

          return (
            <div className="flex space-x-1">
              {cancelAllowed && onCancel && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(suratJalanItem.id, suratJalanItem.no_surat_jalan);
                  }}
                  disabled={cancelLoading}
                  className="text-orange-600 hover:text-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cancel (Batalkan SJ, PO, Invoice, Packing)"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(suratJalanItem.id);
                }}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      suratJalan,
      selectedSuratJalan,
      onSelectSuratJalan,
      onSelectAllSuratJalan,
      handleCheckboxChange,
      onDelete,
      onCancel,
      deleteLoading,
      cancelLoading,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  // Expose column filters to parent component
  useEffect(() => {
    if (onFiltersChange && table) {
      const columnFilters = table.getState().columnFilters || [];
      const filters = {};
      columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value;
      });
      onFiltersChange(filters);
    }
  }, [table?.getState().columnFilters, onFiltersChange]);

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-2">
      {(hasActiveFilters || hasSelectedSuratJalan) && (
        <div className="flex justify-between items-center">
          {hasSelectedSuratJalan ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700">{selectedSuratJalan.length} dipilih</span>
              {/* Show Proses button only for unprocessed items */}
              {selectedSuratJalan.some(item => !item?.checklistSuratJalanId) && (
                <button onClick={onProcessSelected} disabled={isProcessing} className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  <TruckIcon className="h-3 w-3 mr-1" />{isProcessing ? '...' : 'Proses'}
                </button>
              )}
              {/* Show Unprocess button only for processed items */}
              {selectedSuratJalan.some(item => item?.checklistSuratJalanId) && onUnprocessSelected && (
                <button onClick={onUnprocessSelected} disabled={isUnprocessing} className="inline-flex items-center px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
                  <XCircleIcon className="h-3 w-3 mr-1" />{isUnprocessing ? '...' : 'Unprocess'}
                </button>
              )}
              <button onClick={handleBulkPrint} disabled={isPrinting} className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" title="Print Surat Jalan (Simple)">
                <PrinterIcon className="h-3 w-3 mr-1" />{isPrinting ? '...' : 'Print SJ'}
              </button>
              <button onClick={handleBulkPrintPaket} disabled={isPrinting} className="inline-flex items-center px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50" title="Print Paket (Invoice + SJ + PO)">
                <DocumentDuplicateIcon className="h-3 w-3 mr-1" />{isPrinting ? '...' : 'Print Paket'}
              </button>
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50">Reset Filter</button>
          )}
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat..."
        emptyMessage="Tidak ada data"
        emptyFilteredMessage="Tidak ada data sesuai filter"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(75vh-300px)]"
        headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 cursor-pointer h-7"
        getRowClassName={({ row }) => {
          if (selectedSuratJalanId === row.original.id) return 'bg-blue-50 border-l-2 border-blue-500';
          const selectedIds = selectedSuratJalan.map(item => typeof item === 'string' ? item : item?.id);
          return selectedIds.includes(row.original.id) ? 'bg-green-50' : undefined;
        }}
        onRowClick={onRowClick}
        cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="surat jalan"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Unprocess Confirmation Dialog */}
      <ConfirmationDialog
        show={unprocessDialog.show}
        onClose={handleUnprocessCancel}
        onConfirm={handleUnprocessConfirm}
        title="Unprocess Surat Jalan"
        message={`Apakah Anda yakin ingin menghapus surat jalan "${unprocessDialog.item?.no_surat_jalan || ''}" dari checklist?\n\nStok akan dikembalikan.`}
        confirmText="Unprocess"
        cancelText="Batal"
        type="warning"
        loading={unprocessDialog.loading}
      />
    </div>
  );
};

export default SuratJalanTableServerSide;
