import React, { useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { formatDate } from '../../utils/formatUtils';
import { useStockOutMovementsQuery } from '../../hooks/useStockMovementsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, TableFooterCell } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';

const columnHelper = createColumnHelper();

const StockOutTable = forwardRef(({
  onViewDetail,
  selectedMovementId = null,
  globalSearch = '',
}, ref) => {
  // Flatten raw stock movements into consolidated item rows for table display
  const selectData = useCallback((response) => {
    const rawMovements = response?.movements || (Array.isArray(response) ? response : []);
    if (!Array.isArray(rawMovements) || rawMovements.length === 0) return [];

    const flatRows = [];

    rawMovements.forEach((movement) => {
      // Ensure only STOCK_OUT movements are processed defensively
      if (movement.type && movement.type !== 'STOCK_OUT') {
        return;
      }

      const customerName =
        movement?.customer?.namaCustomer ||
        movement?.customerName ||
        '-';

      const movementDate = movement?.createdAt || null;

      const poNumber =
        movement?.no_po ||
        movement?.purchaseOrder?.po_number ||
        '-';

      const invoiceNumber =
        movement?.no_invoice ||
        movement?.suratJalan?.invoice?.no_invoice ||
        movement?.purchaseOrder?.invoice?.no_invoice ||
        movement?.purchaseOrder?.invoicePengiriman?.no_invoice ||
        (Array.isArray(movement?.purchaseOrder?.invoicePenagihan)
          ? movement.purchaseOrder.invoicePenagihan[0]?.no_invoice_penagihan ||
            movement.purchaseOrder.invoicePenagihan[0]?.no_invoice
          : movement?.purchaseOrder?.invoicePenagihan?.no_invoice_penagihan ||
            movement?.purchaseOrder?.invoicePenagihan?.no_invoice) ||
        '-';

      const totalPenagihanVal = Number(
        movement?.purchaseOrder?.grand_total ||
        movement?.purchaseOrder?.payable_amount ||
        movement?.purchaseOrder?.invoicePenagihan?.[0]?.total_invoice ||
        0
      );

      const items = Array.isArray(movement?.items) ? movement.items : [];
      const poDetails = Array.isArray(movement?.purchaseOrder?.purchaseOrderDetails)
        ? movement.purchaseOrder.purchaseOrderDetails
        : [];

      if (items.length === 0) {
        flatRows.push({
          id: movement.id,
          movementId: movement.id,
          tgl: movementDate,
          noInvoice: invoiceNumber,
          plu: '-',
          namaCustomer: customerName,
          namaBarang: '-',
          totalPengiriman: 0,
          poQuantity: 0,
          selisih: 0,
          noPo: poNumber,
          totalPenagihan: totalPenagihanVal,
          stokGantung: 0,
          source: movement,
        });
      } else {
        // Group items in movement by itemId/plu so it's always consolidated total per item per PO
        const groupedItemsMap = new Map();
        items.forEach((itemObj) => {
          const itemInfo = itemObj?.item || itemObj?.inventory || {};
          const itemId = itemObj?.itemId || itemInfo?.id;
          const key = itemId || itemInfo?.plu || itemInfo?.nama_barang || JSON.stringify(itemInfo);

          if (groupedItemsMap.has(key)) {
            const existing = groupedItemsMap.get(key);
            existing.quantity += Number(itemObj?.quantity || 0);
          } else {
            groupedItemsMap.set(key, {
              ...itemObj,
              itemInfo,
              itemId,
              quantity: Number(itemObj?.quantity || 0),
            });
          }
        });

        const groupedItems = Array.from(groupedItemsMap.values());

        groupedItems.forEach((itemObj, idx) => {
          const itemInfo = itemObj.itemInfo;
          const itemId = itemObj.itemId;
          const totalPengiriman = itemObj.quantity;

          // Find corresponding PO Detail Qty if available
          const matchingPoDetail = poDetails.find(
            (pod) => pod.itemId === itemId || (itemInfo?.plu && pod?.plu === itemInfo?.plu)
          );
          const poQuantity = matchingPoDetail
            ? Number(matchingPoDetail.quantity || matchingPoDetail.qty_po || 0)
            : totalPengiriman;

          // Calculate Total Penagihan for this item (from invoicePenagihanDetails if present)
          const invoicePenagihanList = Array.isArray(movement?.purchaseOrder?.invoicePenagihan)
            ? movement.purchaseOrder.invoicePenagihan
            : movement?.purchaseOrder?.invoicePenagihan
            ? [movement.purchaseOrder.invoicePenagihan]
            : [];

          const matchingInvoiceDetails = invoicePenagihanList.flatMap(
            (inv) => inv?.invoicePenagihanDetails || []
          ).filter(
            (det) => det?.itemId === itemId || (itemInfo?.plu && det?.PLU === itemInfo?.plu)
          );

          const totalPenagihan = matchingInvoiceDetails.reduce(
            (sum, det) => sum + Number(det?.quantity || 0),
            0
          );

          // Selisih = PO Quantity - Total Pengiriman
          const selisih = poQuantity - totalPengiriman;

          // Stok Gantung = Total Penagihan - Total Kirim (totalPengiriman)
          const stokGantung = totalPenagihan - totalPengiriman;

          flatRows.push({
            id: `${movement.id}-${idx}`,
            movementId: movement.id,
            tgl: movementDate,
            noInvoice: invoiceNumber,
            plu: itemInfo?.plu || '-',
            namaCustomer: customerName,
            namaBarang: itemInfo?.nama_barang || itemInfo?.name || '-',
            totalPengiriman,
            poQuantity,
            selisih,
            noPo: poNumber,
            totalPenagihan,
            stokGantung,
            source: movement,
          });
        });
      }
    });

    return flatRows;
  }, []);

  const globalFilterConfig = useMemo(
    () => ({
      enabled: Boolean(globalSearch),
      initialValue: globalSearch,
      debounceMs: 500,
    }),
    [globalSearch]
  );

  const {
    data: rows,
    pagination,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
    refetch,
    columnFilters,
  } = useServerSideTable({
    queryHook: useStockOutMovementsQuery,
    selectData,
    selectPagination: (response) => response?.pagination,
    initialPage: 1,
    initialLimit: 9999, // Fetch all records at once (no pagination)
    manualFiltering: false, // Perform filtering client-side across the entire fetched dataset
    manualPagination: false,
    manualSorting: false,
    globalFilter: globalFilterConfig,
    columnFilterDebounceMs: 0,
    storageKey: 'stock-out-table',
  });

// Helper to evaluate whether a row matches a specific filter in StockOut
const matchesStockOutFilter = (row, filterId, filterValue) => {
  if (filterValue == null || filterValue === '') return true;

  if (filterId === 'tgl') {
    if (!filterValue.from && !filterValue.to) return true;
    const rowDateVal = row.tgl;
    if (!rowDateVal) return false;
    const date = new Date(rowDateVal);
    if (isNaN(date.getTime())) return false;
    if (filterValue.from) {
      const fromDate = new Date(filterValue.from);
      fromDate.setHours(0, 0, 0, 0);
      if (date < fromDate) return false;
    }
    if (filterValue.to) {
      const toDate = new Date(filterValue.to);
      toDate.setHours(23, 59, 59, 999);
      if (date > toDate) return false;
    }
    return true;
  }

  if (filterId === 'noInvoice') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.noInvoice);
  }

  if (filterId === 'namaCustomer') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.namaCustomer);
  }

  if (filterId === 'namaBarang') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.namaBarang);
  }

  if (filterId === 'noPo') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.noPo);
  }

  if (filterId === 'plu') {
    if (typeof filterValue !== 'string') return true;
    return String(row.plu || '').toLowerCase().includes(filterValue.toLowerCase().trim());
  }

  if (filterId === 'totalPengiriman') {
    const val = String(row.totalPengiriman ?? '');
    return val.includes(String(filterValue).trim());
  }

  if (filterId === 'poQuantity') {
    const val = String(row.poQuantity ?? '');
    return val.includes(String(filterValue).trim());
  }

  if (filterId === 'totalPenagihan') {
    const val = String(row.totalPenagihan ?? '');
    return val.includes(String(filterValue).trim());
  }

  return true;
};

