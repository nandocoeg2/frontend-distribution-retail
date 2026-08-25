import React, { useMemo } from 'react';
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

const columnHelper = createColumnHelper();

const PackingExportPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  previewLoading,
  onExport,
}) => {
  const formattedData = useMemo(() => {
    if (!previewData?.data || !Array.isArray(previewData.data)) return [];
    return previewData.data.map((row) => ({
      po: row.po || '',
      customer: row.customer || '',
      tanggal_packing: row.tanggal_packing || '',
      status: row.status || '',
      plu: row.plu || '',
      nama_barang: row.nama_barang || '',
      quantity: Number(row.quantity) || 0,
    }));
  }, [previewData]);

  const customerOptions = useMemo(() => {
    if (!formattedData.length) return [];
    const set = new Set();
    formattedData.forEach((row) => {
      if (row.customer && row.customer !== '-') {
        set.add(row.customer);
      }
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name }));
  }, [formattedData]);

  const statusOptions = useMemo(() => {
    if (!formattedData.length) return [];
    const set = new Set();
    formattedData.forEach((row) => {
      if (row.status && row.status !== '-') {
        set.add(row.status);
      }
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name }));
  }, [formattedData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('po', {
        id: 'po',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">PO</div>
            <TextColumnFilter column={column} placeholder="Filter PO..." />
          </div>
        ),
        cell: (info) => (
          <span className="font-medium text-gray-900 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || typeof filterValue !== 'string') return true;
          const val = String(row.getValue(columnId) || '').toLowerCase();
          return val.includes(filterValue.toLowerCase().trim());
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
      columnHelper.accessor('tanggal_packing', {
        id: 'tanggal_packing',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Tanggal Packing</div>
            <DateFilter
              value={column.getFilterValue() ?? ''}
              onChange={(val) => column.setFilterValue(val)}
              placeholder="Filter Tanggal..."
            />
          </div>
        ),
        cell: (info) => (
          <span className="text-gray-600 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const cellValue = String(row.getValue(columnId) || '');
          if (cellValue.includes(filterValue)) return true;
          try {
            const selectedLocale = new Date(filterValue).toLocaleDateString('id-ID');
            const selectedLocaleGB = new Date(filterValue).toLocaleDateString('en-GB');
            return (
              cellValue === selectedLocale ||
              cellValue === selectedLocaleGB ||
              cellValue.includes(selectedLocale)
            );
          } catch (e) {
            return cellValue.includes(filterValue);
          }
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
        cell: (info) => {
          const val = info.getValue() || '';
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                val.includes('COMPLETE')
                  ? 'bg-green-50 text-green-700'
                  : val.includes('PROCESS')
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {val || '-'}
            </span>
          );
        },
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
            <TextColumnFilter column={column} placeholder="Filter PLU..." />
          </div>
        ),
        cell: (info) => (
          <span className="text-gray-700 whitespace-nowrap font-mono">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || typeof filterValue !== 'string') return true;
          const val = String(row.getValue(columnId) || '').toLowerCase();
          return val.includes(filterValue.toLowerCase().trim());
        },
      }),
      columnHelper.accessor('nama_barang', {
        id: 'nama_barang',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Nama Barang</div>
            <TextColumnFilter column={column} placeholder="Filter Barang..." />
          </div>
        ),
        cell: (info) => (
          <span className="text-gray-800 font-medium max-w-xs truncate block" title={info.getValue()}>
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || typeof filterValue !== 'string') return true;
          const val = String(row.getValue(columnId) || '').toLowerCase();
          return val.includes(filterValue.toLowerCase().trim());
        },
      }),
      columnHelper.accessor('quantity', {
        id: 'quantity',
        header: ({ column }) => (
          <div className="space-y-0.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Total Qty (Pcs)</div>
            <TextColumnFilter
              column={column}
              placeholder="Filter..."
              className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => (
          <div className="text-right font-semibold text-gray-900 whitespace-nowrap pr-2">
            {Number(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue == null || filterValue === '') return true;
          const val = String(row.getValue(columnId) ?? '');
          return val.includes(String(filterValue).trim());
        },
      }),
    ],
    [customerOptions, statusOptions]
  );

  const table = useReactTable({
    data: formattedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!isOpen) return null;

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = previewData?.totalItems || formattedData.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          ></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full border border-gray-100">
          <div className="bg-white px-6 pt-6 pb-4 sm:pb-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                <span className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                Preview Hasil Export Excel
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-500 animate-pulse">
                  Menyiapkan preview data...
                </p>
              </div>
            ) : formattedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-sm font-semibold text-gray-900">Tidak ada data untuk diexport</p>
                <p className="text-xs text-gray-500 mt-1">Silakan sesuaikan filter pencarian Anda.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <DataTable
                  table={table}
                  isLoading={false}
                  emptyMessage="Tidak ada data yang cocok dengan filter pencarian."
                  emptyFilteredMessage="Tidak ada data yang cocok dengan filter pencarian."
                  wrapperClassName="overflow-x-auto max-h-[55vh]"
                  tableClassName="min-w-full divide-y divide-gray-200 text-xs"
                  headerRowClassName="bg-gray-50 sticky top-0 z-10"
                  headerCellClassName="px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                  bodyClassName="bg-white divide-y divide-gray-100"
                  rowClassName="hover:bg-gray-50/70 transition-colors odd:bg-white even:bg-gray-50/30"
                  cellClassName="px-3 py-2 text-xs"
                  footerRowClassName="bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 z-10"
                  footerCellClassName="px-3 py-1.5 text-xs border-t border-gray-300"
                  footerContent={
                    <tr>
                      {table.getVisibleLeafColumns().map((column) => (
                        <td
                          key={column.id}
                          className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200 last:border-r-0"
                        >
                          <TableFooterCell column={column} table={table} />
                        </td>
                      ))}
                    </tr>
                  }
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <div>
                Menampilkan <span className="font-semibold text-gray-700">{filteredCount}</span> dari{' '}
                <span className="font-semibold text-gray-700">{totalCount}</span> total baris.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
                {onExport && (
                  <button
                    type="button"
                    onClick={onExport}
                    disabled={formattedData.length === 0}
                    className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Excel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingExportPreviewModal;
