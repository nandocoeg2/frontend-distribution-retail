import React, { useMemo, useState, useCallback } from 'react';
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

const columnHelper = createColumnHelper();

const TAB_STATUS_CONFIG = {
  all: { label: 'All', statusCode: null },
  pending: { label: 'Pending', statusCode: 'PENDING KWITANSI' },
  processing: { label: 'Processing', statusCode: 'PROCESSING KWITANSI' },
  paid: { label: 'Paid', statusCode: 'PAID KWITANSI' },
  overdue: { label: 'Overdue', statusCode: 'OVERDUE KWITANSI' },
  completed: { label: 'Completed', statusCode: 'COMPLETED KWITANSI' },
  cancelled: { label: 'Cancelled', statusCode: 'CANCELLED KWITANSI' },
};

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
  activeTab = 'all',
  onRowClick,
  selectedKwitansiId,
  selectedKwitansis = [],
  onSelectKwitansi,
  hasSelectedKwitansis = false,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingPaket, setIsPrintingPaket] = useState(false);
  const lockedFilters = useMemo(() => {
    const statusCode = TAB_STATUS_CONFIG[activeTab]?.statusCode;
    if (!statusCode || activeTab === 'all') {
      return [];
    }
    return [{ id: 'status_code', value: statusCode }];
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
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    lockedFilters,
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

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedKwitansis.length; i++) {
        const kwitansiId = selectedKwitansis[i];
        
        try {
          const kwitansi = kwitansis.find(k => resolveKwitansiId(k) === kwitansiId);
          const companyId = kwitansi?.invoicePenagihan?.purchaseOrder?.customer?.companyId || 1;
          
          const html = await kwitansiService.exportKwitansi(kwitansiId, companyId);
          
          // Open in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }

          successCount++;

          // Small delay between prints
          if (i < selectedKwitansis.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          failCount++;
          console.error(`Error printing kwitansi ${kwitansiId}:`, error);
        }
      }

      if (successCount > 0) {
        toastService.success(
          `Berhasil memproses ${successCount} kwitansi${failCount > 0 ? `. ${failCount} gagal.` : ''}.`
        );
      } else {
        toastService.error('Gagal memproses kwitansi');
      }
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

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedKwitansis.length; i++) {
        const kwitansiId = selectedKwitansis[i];
        
        try {
          const kwitansi = kwitansis.find(k => resolveKwitansiId(k) === kwitansiId);
          const companyId = kwitansi?.invoicePenagihan?.purchaseOrder?.customer?.companyId || 1;
          
          const html = await kwitansiService.exportKwitansiPaket(kwitansiId, companyId);
          
          // Open in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }

          successCount++;

          // Small delay between prints
          if (i < selectedKwitansis.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          failCount++;
          console.error(`Error printing kwitansi paket ${kwitansiId}:`, error);
        }
      }

      if (successCount > 0) {
        toastService.success(
          `Berhasil memproses ${successCount} kwitansi paket${failCount > 0 ? `. ${failCount} gagal.` : ''}.`
        );
      } else {
        toastService.error('Gagal memproses kwitansi paket');
      }
    } catch (error) {
      console.error('Error in bulk print kwitansi paket:', error);
      toastService.error(error.message || 'Gagal memproses kwitansi paket');
    } finally {
      setIsPrintingPaket(false);
    }
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
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Tanggal</div>
            <input
              type="date"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('grand_total', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Total</div>
            <input
              type="number"
              min="0"
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
        cell: (info) => formatCurrency(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.accessor((row) => row.invoicePenagihan?.purchaseOrder?.customer?.namaCustomer, {
        id: 'customer_name',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Customer</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Filter customer..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ),
        cell: (info) => {
          const customer = info.row.original?.invoicePenagihan?.purchaseOrder?.customer;
          return (
            <div>
              <div className="text-xs text-gray-900">{customer?.namaCustomer || '-'}</div>
              {customer?.kodeCustomer && (
                <div className="text-xs text-gray-500">{customer.kodeCustomer}</div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status_code',
        header: ({ column }) => {
          const statusConfig = TAB_STATUS_CONFIG[activeTab];
          const isLocked = activeTab !== 'all' && statusConfig?.statusCode;

          return (
            <div className="space-y-1">
              <div className="font-medium text-xs">Status</div>
              {isLocked ? (
                <div className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded text-gray-700">
                  {statusConfig?.label || 'N/A'}
                </div>
              ) : (
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
                  <option value="PENDING KWITANSI">Pending</option>
                  <option value="PROCESSING KWITANSI">Processing</option>
                  <option value="PAID KWITANSI">Paid</option>
                  <option value="OVERDUE KWITANSI">Overdue</option>
                  <option value="COMPLETED KWITANSI">Completed</option>
                  <option value="CANCELLED KWITANSI">Cancelled</option>
                </select>
              )}
            </div>
          );
        },
        cell: (info) => (
          <StatusBadge
            status={info.getValue() || 'Unknown'}
            variant={resolveStatusVariant(info.getValue())}
            size="sm"
            dot
          />
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const kwitansi = row.original;

          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(kwitansi);
                }}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus"
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
      kwitansis,
      selectedKwitansis,
      onSelectKwitansi,
      handleSelectAllInternalToggle,
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

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {hasSelectedKwitansis && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedKwitansis.length} kwitansi dipilih
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintSelected}
              disabled={isPrinting || isPrintingPaket}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>{isPrinting ? 'Memproses...' : 'Print'}</span>
            </button>
            <button
              onClick={handlePrintPaketSelected}
              disabled={isPrinting || isPrintingPaket}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>{isPrintingPaket ? 'Memproses...' : 'Print Paket'}</span>
            </button>
          </div>
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
      />

      {!isLoading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="kwitansi"
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      )}
    </div>
  );
};

export default KwitansiTableServerSide;
