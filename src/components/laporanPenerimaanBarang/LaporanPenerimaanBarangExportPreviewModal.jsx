import React, { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable, TableFooterCell } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';
import { formatCurrency, formatNumber } from '../../utils/formatUtils';
import HeroIcon from '../atoms/HeroIcon.jsx';

const columnHelper = createColumnHelper();

const matchesLpbFilter = (row, filterId, filterValue) => {
  if (filterValue == null || filterValue === '') return true;
  if (Array.isArray(filterValue) && filterValue.length === 0) return true;

  const multiselectFields = ['no_lpb', 'po', 'customer', 'top', 'status', 'plu', 'nama_barang'];

  if (multiselectFields.includes(filterId)) {
    if (!Array.isArray(filterValue)) {
      const rowVal = String(row[filterId] ?? '').toLowerCase();
      return rowVal.includes(String(filterValue).toLowerCase().trim());
    }
    if (filterValue.length === 0) return true;
    return filterValue.includes(row[filterId]);
  }

  if (filterId === 'tanggal') {
    const cellValue = String(row.tanggal || '');
    if (cellValue.includes(filterValue)) return true;
    try {
      const selectedLocale = new Date(filterValue).toLocaleDateString('id-ID');
      const selectedLocaleGB = new Date(filterValue).toLocaleDateString('en-GB');
      return (
        cellValue === selectedLocale ||
        cellValue === selectedLocaleGB ||
        cellValue.includes(selectedLocale)
      );
    } catch {
      return cellValue.includes(filterValue);
    }
  }

  const rowVal = String(row[filterId] ?? '').toLowerCase();
  return rowVal.includes(String(filterValue).toLowerCase().trim());
};

const getMatchingLpbRowsExcluding = (rows, columnFilters, excludeFilterId) => {
  if (!rows || rows.length === 0) return [];
  if (!columnFilters || columnFilters.length === 0) return rows;

  return rows.filter((row) => {
    for (const filter of columnFilters) {
      if (filter.id === excludeFilterId) continue;
      if (!matchesLpbFilter(row, filter.id, filter.value)) {
        return false;
      }
    }
    return true;
  });
};

const LaporanPenerimaanBarangExportPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  previewLoading,
  onExport,
  isExporting = false,
}) => {
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setColumnFilters([]);
    }
  }, [isOpen]);

  const formattedData = useMemo(() => {
    if (!previewData?.data || !Array.isArray(previewData.data)) return [];
    return previewData.data.map((row) => {
      if (Array.isArray(row)) {
        return {
          no_lpb: row[0] || '',
          po: row[1] || '',
          customer: row[2] || '',
          tanggal: row[3] || '',
          top: row[4] || '',
          status: row[5] || '',
          plu: row[6] || '',
          nama_barang: row[7] || '',
          qty_dikirim: Number(row[8]) || 0,
          qty_diterima: Number(row[9]) || 0,
          selisih_qty: Number(row[10]) || 0,
          total_harga_dikirim: Number(row[11]) || 0,
          total_harga_diterima: Number(row[12]) || 0,
          selisih_harga: Number(row[13]) || 0,
        };
      }
      return {
        no_lpb: row.no_lpb || '',
        po: row.po || '',
        customer: row.customer || '',
        tanggal: row.tanggal || '',
        top: row.top || '',
        status: row.status || '',
        plu: row.plu || '',
        nama_barang: row.nama_barang || '',
        qty_dikirim: Number(row.qty_dikirim) || 0,
        qty_diterima: Number(row.qty_diterima) || 0,
        selisih_qty: Number(row.selisih_qty) || 0,
        total_harga_dikirim: Number(row.total_harga_dikirim) || 0,
        total_harga_diterima: Number(row.total_harga_diterima) || 0,
        selisih_harga: Number(row.selisih_harga) || 0,
      };
    });
  }, [previewData]);

  const getDynamicOptions = (field) => {
    const matchingRows = getMatchingLpbRowsExcluding(formattedData, columnFilters, field);
    const map = new Map();
    matchingRows.forEach((row) => {
      const val = row[field];
      if (val && val !== '-') {
        map.set(val, { id: val, name: String(val) });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === field);
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        map.set(val, { id: val, name: String(val) });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const noLpbOptions = useMemo(() => getDynamicOptions('no_lpb'), [formattedData, columnFilters]);
  const poOptions = useMemo(() => getDynamicOptions('po'), [formattedData, columnFilters]);
  const customerOptions = useMemo(() => getDynamicOptions('customer'), [formattedData, columnFilters]);
  const topOptions = useMemo(() => getDynamicOptions('top'), [formattedData, columnFilters]);
  const statusOptions = useMemo(() => getDynamicOptions('status'), [formattedData, columnFilters]);
  const pluOptions = useMemo(() => getDynamicOptions('plu'), [formattedData, columnFilters]);
  const namaBarangOptions = useMemo(() => getDynamicOptions('nama_barang'), [formattedData, columnFilters]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('no_lpb', {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No. LPB</div>
            <AutocompleteCheckboxLimitTag
              options={noLpbOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="font-medium text-gray-900 whitespace-nowrap font-mono">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
        meta: {
          footer: () => <span className="font-bold text-xs text-gray-700">Total</span>,
        },
      }),
      columnHelper.accessor('po', {
        id: 'po',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">PO</div>
            <AutocompleteCheckboxLimitTag
              options={poOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="text-gray-700 whitespace-nowrap font-mono">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('customer', {
        id: 'customer',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="text-gray-700 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('tanggal', {
        id: 'tanggal',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Tanggal</div>
            <DateFilter
              value={column.getFilterValue() ?? ''}
              onChange={(val) => column.setFilterValue(val)}
              placeholder="Filter Tanggal..."
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-gray-700 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('top', {
        id: 'top',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">TOP</div>
            <AutocompleteCheckboxLimitTag
              options={topOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="text-gray-600 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={statusOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
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
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">PLU</div>
            <AutocompleteCheckboxLimitTag
              options={pluOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="font-mono text-gray-700 whitespace-nowrap">
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
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Nama Barang</div>
            <AutocompleteCheckboxLimitTag
              options={namaBarangOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => column.setFilterValue(e.target.value)}
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
          <span className="text-gray-700 max-w-xs truncate block" title={info.getValue()}>
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('qty_dikirim', {
        id: 'qty_dikirim',
        header: () => <div className="text-right font-medium text-xs">Qty Kirim</div>,
        cell: (info) => (
          <div className="text-right font-mono">{formatNumber(info.getValue() || 0)}</div>
        ),
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.qty_dikirim) || 0), 0);
            return (
              <span className="font-mono font-bold text-xs text-right block">
                {formatNumber(sum)}
              </span>
            );
          },
        },
      }),
      columnHelper.accessor('qty_diterima', {
        id: 'qty_diterima',
        header: () => <div className="text-right font-medium text-xs">Qty Terima</div>,
        cell: (info) => (
          <div className="text-right font-mono">{formatNumber(info.getValue() || 0)}</div>
        ),
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.qty_diterima) || 0), 0);
            return (
              <span className="font-mono font-bold text-xs text-right block">
                {formatNumber(sum)}
              </span>
            );
          },
        },
      }),
      columnHelper.accessor('selisih_qty', {
        id: 'selisih_qty',
        header: () => <div className="text-right font-medium text-xs">Selisih Qty</div>,
        cell: (info) => {
          const val = Number(info.getValue()) || 0;
          return (
            <div className={`text-right font-mono ${val !== 0 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
              {formatNumber(val)}
            </div>
          );
        },
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.selisih_qty) || 0), 0);
            return (
              <span className={`font-mono font-bold text-xs text-right block ${sum !== 0 ? 'text-red-600' : ''}`}>
                {formatNumber(sum)}
              </span>
            );
          },
        },
      }),
      columnHelper.accessor('total_harga_dikirim', {
        id: 'total_harga_dikirim',
        header: () => <div className="text-right font-medium text-xs">Total Kirim (Rp)</div>,
        cell: (info) => (
          <div className="text-right font-mono">{formatCurrency(info.getValue() || 0)}</div>
        ),
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.total_harga_dikirim) || 0), 0);
            return (
              <span className="font-mono font-bold text-xs text-right block">
                {formatCurrency(sum)}
              </span>
            );
          },
        },
      }),
      columnHelper.accessor('total_harga_diterima', {
        id: 'total_harga_diterima',
        header: () => <div className="text-right font-medium text-xs">Total Terima (Rp)</div>,
        cell: (info) => (
          <div className="text-right font-mono font-bold text-gray-900">
            {formatCurrency(info.getValue() || 0)}
          </div>
        ),
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.total_harga_diterima) || 0), 0);
            return (
              <span className="font-mono font-bold text-xs text-right block text-blue-900">
                {formatCurrency(sum)}
              </span>
            );
          },
        },
      }),
      columnHelper.accessor('selisih_harga', {
        id: 'selisih_harga',
        header: () => <div className="text-right font-medium text-xs">Selisih Harga (Rp)</div>,
        cell: (info) => {
          const val = Number(info.getValue()) || 0;
          return (
            <div className={`text-right font-mono ${val !== 0 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
              {formatCurrency(val)}
            </div>
          );
        },
        meta: {
          align: 'right',
          footer: ({ table }) => {
            const sum = table
              .getFilteredRowModel()
              .rows.reduce((acc, row) => acc + (Number(row.original.selisih_harga) || 0), 0);
            return (
              <span className={`font-mono font-bold text-xs text-right block ${sum !== 0 ? 'text-red-600' : ''}`}>
                {formatCurrency(sum)}
              </span>
            );
          },
        },
      }),
    ],
    [customerOptions, statusOptions]
  );

  const table = useReactTable({
    data: formattedData,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Preview Export Excel - Laporan Penerimaan Barang
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Menampilkan {table.getFilteredRowModel().rows.length} dari {formattedData.length} baris data detail LPB
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            <HeroIcon name="x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <DataTable
            table={table}
            isLoading={previewLoading}
            loadingMessage="Memuat preview data..."
            emptyMessage="Tidak ada data yang tersedia untuk diexport"
            emptyFilteredMessage="Tidak ada data yang cocok dengan filter preview"
            tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
            headerRowClassName="bg-gray-50"
            headerCellClassName="px-2 py-1.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 uppercase tracking-wider"
            bodyClassName="bg-white divide-y divide-gray-100"
            rowClassName="hover:bg-gray-50 transition-colors h-8"
            cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
            footerRowClassName="bg-gray-100 font-bold sticky bottom-0 z-10 border-t-2 border-gray-300"
            footerContent={
              <tr>
                {table.getVisibleLeafColumns().map((column) => (
                  <td key={column.id} className="px-2 py-1.5 text-xs border-t border-gray-300">
                    <TableFooterCell column={column} table={table} />
                  </td>
                ))}
              </tr>
            }
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {columnFilters.length > 0 && (
              <button
                onClick={() => setColumnFilters([])}
                className="text-blue-600 hover:text-blue-800 font-medium mr-2"
              >
                Reset Filter Preview
              </button>
            )}
            <span>Format output: Microsoft Excel (.xlsx)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
            >
              Tutup
            </button>
            <button
              onClick={onExport}
              disabled={isExporting || formattedData.length === 0}
              className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <HeroIcon name="document-arrow-down" className="w-4 h-4 mr-1.5" />
              {isExporting ? 'Mengexport...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangExportPreviewModal;
