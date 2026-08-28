import React, { useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { formatDate } from '../../utils/formatUtils';
import { useStockMovementsQuery } from '../../hooks/useStockMovementsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, TableFooterCell } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';
import HeroIcon from '../atoms/HeroIcon.jsx';

const columnHelper = createColumnHelper();

const StockInTable = forwardRef(({
  onViewDetail,
  onEdit,
  selectedMovementId = null,
  globalSearch = '',
}, ref) => {
  // Flatten raw stock movements into item rows for table display
  const selectData = useCallback((response) => {
    const rawMovements = response?.movements || (Array.isArray(response) ? response : []);
    if (!Array.isArray(rawMovements) || rawMovements.length === 0) return [];

    const flatRows = [];

    rawMovements.forEach((movement) => {
      // Ensure only STOCK_IN movements are processed defensively
      if (movement.type && movement.type !== 'STOCK_IN') {
        return;
      }

      const supplierName =
        movement?.supplier?.name ||
        movement?.supplierName ||
        movement?.reportPoSuppliers?.[0]?.supplier?.name ||
        '-';

      const suratJalanNo =
        movement?.no_surat_jalan ||
        movement?.reportPoSuppliers?.[0]?.no_surat_jalan ||
        '-';

      const movementDate = movement?.createdAt || null;
      const items = Array.isArray(movement?.items) ? movement.items : [];

      if (items.length === 0) {
        flatRows.push({
          id: movement.id,
          movementId: movement.id,
          createdAt: movementDate,
          no_surat_jalan: suratJalanNo,
          nama_barang: '-',
          plu: '-',
          qty: 0,
          quantity: 0,
          nama_supplier: supplierName,
          source: movement,
        });
      } else {
        items.forEach((itemObj, idx) => {
          const itemInfo = itemObj?.item || itemObj?.inventory || {};
          flatRows.push({
            id: `${movement.id}-${idx}`,
            movementId: movement.id,
            createdAt: movementDate,
            no_surat_jalan: suratJalanNo,
            nama_barang: itemInfo?.nama_barang || itemInfo?.name || '-',
            plu: itemInfo?.plu || '-',
            qty: Number(itemObj?.quantity || 0),
            quantity: Number(itemObj?.quantity || 0),
            nama_supplier: supplierName,
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
    queryHook: useStockMovementsQuery,
    selectData,
    selectPagination: (response) => response?.pagination,
    initialPage: 1,
    initialLimit: 9999, // Fetch all records at once (no pagination)
    manualFiltering: false, // Perform filtering client-side across the entire fetched dataset
    manualPagination: false,
    manualSorting: false,
    globalFilter: globalFilterConfig,
    columnFilterDebounceMs: 0,
    storageKey: 'stock-in-table',
  });

// Helper to evaluate whether a row matches a specific filter
const matchesStockInFilter = (row, filterId, filterValue) => {
  if (filterValue == null || filterValue === '') return true;

  if (filterId === 'createdAt') {
    if (!filterValue.from && !filterValue.to) return true;
    const rowDateVal = row.createdAt;
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

  if (filterId === 'no_surat_jalan') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.no_surat_jalan);
  }

  if (filterId === 'nama_barang') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.nama_barang);
  }

  if (filterId === 'nama_supplier') {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return filterValue.includes(row.nama_supplier);
  }

  if (filterId === 'plu') {
    if (typeof filterValue !== 'string') return true;
    return String(row.plu || '').toLowerCase().includes(filterValue.toLowerCase().trim());
  }

  if (filterId === 'qty') {
    const val = String(row.qty ?? '');
    return val.includes(String(filterValue).trim());
  }

  return true;
};

// Filter rows against all active filters except the specified column
const getMatchingStockInRowsExcluding = (rows, columnFilters, excludeFilterId) => {
  if (!rows || rows.length === 0) return [];
  if (!columnFilters || columnFilters.length === 0) return rows;

  return rows.filter((row) => {
    for (const filter of columnFilters) {
      if (filter.id === excludeFilterId) continue;
      if (!matchesStockInFilter(row, filter.id, filter.value)) {
        return false;
      }
    }
    return true;
  });
};

  // Dynamic filter options derived from current matching dataset in table
  const suratJalanOptions = useMemo(() => {
    const matchingRows = getMatchingStockInRowsExcluding(rows, columnFilters, 'no_surat_jalan');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.no_surat_jalan;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  const namaBarangOptions = useMemo(() => {
    const matchingRows = getMatchingStockInRowsExcluding(rows, columnFilters, 'nama_barang');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.nama_barang;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  const supplierOptions = useMemo(() => {
    const matchingRows = getMatchingStockInRowsExcluding(rows, columnFilters, 'nama_supplier');
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row.nama_supplier;
      if (val && val !== '-' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, columnFilters]);

  // Define TanStack Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        size: 120,
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tanggal</div>
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

      columnHelper.accessor('no_surat_jalan', {
        id: 'no_surat_jalan',
        size: 160,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No Surat Jalan</div>
            <AutocompleteCheckboxLimitTag
              options={suratJalanOptions}
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

      columnHelper.accessor('nama_barang', {
        id: 'nama_barang',
        size: 220,
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

      columnHelper.accessor('plu', {
        id: 'plu',
        size: 110,
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

      columnHelper.accessor('qty', {
        id: 'qty',
        size: 110,
        header: ({ column }) => (
          <div className="space-y-0.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Qty</div>
            <TextColumnFilter
              column={column}
              placeholder="Filter Qty..."
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

      columnHelper.accessor('nama_supplier', {
        id: 'nama_supplier',
        size: 180,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Nama Supplier</div>
            <AutocompleteCheckboxLimitTag
              options={supplierOptions}
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

      columnHelper.display({
        id: 'actions',
        size: 60,
        header: () => <div className="text-center font-medium text-xs">Aksi</div>,
        cell: (info) => (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit?.(info.row.original)}
              className="p-1 rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
              title="Edit / Ubah Stock In"
            >
              <HeroIcon name="pencil" className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      }),
    ],
    [suratJalanOptions, namaBarangOptions, supplierOptions, onEdit]
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
        loadingMessage="Memuat data Stock In..."
        emptyMessage="Tidak ada data Stock In."
        emptyFilteredMessage="Tidak ada data sesuai filter."
        wrapperClassName="overflow-x-auto overflow-y-auto flex-1 min-h-[300px]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 h-7"
        getRowClassName={({ row }) => {
          if (selectedMovementId && (row.original.movementId === selectedMovementId || row.original.id === selectedMovementId)) {
            return 'bg-blue-200 border-l-4 border-blue-600 font-medium text-gray-900';
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

StockInTable.displayName = 'StockInTable';

export default StockInTable;
