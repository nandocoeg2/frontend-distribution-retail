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
import authService from '../../services/authService';
import DateFilter from '../common/DateFilter';

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

      // Handle Invoice No
      if (mappedFilters.invoice_no) {
        if (Array.isArray(mappedFilters.invoice_no) && mappedFilters.invoice_no.length > 0) {
          mappedFilters.invoice_nos = mappedFilters.invoice_no;
        }
        delete mappedFilters.invoice_no;
      }

      // Handle PO No
      if (mappedFilters.po_number) {
        if (Array.isArray(mappedFilters.po_number) && mappedFilters.po_number.length > 0) {
          mappedFilters.po_numbers = mappedFilters.po_number;
        }
        delete mappedFilters.po_number;
      }

      // Handle Grand Total Range
      if (mappedFilters.grand_total) {
        if (mappedFilters.grand_total.min) mappedFilters.grand_total_min = mappedFilters.grand_total.min;
        if (mappedFilters.grand_total.max) mappedFilters.grand_total_max = mappedFilters.grand_total.max;
        delete mappedFilters.grand_total;
      }

      // Handle Jatuh Tempo date range (calculated field - filter via tanggal + batas_hari)
      if (mappedFilters.tanggal_jatuh_tempo) {
        if (mappedFilters.tanggal_jatuh_tempo.from) mappedFilters.tanggal_jatuh_tempo_start = mappedFilters.tanggal_jatuh_tempo.from;
        if (mappedFilters.tanggal_jatuh_tempo.to) mappedFilters.tanggal_jatuh_tempo_end = mappedFilters.tanggal_jatuh_tempo.to;
        delete mappedFilters.tanggal_jatuh_tempo;
      }

      // Handle TTF 1 date range
      if (mappedFilters.tanggal_print_ttf1) {
        if (mappedFilters.tanggal_print_ttf1.from) mappedFilters.tanggal_print_ttf1_start = mappedFilters.tanggal_print_ttf1.from;
        if (mappedFilters.tanggal_print_ttf1.to) mappedFilters.tanggal_print_ttf1_end = mappedFilters.tanggal_print_ttf1.to;
        delete mappedFilters.tanggal_print_ttf1;
      }

      // Handle TTF 2 date range
      if (mappedFilters.tanggal_upload_ttf2) {
        if (mappedFilters.tanggal_upload_ttf2.from) mappedFilters.tanggal_upload_ttf2_start = mappedFilters.tanggal_upload_ttf2.from;
        if (mappedFilters.tanggal_upload_ttf2.to) mappedFilters.tanggal_upload_ttf2_end = mappedFilters.tanggal_upload_ttf2.to;
        delete mappedFilters.tanggal_upload_ttf2;
      }

      // Handle Tanggal Bayar date range
      if (mappedFilters.tanggal_bayar) {
        if (mappedFilters.tanggal_bayar.from) mappedFilters.tanggal_bayar_start = mappedFilters.tanggal_bayar.from;
        if (mappedFilters.tanggal_bayar.to) mappedFilters.tanggal_bayar_end = mappedFilters.tanggal_bayar.to;
        delete mappedFilters.tanggal_bayar;
      }

      // Handle Total Payment Range
      if (mappedFilters.total_payment) {
        if (mappedFilters.total_payment.min) mappedFilters.total_payment_min = mappedFilters.total_payment.min;
        if (mappedFilters.total_payment.max) mappedFilters.total_payment_max = mappedFilters.total_payment.max;
        delete mappedFilters.total_payment;
      }

      const companyId = authService.getCompanyData()?.id;

      return {
        ...rest,
        filters: {
          ...mappedFilters,
          ...(companyId ? { companyId } : {}),
        },
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
    initialPage: 1,
    initialLimit: 9999,
    globalFilter: globalFilterConfig,
    getQueryParams,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('tanggal', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Billing Date</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
        enableSorting: true,
        cell: (info) => <div className="font-medium text-xs">{formatDate(info.getValue())}</div>,
        size: 90,
      }),
      columnHelper.accessor(
        (row) => row?.invoicePenagihan?.purchaseOrder?.customer?.namaCustomer ?? '-',
        {
          id: 'group_customer_name',
          header: ({ column }) => (
            <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
              <div className="font-medium text-xs">Customer</div>
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
            const customer = row?.invoicePenagihan?.purchaseOrder?.customer;
            const customerName = customer?.namaCustomer || '-';
            const customerCode = customer?.kodeCustomer || '-';
            const groupName = customer?.groupCustomer?.nama_group || row?.groupCustomer?.nama_group || '';
            return (
              <div className="leading-tight">
                <div className="text-xs font-medium text-gray-900">{`${customerName} (${customerCode})`}</div>
                {groupName && <div className="text-[10px] text-gray-500">{groupName}</div>}
              </div>
            );
          },
        }
      ),
      columnHelper.accessor((row) => {
        return row.invoicePenagihan?.no_invoice_penagihan || '';
      }, {
        id: 'invoice_no',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Invoice No</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => {
          const invoiceNo = info.getValue();
          return (
            <div className="text-xs text-gray-700 whitespace-nowrap">
              {invoiceNo || <span className="text-gray-400">-</span>}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor((row) => {
        return row.invoicePenagihan?.purchaseOrder?.po_number || '';
      }, {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">PO No</div>
            <input
              type="text"
              value={column.getFilterValue() ?? ''}
              onChange={(event) => {
                column.setFilterValue(event.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ),
        cell: (info) => {
          const poNo = info.getValue();
          return (
            <div className="text-xs text-gray-700 whitespace-nowrap">
              {poNo || <span className="text-gray-400">-</span>}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor((row) => {
        return Number(row.invoicePenagihan?.grand_total) || 0;
      }, {
        id: 'grand_total_invoice', // Virtual column
        header: 'Grand Total Invoice',
        cell: (info) => <div className="text-xs font-medium text-gray-900 text-right">{formatCurrency(info.getValue())}</div>,
        enableSorting: false,
        size: 110,
      }),
      columnHelper.accessor('termOfPayment.kode_top', {
        id: 'top_codes',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">TOP</div>
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
              sx={{ minWidth: '50px', maxWidth: '70px' }}
            />
          </div>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-xs font-medium text-gray-900">{info.getValue() || '-'}</div>
            </div>
          );
        },
        size: 55,
      }),

      columnHelper.accessor('grand_total', {
        id: 'grand_total',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs text-right">Total TTF</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  value={filterValue.min ?? ''}
                  onChange={(e) => {
                    column.setFilterValue({ ...filterValue, min: e.target.value });
                    setPage(1);
                  }}
                  placeholder="Min"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right pr-1"
                />
                <input
                  type="number"
                  value={filterValue.max ?? ''}
                  onChange={(e) => {
                    column.setFilterValue({ ...filterValue, max: e.target.value });
                    setPage(1);
                  }}
                  placeholder="Max"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right pr-1"
                />
              </div>
            </div>
          )
        },
        enableSorting: true,
        cell: (info) => <div className="text-xs font-semibold text-gray-900 text-right">{formatCurrency(info.getValue())}</div>,
        enableColumnFilter: true,
        size: 110,
      }),
      // Tanggal Jatuh Tempo (calculated: tanggal + batas_hari)
      columnHelper.accessor((row) => {
        const tanggal = row.tanggal ? new Date(row.tanggal) : null;
        const batasHari = row.termOfPayment?.batas_hari || 0;
        if (!tanggal) return null;
        const jatuhTempo = new Date(tanggal);
        jatuhTempo.setDate(jatuhTempo.getDate() + batasHari);
        return jatuhTempo;
      }, {
        id: 'tanggal_jatuh_tempo',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Jatuh Tempo</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
        cell: (info) => {
          const value = info.getValue();
          return <div className="text-xs text-gray-700">{value ? formatDate(value) : '-'}</div>;
        },
        enableSorting: true,
        size: 90,
      }),
      // Tanggal TTF 1 (Print date)
      columnHelper.accessor('tanggal_print_ttf1', {
        id: 'tanggal_print_ttf1',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">TTF 1</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
        cell: (info) => <div className="text-xs text-gray-700">{info.getValue() ? formatDate(info.getValue()) : '-'}</div>,
        enableSorting: true,
        size: 90,
      }),
      // Tanggal TTF 2 (Upload/Validation date)
      columnHelper.accessor('tanggal_upload_ttf2', {
        id: 'tanggal_upload_ttf2',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">TTF 2</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
        cell: (info) => <div className="text-xs text-gray-700">{info.getValue() ? formatDate(info.getValue()) : '-'}</div>,
        enableSorting: true,
        size: 90,
      }),
      // Tanggal Bayar (from BankMutation)
      columnHelper.accessor('bankMutation.tanggal_transaksi', {
        id: 'tanggal_bayar',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs">Tgl Bayar</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
        cell: (info) => <div className="text-xs text-gray-700">{info.getValue() ? formatDate(info.getValue()) : '-'}</div>,
        enableSorting: true,
        size: 90,
      }),
      // Total Payment (from BankMutation)
      columnHelper.accessor((row) => Number(row.bankMutation?.jumlah) || 0, {
        id: 'total_payment',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { min: '', max: '' };
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-xs text-right">Payment</div>
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  value={filterValue.min ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, min: e.target.value }); setPage(1); }}
                  placeholder="Min"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right pr-1"
                />
                <input
                  type="number"
                  value={filterValue.max ?? ''}
                  onChange={(e) => { column.setFilterValue({ ...filterValue, max: e.target.value }); setPage(1); }}
                  placeholder="Max"
                  className="w-full px-1 py-0.5 text-[10px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right pr-1"
                />
              </div>
            </div>
          );
        },
        cell: (info) => {
          const value = info.getValue();
          return <div className="text-xs font-medium text-gray-900 text-right">{value > 0 ? formatCurrency(value) : '-'}</div>;
        },
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status', // For sorting, backend expects 'statusId' or similar? Or maybe it doesn't support sorting by status name. 
        // The error message allowed 'createdAt', 'updatedAt', 'grand_total', 'tanggal', 'kode_top', 'group_customer_name', 'group_customer_code', 'company_name', 'code_supplier'.
        // It DOES NOT list status. So sorting by status might fail if I send 'status' or 'status_name'.
        // I will disable sorting for status for now or assume it is not supported to avoid errors, 
        // OR I should check if I can map it. For now, disable sorting for Status to be safe.
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
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
              sx={{ minWidth: '60px', maxWidth: '80px' }}
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
        size: 85,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="font-medium text-xs">Act</div>,
        size: 90,
        cell: ({ row }) => {
          const item = row.original;
          // All relations are now one-to-one (single object, not array)
          const hasLaporan = !!item?.laporanPenerimaanBarang;
          const hasInvoice = !!item?.invoicePenagihan;
          const hasFaktur = !!item?.fakturPajak;
          const hasAssignedDocuments = hasLaporan || hasInvoice || hasFaktur;
          const disableAssign = assignLoading || typeof onAssignDocuments !== 'function';
          const disableUnassign =
            unassignLoading ||
            typeof onUnassignDocuments !== 'function' ||
            !hasAssignedDocuments;

          return (
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAssignDocuments?.(item); }}
                className="p-0.5 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Assign dokumen"
                disabled={disableAssign}
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUnassignDocuments?.(item); }}
                className="p-0.5 text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Unassign dokumen"
                disabled={disableUnassign}
              >
                <LinkSlashIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="p-0.5 text-green-600 hover:text-green-900"
                title="Ubah"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                disabled={deleteLoading}
                className="p-0.5 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hapus"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
        enableSorting: false,
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
    <div className="space-y-2">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
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
        loadingMessage="Memuat data..."
        emptyMessage="Tidak ada data tanda terima faktur."
        emptyFilteredMessage="Tidak ada data yang sesuai."
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
        headerRowClassName="bg-gray-50"
        headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider"
        bodyClassName="bg-white divide-y divide-gray-100"
        rowClassName="hover:bg-gray-50 h-7"
        getRowClassName={({ row }) => {
          if (!row || !row.original) return undefined;
          if (row.original.id === selectedTTFId) {
            return 'bg-blue-50 border-l-2 border-blue-500';
          }
          return undefined;
        }}
        onRowClick={(rowData) => {
          if (onView) onView(rowData);
        }}
        cellClassName="px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900"
        emptyCellClassName="px-1.5 py-0.5 text-center text-gray-500"
        footerRowClassName="bg-gray-200 font-bold sticky bottom-0 z-10"
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-1.5 py-0.5 text-xs border-t border-gray-300 text-center"
              >
                {pagination?.totalItems || 0}
              </td>
            ))}
          </tr>
        }
      />
    </div>
  );
};

export default TandaTerimaFakturTableServerSide;