// Filter rows against all active filters except the specified column
const getMatchingStockOutRowsExcluding = (rows, columnFilters, excludeFilterId) => {
  if (!rows || rows.length === 0) return [];
  if (!columnFilters || columnFilters.length === 0) return rows;

  return rows.filter((row) => {
    for (const filter of columnFilters) {
      if (filter.id === excludeFilterId) continue;
      if (!matchesStockOutFilter(row, filter.id, filter.value)) {
        return false;
      }
    }
    return true;
  });
};

  // Dynamic filter options derived from current matching dataset in table
  const invoiceOptions = useMemo(() => {
    const matchingRows = getMatchingStockOutRowsExcluding(rows, columnFilters, 'noInvoice');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.noInvoice;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  const customerOptions = useMemo(() => {
    const matchingRows = getMatchingStockOutRowsExcluding(rows, columnFilters, 'namaCustomer');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.namaCustomer;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  const namaBarangOptions = useMemo(() => {
    const matchingRows = getMatchingStockOutRowsExcluding(rows, columnFilters, 'namaBarang');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.namaBarang;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  const poOptions = useMemo(() => {
    const matchingRows = getMatchingStockOutRowsExcluding(rows, columnFilters, 'noPo');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.noPo;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  // Define TanStack Table columns (11 columns matching user requirements)
  const columns = useMemo(
    () => [
      // 1. Tgl
      columnHelper.accessor('tgl', {
        id: 'tgl',
        size: 110,
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tgl</div>
              <div className="flex flex-col gap-0.5">
                <DateFilter
                  value={filterValue.from ?? ''}
                  onChange={(val) => {
                    column.setFilterValue({ ...filterValue, from: val });
                  }}
                  placeholder="Dari"
                />
                <DateFilter
                  value={filterValue.to ?? ''}
                  onChange={(val) => {
                    column.setFilterValue({ ...filterValue, to: val });
                  }}
                  placeholder="Sampai"
                />
              </div>
            </div>
          );
        },
        cell: (info) => (
          <span className="text-xs text-gray-700 whitespace-nowrap">
            {info.getValue() ? formatDate(info.getValue()) : '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return true;
          const rowDateVal = row.getValue(columnId);
          if (!rowDateVal) return false;
          const date = new Date(rowDateVal);
          if (isNaN(date.getTime())) return false;

          if (filterValue.from) {
            const fromDate = new Date(filterValue.from);
            fromDate.setHours(0, 0, 0, 0);
            if (date < fromDate) return false;
          }
          if (filterValue.to) {
            const toDate = new Date(filterValue.to);
            toDate.setHours(23, 59, 59, 999);
            if (date > toDate) return false;
          }
          return true;
        },
      }),

      // 2. No Invoice
      columnHelper.accessor('noInvoice', {
        id: 'noInvoice',
        size: 140,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No Invoice</div>
            <AutocompleteCheckboxLimitTag
              options={invoiceOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
              }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-medium text-gray-900 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),

      // 3. PLU
      columnHelper.accessor('plu', {
        id: 'plu',
        size: 100,
        header: ({ column }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-xs">PLU</div>
            <TextColumnFilter column={column} placeholder="Filter PLU..." />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-mono text-gray-700 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || typeof filterValue !== 'string') return true;
          const val = String(row.getValue(columnId) || '').toLowerCase();
          return val.includes(filterValue.toLowerCase().trim());
        },
      }),

      // 4. Nama Customer
      columnHelper.accessor('namaCustomer', {
        id: 'namaCustomer',
        size: 150,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Nama Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
              }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-medium text-gray-900 truncate block" title={info.getValue()}>
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),

      // 5. Nama Barang
      columnHelper.accessor('namaBarang', {
        id: 'namaBarang',
        size: 200,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Nama Barang</div>
            <AutocompleteCheckboxLimitTag
              options={namaBarangOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
              }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-semibold text-gray-900 truncate block" title={info.getValue()}>
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),

      // 6. Total Pengiriman
      columnHelper.accessor('totalPengiriman', {
        id: 'totalPengiriman',
        size: 120,
        header: ({ column }) => (
          <div className="space-y-0.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Total Pengiriman</div>
            <TextColumnFilter
              column={column}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-bold text-right text-gray-900 block whitespace-nowrap">
            {Math.round(Number(info.getValue() || 0)).toLocaleString('id-ID')}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue == null || filterValue === '') return true;
          const val = String(row.getValue(columnId) ?? '');
          return val.includes(String(filterValue).trim());
        },
      }),

      // 7. PO Quantity
      columnHelper.accessor('poQuantity', {
        id: 'poQuantity',
        size: 110,
        header: ({ column }) => (
          <div className="space-y-0.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">PO Quantity</div>
            <TextColumnFilter
              column={column}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs text-right text-gray-800 block whitespace-nowrap">
            {Math.round(Number(info.getValue() || 0)).toLocaleString('id-ID')}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue == null || filterValue === '') return true;
          const val = String(row.getValue(columnId) ?? '');
          return val.includes(String(filterValue).trim());
        },
      }),

      // 8. Selisih
      columnHelper.accessor('selisih', {
        id: 'selisih',
        size: 100,
        header: () => (
          <div className="space-y-0.5 text-right">
            <div className="font-medium text-xs">Selisih</div>
            <div className="h-6"></div>
          </div>
        ),
        cell: (info) => (
          <span className="text-xs text-right text-gray-800 block whitespace-nowrap">
            {Math.round(Number(info.getValue() || 0)).toLocaleString('id-ID')}
          </span>
        ),
      }),

      // 9. No PO
      columnHelper.accessor('noPo', {
        id: 'noPo',
        size: 140,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No PO</div>
            <AutocompleteCheckboxLimitTag
              options={poOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
              }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs font-medium text-gray-900 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),

      // 10. Total Penagihan
      columnHelper.accessor('totalPenagihan', {
        id: 'totalPenagihan',
        size: 120,
        header: ({ column }) => (
          <div className="space-y-0.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Total Penagihan</div>
            <TextColumnFilter
              column={column}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-xs text-right text-gray-800 block whitespace-nowrap">
            {Math.round(Number(info.getValue() || 0)).toLocaleString('id-ID')}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue == null || filterValue === '') return true;
          const val = String(row.getValue(columnId) ?? '');
          return val.includes(String(filterValue).trim());
        },
      }),

      // 11. Stok Gantung
      columnHelper.accessor('stokGantung', {
        id: 'stokGantung',
        size: 110,
        header: () => (
          <div className="space-y-0.5 text-right">
            <div className="font-medium text-xs">Stok Gantung</div>
            <div className="h-6"></div>
          </div>
        ),
        cell: (info) => {
          const val = Math.round(Number(info.getValue() || 0));
          return (
            <span
              className={`text-xs text-right block whitespace-nowrap ${
                val !== 0 ? 'font-semibold text-red-600' : 'text-gray-800'
              }`}
            >
              {val.toLocaleString('id-ID')}
            </span>
          );
        },
      }),
    ],
    [invoiceOptions, customerOptions, namaBarangOptions, poOptions]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useImperativeHandle(ref, () => ({
    refetch: () => refetch?.(),
    getFilters: () => {
      const state = table.getState();
      const filters = {};
      state.columnFilters.forEach((filter) => {
        filters[filter.id] = filter.value;
      });
      return filters;
    },
    getData: () => rows,
  }));

  const loading = isLoading || isFetching;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-2">
      {hasActiveFilters && (
        <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
          <div />
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data Stock Out..."
        emptyMessage="Tidak ada data Stock Out."
        emptyFilteredMessage="Tidak ada data sesuai filter."
        wrapperClassName="overflow-x-auto overflow-y-auto flex-1 min-h-[300px]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-amber-50/40 h-7"
        getRowClassName={({ row }) => {
          if (selectedMovementId && row.original.movementId === selectedMovementId) {
            return 'bg-blue-50 border-l-2 border-blue-500';
          }
          return undefined;
        }}
        cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
        onRowClick={onViewDetail ? (row) => onViewDetail(row) : undefined}
        footerRowClassName={`bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 ${(pagination?.totalItems || 0) > 0 ? 'z-10' : 'z-0'}`}
        footerCellClassName="px-1.5 py-1 text-xs border-t border-gray-300"
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-1.5 py-1 text-xs border-t border-gray-300 border-r border-gray-200 last:border-r-0"
              >
                <TableFooterCell column={column} table={table} />
              </td>
            ))}
          </tr>
        }
      />
    </div>
  );
});

StockOutTable.displayName = 'StockOutTable';

export default StockOutTable;
