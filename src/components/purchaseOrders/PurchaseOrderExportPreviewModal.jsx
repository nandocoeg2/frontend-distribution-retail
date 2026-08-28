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
import { formatCurrency } from '../../utils/formatUtils';

const columnHelper = createColumnHelper();

const matchesPurchaseOrderFilter = (row, filterId, filterValue) => {
  if (filterValue == null || filterValue === '') return true;
  if (Array.isArray(filterValue) && filterValue.length === 0) return true;

  const multiselectFields = [
    'po',
    'company',
    'groupCustomer',
    'customer',
    'top',
    'type',
    'status',
    'plu',
    'barcode',
    'internal_item_code',
    'nama_barang',
  ];

  if (multiselectFields.includes(filterId)) {
    if (!Array.isArray(filterValue)) {
      const rowVal = String(row[filterId] ?? '').toLowerCase();
      return rowVal.includes(String(filterValue).toLowerCase().trim());
    }
    if (filterValue.length === 0) return true;
    return filterValue.includes(row[filterId]);
  }

  if (filterId === 'tanggal_masuk' || filterId === 'tanggal_kirim') {
    const cellValue = String(row[filterId] || '');
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

const getMatchingPurchaseOrderRowsExcluding = (rows, columnFilters, excludeFilterId) => {
  if (!rows || rows.length === 0) return [];
  if (!columnFilters || columnFilters.length === 0) return rows;

  return rows.filter((row) => {
    for (const filter of columnFilters) {
      if (filter.id === excludeFilterId) continue;
      if (!matchesPurchaseOrderFilter(row, filter.id, filter.value)) {
        return false;
      }
    }
    return true;
  });
};

const PurchaseOrderExportPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  previewLoading,
  onExport,
}) => {
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setColumnFilters([]);
    }
  }, [isOpen]);

  const formattedData = useMemo(() => {
    const rawData = previewData?.data || previewData;
    if (!rawData || !Array.isArray(rawData)) return [];

    return rawData.map((row) => {
      if (Array.isArray(row)) {
        return {
          po: row[0] || '',
          company: row[1] || '',
          groupCustomer: row[2] || '',
          customer: row[3] || '',
          tanggal_masuk: row[4] || '',
          tanggal_kirim: row[5] || '',
          top: row[6] || '',
          type: row[7] || '',
          status: row[8] || '',
          plu: row[9] || '',
          barcode: row[10] || '',
          internal_item_code: row[11] || '',
          nama_barang: row[12] || '',
          qty: Number(row[13]) || 0,
          harga: Number(row[14]) || 0,
          potongan_a: Number(row[15]) || 0,
          harga_after_potongan_a: Number(row[16]) || 0,
          potongan_b: Number(row[17]) || 0,
          harga_after_potongan_b: Number(row[18]) || 0,
          harga_netto: Number(row[19]) || 0,
          vatRate: Number(row[20]) || 0,
          total_pembelian: Number(row[21]) || 0,
          grand_total: Number(row[22]) || 0,
        };
      }
      return {
        po: row.po || row.po_number || '',
        company: row.company || '',
        groupCustomer: row.groupCustomer || '',
        customer: row.customer || '',
        tanggal_masuk: row.tanggal_masuk || '',
        tanggal_kirim: row.tanggal_kirim || '',
        top: row.top || '',
        type: row.type || '',
        status: row.status || '',
        plu: row.plu || '',
        barcode: row.barcode || '',
        internal_item_code: row.internal_item_code || '',
        nama_barang: row.nama_barang || '',
        qty: Number(row.qty) || 0,
        harga: Number(row.harga) || 0,
        potongan_a: Number(row.potongan_a) || 0,
        harga_after_potongan_a: Number(row.harga_after_potongan_a) || 0,
        potongan_b: Number(row.potongan_b) || 0,
        harga_after_potongan_b: Number(row.harga_after_potongan_b) || 0,
        harga_netto: Number(row.harga_netto) || 0,
        vatRate: Number(row.vatRate) || 0,
        total_pembelian: Number(row.total_pembelian) || 0,
        grand_total: Number(row.grand_total) || 0,
      };
    });
  }, [previewData]);

  const getDynamicOptions = (field) => {
    const matchingRows = getMatchingPurchaseOrderRowsExcluding(formattedData, columnFilters, field);
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

  const poOptions = useMemo(() => getDynamicOptions('po'), [formattedData, columnFilters]);
  const companyOptions = useMemo(() => getDynamicOptions('company'), [formattedData, columnFilters]);
  const customerOptions = useMemo(() => getDynamicOptions('customer'), [formattedData, columnFilters]);
  const groupCustomerOptions = useMemo(() => getDynamicOptions('groupCustomer'), [formattedData, columnFilters]);
  const topOptions = useMemo(() => getDynamicOptions('top'), [formattedData, columnFilters]);
  const typeOptions = useMemo(() => getDynamicOptions('type'), [formattedData, columnFilters]);
  const statusOptions = useMemo(() => getDynamicOptions('status'), [formattedData, columnFilters]);
  const pluOptions = useMemo(() => getDynamicOptions('plu'), [formattedData, columnFilters]);
  const barcodeOptions = useMemo(() => getDynamicOptions('barcode'), [formattedData, columnFilters]);
  const itemCodeOptions = useMemo(() => getDynamicOptions('internal_item_code'), [formattedData, columnFilters]);
  const namaBarangOptions = useMemo(() => getDynamicOptions('nama_barang'), [formattedData, columnFilters]);

  const columns = useMemo(
    () => [
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
          <span className="font-medium text-gray-900 whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('company', {
        id: 'company',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Company</div>
            <AutocompleteCheckboxLimitTag
              options={companyOptions}
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
      columnHelper.accessor('groupCustomer', {
        id: 'groupCustomer',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Group Customer</div>
            <AutocompleteCheckboxLimitTag
              options={groupCustomerOptions}
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
      columnHelper.accessor('tanggal_masuk', {
        id: 'tanggal_masuk',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Tgl Masuk</div>
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
      columnHelper.accessor('tanggal_kirim', {
        id: 'tanggal_kirim',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Tgl Kirim</div>
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
          <span className="text-gray-600 whitespace-nowrap font-mono">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Type</div>
            <AutocompleteCheckboxLimitTag
              options={typeOptions}
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
        cell: (info) => {
          const val = info.getValue() || '';
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                val.includes('COMPLETED') || val.includes('LUNAS')
                  ? 'bg-green-50 text-green-700'
                  : val.includes('PROCESSING') || val.includes('PROSES')
                  ? 'bg-blue-50 text-blue-700'
                  : val.includes('CANCEL') || val.includes('BATAL')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-yellow-50 text-yellow-700'
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
      columnHelper.accessor('barcode', {
        id: 'barcode',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Barcode</div>
            <AutocompleteCheckboxLimitTag
              options={barcodeOptions}
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
      columnHelper.accessor('internal_item_code', {
        id: 'internal_item_code',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Kode Barang</div>
            <AutocompleteCheckboxLimitTag
              options={itemCodeOptions}
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
          <span className="text-gray-900 font-medium whitespace-nowrap">
            {info.getValue() || '-'}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) return true;
          const val = row.getValue(columnId);
          return filterValue.includes(val);
        },
      }),
      columnHelper.accessor('qty', {
        id: 'qty',
        header: () => <div className="text-right font-medium text-xs">Qty (Pcs)</div>,
        cell: (info) => (
          <div className="text-right font-medium text-gray-900">
            {Number(info.getValue() || 0).toLocaleString('id-ID')}
          </div>
        ),
      }),
      columnHelper.accessor('harga', {
        id: 'harga',
        header: () => <div className="text-right font-medium text-xs">Harga (Base)</div>,
        cell: (info) => (
          <div className="text-right text-gray-700">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('potongan_a', {
        id: 'potongan_a',
        header: () => <div className="text-right font-medium text-xs">Pot A (%)</div>,
        cell: (info) => (
          <div className="text-right text-gray-600">
            {Number(info.getValue() || 0).toLocaleString('id-ID')}%
          </div>
        ),
      }),
      columnHelper.accessor('harga_after_potongan_a', {
        id: 'harga_after_potongan_a',
        header: () => <div className="text-right font-medium text-xs">Harga Pot A</div>,
        cell: (info) => (
          <div className="text-right text-gray-700">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('potongan_b', {
        id: 'potongan_b',
        header: () => <div className="text-right font-medium text-xs">Pot B (%)</div>,
        cell: (info) => (
          <div className="text-right text-gray-600">
            {Number(info.getValue() || 0).toLocaleString('id-ID')}%
          </div>
        ),
      }),
      columnHelper.accessor('harga_after_potongan_b', {
        id: 'harga_after_potongan_b',
        header: () => <div className="text-right font-medium text-xs">Harga Pot B</div>,
        cell: (info) => (
          <div className="text-right text-gray-700">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('harga_netto', {
        id: 'harga_netto',
        header: () => <div className="text-right font-medium text-xs">Netto</div>,
        cell: (info) => (
          <div className="text-right text-gray-700">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('vatRate', {
        id: 'vatRate',
        header: () => <div className="text-right font-medium text-xs">PPN (%)</div>,
        cell: (info) => (
          <div className="text-right text-gray-600">
            {Number(info.getValue() || 0).toLocaleString('id-ID')}%
          </div>
        ),
      }),
      columnHelper.accessor('total_pembelian', {
        id: 'total_pembelian',
        header: () => <div className="text-right font-medium text-xs">Total</div>,
        cell: (info) => (
          <div className="text-right font-semibold text-gray-900">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: () => <div className="text-right font-medium text-xs">Grand Total</div>,
        cell: (info) => (
          <div className="text-right font-semibold text-green-700">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
    ],
    [
      customerOptions,
      groupCustomerOptions,
      topOptions,
      typeOptions,
      statusOptions,
    ]
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
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full border border-gray-100">
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
                Preview Hasil Export Excel Purchase Order
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

export default PurchaseOrderExportPreviewModal;
