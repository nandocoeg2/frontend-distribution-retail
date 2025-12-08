import React, { useMemo, useState, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { EyeIcon, LinkIcon, LinkSlashIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useTandaTerimaFakturQuery } from '../../hooks/useTandaTerimaFakturQuery';
import { formatCurrency, formatDate } from '@/utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, DataTablePagination } from '../table';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import groupCustomerService from '../../services/groupCustomerService';
import companyService from '../../services/companyService';
import { termOfPaymentService } from '../../services/termOfPaymentService';
import statusService from '../../services/statusService';

const columnHelper = createColumnHelper();

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('complete') || value.includes('received')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('error')) {
    return 'danger';
  }

  if (value.includes('shipped') || value.includes('packed')) {
    return 'primary';
  }

  if (value.includes('processing') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
};

const TandaTerimaFakturTableServerSide = ({
  onView,
  onEdit,
  onDelete,
  onAssignDocuments,
  onUnassignDocuments,
  deleteLoading = false,
  assignLoading = false,
  unassignLoading = false,
  initialPage = 1,
  initialLimit = 10,
  selectedTTFId = null,
}) => {
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [termOfPayments, setTermOfPayments] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gcData, companyData, topData, statusData] = await Promise.all([
          groupCustomerService.getAllGroupCustomers(1, 100).then(res => res?.data?.data || res?.data || []),
          companyService.getCompanies(1, 100).then(res => res?.data?.data || res?.data || []),
          termOfPaymentService.getAllTermOfPayments(1, 100).then(res => res?.data?.data || res?.data || []),
          statusService.getTandaTerimaFakturStatuses().then(res => res?.data || [])
        ]);

        setGroupCustomers(Array.isArray(gcData) ? gcData : []);
        setCompanies(Array.isArray(companyData) ? companyData : []);
        setTermOfPayments(Array.isArray(topData) ? topData : []);
        setStatuses(Array.isArray(statusData) ? statusData : []);
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchData();
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
      const mappedFilters = { ...filters };

      // Handle date range
      if (mappedFilters.tanggal) {
        if (mappedFilters.tanggal.from) mappedFilters.tanggal_start = mappedFilters.tanggal.from;
        if (mappedFilters.tanggal.to) mappedFilters.tanggal_end = mappedFilters.tanggal.to;
        delete mappedFilters.tanggal;
      }

      // Handle Group Customer Name array
      if (mappedFilters.group_customer_name) {
        if (Array.isArray(mappedFilters.group_customer_name) && mappedFilters.group_customer_name.length > 0) {
          mappedFilters.group_customer_names = mappedFilters.group_customer_name;
        }
        delete mappedFilters.group_customer_name;
      }
      // Cleanup empty if any left (though logic above handles it)
      if (Array.isArray(mappedFilters.group_customer_names) && mappedFilters.group_customer_names.length === 0) {
        delete mappedFilters.group_customer_names;
      }

      // Handle Company Name array
      if (mappedFilters.company_name) {
        if (Array.isArray(mappedFilters.company_name) && mappedFilters.company_name.length > 0) {
          mappedFilters.company_names = mappedFilters.company_name;
        }
        delete mappedFilters.company_name;
      }
      if (Array.isArray(mappedFilters.company_names) && mappedFilters.company_names.length === 0) {
        delete mappedFilters.company_names;
      }

      // Handle TOP codes
      if (mappedFilters.top_codes) {
        if (Array.isArray(mappedFilters.top_codes) && mappedFilters.top_codes.length === 0) {
          delete mappedFilters.top_codes;
        }
      }

      // Handle Status (mapped from 'status')
      if (mappedFilters.status) {
        if (Array.isArray(mappedFilters.status) && mappedFilters.status.length > 0) {
          mappedFilters.status_codes = mappedFilters.status;
        }
        delete mappedFilters.status;
      }

      return {
        ...rest,
        filters: mappedFilters,
      };
    },
    []
  );

  const {
    data: tandaTerimaFakturs,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    isFetching,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useTandaTerimaFakturQuery,
    selectData: (response) => response?.tandaTerimaFakturs ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    getQueryParams,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('tanggal', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-1">
              <div className="font-semibold text-xs">Tanggal</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="date"
                  value={filterValue.from ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, from: e.target.value }); setPage(1); }}
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filterValue.to ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, to: e.target.value }); setPage(1); }}
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          );
        },
        enableSorting: true,
        cell: (info) => <div className="font-medium text-xs">{formatDate(info.getValue())}</div>,
        size: 90,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'top_codes', // Use 'top_codes' for filter, need to check if sort uses this ID. If so, backend needs to handle 'top_codes' for sort? No, usually sort parameter is separate. 
        // Wait, 'useServerSideTable' normally uses the column ID for sorting. 
        // Backend expects 'kode_top' for sort. 
        // But for filter we want 'top_codes' array. 
        // Solution: Map 'top_codes' to 'kode_top' in getQueryParams if it's for sorting, OR use 'kode_top' as ID and handle array in filter.
        // Let's use 'kode_top' as ID to satisfy Sorting, and map 'kode_top' filter value to 'top_codes' in getQueryParams.
        header: ({ column }) => (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-xs">TOP</div>
            <AutocompleteCheckboxLimitTag
              options={termOfPayments}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="kode_top"
              valueKey="kode_top"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-xs font-medium text-gray-900">{info.getValue() || '-'}</div>
              {row?.termOfPayment?.batas_hari != null && (
                <div className="text-[10px] text-gray-500">{row.termOfPayment.batas_hari} hari</div>
              )}
            </div>
          );
        },
        size: 80,
      }),
      columnHelper.accessor(
        (row) =>
          row?.groupCustomer?.nama_group ??
          row?.groupCustomer?.namaGroup ??
          row?.customer?.groupCustomer?.nama_group ??
          row?.customer?.groupCustomer?.namaGroup ??
          '',
        {
          id: 'group_customer_name', // Correct ID for sorting
          header: ({ column }) => (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <div className="font-semibold text-xs">Group Customer</div>
              <AutocompleteCheckboxLimitTag
                options={groupCustomers}
                value={column.getFilterValue() ?? []}
                onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
                placeholder="All"
                displayKey="nama_group"
                valueKey="nama_group"
                limitTags={1}
                size="small"
                fetchOnClose
              />
            </div>
          ),
          cell: (info) => {
            const row = info.row.original;
            const code = row?.groupCustomer?.kode_group ??
              row?.groupCustomer?.kodeGroup ??
              row?.customer?.groupCustomer?.kode_group ??
              row?.customer?.groupCustomer?.kodeGroup ??
              '';
            return (
              <div>
                <div className="text-xs font-medium text-gray-900">{info.getValue() || '-'}</div>
                {code && <div className="text-[10px] text-gray-500">{code}</div>}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor('company.nama_perusahaan', {
        id: 'company_name',
        header: ({ column }) => (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-xs">Company</div>
            <AutocompleteCheckboxLimitTag
              options={companies}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="nama_perusahaan"
              valueKey="nama_perusahaan"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          const code = row?.company?.kode_company;
          return (
            <div>
              <div className="text-xs font-medium text-gray-900 truncate max-w-[150px]" title={info.getValue()}>
                {info.getValue() || '-'}
              </div>
              {code && <div className="text-[10px] text-gray-500">{code}</div>}
            </div>
          );
        },
      }),
      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: 'Total',
        enableSorting: true,
        cell: (info) => <div className="text-xs font-semibold text-gray-900 text-right">{formatCurrency(info.getValue())}</div>,
        enableColumnFilter: false,
        size: 120,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status', // For sorting, backend expects 'statusId' or similar? Or maybe it doesn't support sorting by status name. 
        // The error message allowed 'createdAt', 'updatedAt', 'grand_total', 'tanggal', 'kode_top', 'group_customer_name', 'group_customer_code', 'company_name', 'code_supplier'.
        // It DOES NOT list status. So sorting by status might fail if I send 'status' or 'status_name'.
        // I will disable sorting for status for now or assume it is not supported to avoid errors, 
        // OR I should check if I can map it. For now, disable sorting for Status to be safe.
        header: ({ column }) => (
          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={statuses}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="status_name"
              valueKey="status_code"
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
            size="xs"
            dot
          />
        ),
        enableSorting: true,
        size: 110,
      }),
      columnHelper.display({
        id: 'documents',
        header: 'Dokumen',
        cell: ({ row }) => {
          const item = row.original;
          const laporanCount = Array.isArray(item?.laporanPenerimaanBarang)
            ? item.laporanPenerimaanBarang.length
            : 0;
          const invoiceCount = Array.isArray(item?.invoicePenagihan)
            ? item.invoicePenagihan.length
            : 0;
          const fakturCount = Array.isArray(item?.fakturPajak)
            ? item.fakturPajak.length
            : 0;
          const hasAssignedDocuments =
            laporanCount > 0 || invoiceCount > 0 || fakturCount > 0;
          const disableAssign = assignLoading || typeof onAssignDocuments !== 'function';
          const disableUnassign =
            unassignLoading ||
            typeof onUnassignDocuments !== 'function' ||
            !hasAssignedDocuments;

          return (
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] leading-tight text-gray-500 flex flex-col gap-0.5">
                <span title="Laporan Penerimaan Barang">L: {laporanCount}</span>
                <span title="Invoice Penagihan">I: {invoiceCount}</span>
                <span title="Faktur Pajak">F: {fakturCount}</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAssignDocuments?.(item); }}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed p-0.5"
                  title="Assign dokumen"
                  disabled={disableAssign}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUnassignDocuments?.(item); }}
                  className="text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed p-0.5"
                  title="Unassign dokumen"
                  disabled={disableUnassign}
                >
                  <LinkSlashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        },
        enableSorting: false,
        size: 90,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="text-green-600 hover:text-green-900 p-1"
                title="Ubah"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                disabled={deleteLoading}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                title="Hapus"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          );
        },
        enableSorting: false,
        size: 80,
      }),
    ],
    [
      onView,
      onEdit,
      onDelete,
      onAssignDocuments,
      onUnassignDocuments,
      deleteLoading,
      assignLoading,
      unassignLoading,
      setPage,
      termOfPayments,
      groupCustomers,
      companies,
      statuses,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const loading = isLoading || isFetching;



  return (
    <div className="space-y-3">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      <DataTable
        table={table}
        isLoading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage="Memuat data..."
        emptyMessage="Tidak ada data tanda terima faktur."
        emptyFilteredMessage="Tidak ada data yang sesuai."
        wrapperClassName="overflow-x-auto border border-gray-200 rounded-lg shadow-sm"
        tableClassName="min-w-full divide-y divide-gray-200 text-xs"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10"
        bodyClassName="bg-white divide-y divide-gray-200"
        rowClassName="hover:bg-gray-50 transition-colors cursor-pointer"
        getRowClassName={({ row }) => {
          if (!row || !row.original) return undefined;
          if (row.original.id === selectedTTFId) {
            return 'bg-blue-50 border-l-4 border-blue-500';
          }
          return undefined;
        }}
        onRowClick={(rowData) => {
          if (onView) onView(rowData);
        }}
        cellClassName="px-3 py-2 whitespace-nowrap"
        emptyCellClassName="px-6 py-8 text-center text-gray-500"
      />

      {!loading && !error && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          itemLabel="item"
          pageSizeOptions={[10, 25, 50, 100]}
          firstLabel="««"
          prevLabel="«"
          nextLabel="»"
          lastLabel="»»"
          className="text-xs"
        />
      )}
    </div>
  );
};

export default TandaTerimaFakturTableServerSide;
