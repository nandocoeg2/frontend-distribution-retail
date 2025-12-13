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
import customerService from '../../services/customerService';

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

  // Fetch customers for multi-select filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100);
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
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-1">
              <div className="font-medium text-xs">Tanggal</div>
              <div className="flex flex-col gap-0.5">
                <input
                  type="date"
                  value={filterValue.from ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                  title="Dari tanggal"
                />
                <input
                  type="date"
                  value={filterValue.to ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                  className="w-full px-0.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                  title="Sampai tanggal"
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
      setPage,
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
            className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Filter
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
