import React, { useMemo, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon,
  PrinterIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { usePackingsQuery } from '../../hooks/usePackingsQuery';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, TableFooterCell } from '../table';
import { formatDate } from '../../utils/formatUtils';
import { exportPackingStickerBulk, exportPackingTandaTerimaGroupedBulk, exportExcel, previewExportExcel, bulkUpdateTanggalPacking } from '../../services/packingService';
import authService from '../../services/authService';
import toastService from '../../services/toastService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import PdfPreviewModal from '../common/PdfPreviewModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';
import PackingExportPreviewModal from './PackingExportPreviewModal';


const columnHelper = createColumnHelper();

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('delivered') || value.includes('complete')) {
    return 'success';
  }

  if (
    value.includes('cancelled') ||
    value.includes('failed') ||
    value.includes('error')
  ) {
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

const processingStatusVariants = [
  'processing packing',
  'processing packing order',
];

const normalizeStatusValue = (value) => {
  if (!value) {
    return '';
  }

  return value.toString().trim().toLowerCase().replace(/_/g, ' ');
};

const isProcessingStatus = (packing) => {
  if (!packing?.status) {
    return false;
  }

  const normalizedName = normalizeStatusValue(packing.status.status_name);
  const normalizedCode = normalizeStatusValue(packing.status.status_code);

  return (
    processingStatusVariants.includes(normalizedName) ||
    processingStatusVariants.includes(normalizedCode)
  );
};

const PackingTableServerSide = forwardRef(({
  onEdit,
  onDelete,
  deleteLoading = false,
  selectedPackings = [],
  onSelectPacking,
  onSelectAllPackings,
  onProcessSelected,
  onCompleteSelected,
  isProcessing = false,
  isCompleting = false,
  hasSelectedPackings = false,
  onRowClick,
  selectedPackingId,
}, ref) => {
  const companyId = authService.getCompanyData()?.id;
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingTandaTerimaGrouped, setIsPrintingTandaTerimaGrouped] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [isEditTanggalModalOpen, setIsEditTanggalModalOpen] = useState(false);
  const [editTanggalLoading, setEditTanggalLoading] = useState(false);
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [isPrinterSelectionModalOpen, setIsPrinterSelectionModalOpen] = useState(false);

  // PDF Preview states
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('document.pdf');

  // Excel Preview states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Status options for multi-select filter
  const statusOptions = useMemo(() => [
    { id: 'PENDING PACKING', name: 'Pending' },
    { id: 'PROCESSING PACKING', name: 'Processing' },
    { id: 'COMPLETED PACKING', name: 'Completed' },
  ], []);

  // Fetch customers for multi-select filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100, { hasPacking: true });
        const data = response?.data?.data || response?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Map filters to backend query params
  const getQueryParams = useCallback(({ filters, ...rest }) => {
    const mappedFilters = { ...filters };

    // Handle array of PO numbers for multi-select
    if (mappedFilters.po_number) {
      if (Array.isArray(mappedFilters.po_number) && mappedFilters.po_number.length === 0) {
        delete mappedFilters.po_number;
      }
    }

    // Handle array of customer IDs for multi-select
    if (mappedFilters.customer_name) {
      if (Array.isArray(mappedFilters.customer_name) && mappedFilters.customer_name.length > 0) {
        mappedFilters.customerIds = mappedFilters.customer_name;
      }
      delete mappedFilters.customer_name;
    }

    // Handle array of status codes for multi-select
    if (mappedFilters.status) {
      if (Array.isArray(mappedFilters.status) && mappedFilters.status.length > 0) {
        mappedFilters.status_codes = mappedFilters.status;
      }
      delete mappedFilters.status;
    }

    // Handle date range filters for tanggal_packing
    if (mappedFilters.tanggal_packing && typeof mappedFilters.tanggal_packing === 'object') {
      if (mappedFilters.tanggal_packing.from) {
        mappedFilters.tanggal_packing_from = mappedFilters.tanggal_packing.from;
      }
      if (mappedFilters.tanggal_packing.to) {
        mappedFilters.tanggal_packing_to = mappedFilters.tanggal_packing.to;
      }
      delete mappedFilters.tanggal_packing;
    }

    if (mappedFilters.is_printed) {
      if (Array.isArray(mappedFilters.is_printed)) {
        if (mappedFilters.is_printed.length === 1) {
          mappedFilters.is_printed = mappedFilters.is_printed[0] === 'true';
        } else {
          delete mappedFilters.is_printed;
        }
      } else if (typeof mappedFilters.is_printed === 'string' && mappedFilters.is_printed !== '') {
        mappedFilters.is_printed = mappedFilters.is_printed === 'true';
      }
    }

    // Handle date range filters for tanggal_expired
    if (mappedFilters.tanggal_expired && typeof mappedFilters.tanggal_expired === 'object') {
      if (mappedFilters.tanggal_expired.from) {
        mappedFilters.tanggal_expired_from = mappedFilters.tanggal_expired.from;
      }
      if (mappedFilters.tanggal_expired.to) {
        mappedFilters.tanggal_expired_to = mappedFilters.tanggal_expired.to;
      }
      delete mappedFilters.tanggal_expired;
    }

    if (companyId) {
      mappedFilters.companyId = companyId;
    }

    return {
      ...rest,
      filters: mappedFilters,
    };
  }, [companyId]);

  const handleBulkPrintSticker = async () => {
    if (!selectedPackings || selectedPackings.length === 0) {
      toastService.error('Tidak ada packing yang dipilih');
      return;
    }
    setIsPrinterSelectionModalOpen(true);
  };

  const handleConfirmPrintSticker = async (printerType) => {
    setIsPrinterSelectionModalOpen(false);
    setIsPrinting(true);
    try {
      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info(`Memproses ${selectedPackings.length} stiker (${printerType === 'type1' ? 'Tipe 1' : 'Tipe 2'})...`);

      // Call backend API to get Bulk HTML
      const html = await exportPackingStickerBulk(selectedPackings, companyData.id, printerType);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Stiker Preview (${selectedPackings.length} dokumen) - ${printerType === 'type1' ? 'Tipe 1' : 'Tipe 2'}`);
      setPreviewFileName(`stiker-bulk-${printerType}-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success(`Berhasil membuka stiker untuk ${selectedPackings.length} packing`);
    } catch (error) {
      console.error('Error in bulk print sticker:', error);
      toastService.error(error.message || 'Gagal mencetak stiker');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBulkPrintTandaTerimaGrouped = async () => {
    if (!selectedPackings || selectedPackings.length === 0) {
      toastService.error('Tidak ada packing yang dipilih');
      return;
    }

    setIsPrintingTandaTerimaGrouped(true);
    try {
      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info(`Memproses ${selectedPackings.length} tanda terima grouped...`);

      // Call backend API to get Bulk HTML
      const html = await exportPackingTandaTerimaGroupedBulk(selectedPackings, companyData.id);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Tanda Terima Grouped Preview (${selectedPackings.length} dokumen)`);
      setPreviewFileName(`tanda-terima-grouped-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success(`Berhasil membuka ${selectedPackings.length} tanda terima grouped`);
    } catch (error) {
      console.error('Error in bulk print tanda terima grouped:', error);
      toastService.error(error.message || 'Gagal mencetak tanda terima grouped');
    } finally {
      setIsPrintingTandaTerimaGrouped(false);
    }
  };

  const handleBulkEditTanggal = () => {
    if (!selectedPackings || selectedPackings.length === 0) {
      toastService.error('Tidak ada packing yang dipilih');
      return;
    }
    setSelectedTanggal('');
    setIsEditTanggalModalOpen(true);
  };

  const handleConfirmEditTanggal = async () => {
    if (!selectedTanggal) {
      toastService.error('Silakan pilih tanggal');
      return;
    }

    setEditTanggalLoading(true);
    try {
      const result = await bulkUpdateTanggalPacking(selectedPackings, selectedTanggal);
      toastService.success(result?.data?.message || `Berhasil mengupdate tanggal ${selectedPackings.length} packing`);
      setIsEditTanggalModalOpen(false);
      setSelectedTanggal('');
      // Refresh table data
      if (refetch) {
        refetch();
      }
    } catch (error) {
      console.error('Error in bulk edit tanggal:', error);
      toastService.error(error.message || 'Gagal mengupdate tanggal packing');
    } finally {
      setEditTanggalLoading(false);
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

  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const initialColumnFilters = useMemo(() => [
    {
      id: 'tanggal_packing',
      value: { from: todayStr, to: todayStr },
    },
  ], [todayStr]);

  const {
    data: packings,
    pagination,
    setPage,
    hasActiveFilters,
    resetFilters,
    refetch,
    isLoading,
    error,
    tableOptions,
    columnFilters,
    globalFilter,
  } = useServerSideTable({
    queryHook: usePackingsQuery,
    selectData: (response) => response?.packings ?? [],
    selectPagination: (response) => response?.pagination,
    initialLimit: 9999,
    initialPage: 1,
    globalFilter: globalFilterConfig,
    initialColumnFilters,
    getQueryParams,
    columnFilterDebounceMs: 0,
    storageKey: 'packings',
  });

  // Export functionality
  const handleConfirmExport = async () => {
    try {
      setShowExportConfirmation(false);
      setExportLoading(true);

      const currentFilters = columnFilters.reduce((acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
      }, {});

      if (globalFilter) {
        currentFilters.search = globalFilter;
      }

      // Reuse getQueryParams logic to format filters correctly
      const { filters: mappedFilters } = getQueryParams({ filters: currentFilters });

      if (companyId) {
        mappedFilters.companyId = companyId;
      }

      await exportExcel(mappedFilters);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfirmPreview = async () => {
    try {
      setPreviewLoading(true);
      setShowPreviewModal(true);

      const currentFilters = columnFilters.reduce((acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
      }, {});

      if (globalFilter) {
        currentFilters.search = globalFilter;
      }

      // Reuse getQueryParams logic to format filters correctly
      const { filters: mappedFilters } = getQueryParams({ filters: currentFilters });

      if (companyId) {
        mappedFilters.companyId = companyId;
      }

      const response = await previewExportExcel(mappedFilters);
      const resData = response?.success ? response.data : response;
      setPreviewData(resData);
    } catch (err) {
      console.error('Preview failed:', err);
      toastService.error(err.message || 'Gagal memuat preview data');
      setShowPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    openExportDialog: () => {
      setShowExportConfirmation(true);
    },
    openPreviewDialog: () => {
      handleConfirmPreview();
    },
  }));

  const customerOptions = useMemo(() => {
    const map = new Map();
    (packings || []).forEach((item) => {
      const id = item.purchaseOrder?.customer?.id || item.customerId;
      const name = item.purchaseOrder?.customer?.namaCustomer;
      if (id && name && !map.has(id)) {
        map.set(id, { id, namaCustomer: name });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'customer_name');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = customers.find((c) => c.id === val);
        map.set(val, { id: val, namaCustomer: fallback?.namaCustomer || val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.namaCustomer.localeCompare(b.namaCustomer)
    );
  }, [packings, columnFilters, customers]);

  const dynamicStatusOptions = useMemo(() => {
    const map = new Map();
    (packings || []).forEach((item) => {
      const code = item.status?.status_code;
      const name = item.status?.status_name || code;
      if (code && !map.has(code)) {
        map.set(code, { id: code, name });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'status');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = statusOptions.find((s) => s.id === val);
        map.set(val, { id: val, name: fallback?.name || val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [packings, columnFilters, statusOptions]);

  const dynamicPoOptions = useMemo(() => {
    const map = new Map();
    (packings || []).forEach((item) => {
      const poNumber = item.purchaseOrder?.po_number || item.po_number;
      if (poNumber && !map.has(poNumber)) {
        map.set(poNumber, { id: poNumber, name: poNumber });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'po_number');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [packings, columnFilters]);

  const printOptions = useMemo(
    () => [
      { id: 'true', name: 'Sudah Print' },
      { id: 'false', name: 'Belum Print' },
    ],
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const isAllSelected =
            packings.length > 0 && selectedPackings.length === packings.length;
          const isIndeterminate =
            selectedPackings.length > 0 &&
            selectedPackings.length < packings.length;

          return (
            <input
              type='checkbox'
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={() => onSelectAllPackings(packings)}
              className='h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
          );
        },
        cell: ({ row }) => (
          <input
            type='checkbox'
            checked={selectedPackings.includes(row.original.id)}
            onChange={() => onSelectPacking(row.original.id)}
            className='h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('purchaseOrder.po_number', {
        id: 'po_number',
        header: ({ column }) => (
          <div className='space-y-1' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>No PO</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicPoOptions}
              value={column.getFilterValue() || []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder="Filter..."
              limitTags={1}
              size="small"
              fetchOnClose
              className="w-full"
            />
          </div>
        ),
        cell: (info) => <span className='font-medium'>{info.getValue() || 'N/A'}</span>,
      }),
      columnHelper.accessor('purchaseOrder.customer.namaCustomer', {
        id: 'customer_name',
        header: ({ column }) => (
          <div className='space-y-0.5' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='Semua'
              displayKey='namaCustomer'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className='text-xs truncate'>{info.getValue() || 'N/A'}</span>,
      }),
      columnHelper.accessor('tanggal_packing', {
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Tgl Packing</div>
              <div className='flex flex-col gap-0.5'>
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
        cell: (info) => <span className='text-xs text-gray-600'>{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor('purchaseOrder.delivery_date', {
        id: 'tanggal_expired',
        header: ({ column }) => {
          const filterValue = column.getFilterValue() || { from: '', to: '' };
          return (
            <div className='space-y-0.5'>
              <div className='font-medium text-xs'>Tgl Expired</div>
              <div className='flex flex-col gap-0.5'>
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
        cell: (info) => <span className='text-xs text-gray-600'>{info.getValue() ? formatDate(info.getValue()) : 'N/A'}</span>,
      }),
      columnHelper.display({
        id: 'is_printed',
        header: ({ column }) => (
          <div className='space-y-1' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>Print</div>
            <AutocompleteCheckboxLimitTag
              options={printOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
                setPage(1);
              }}
              placeholder='Semua'
              displayKey='name'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose={true}
              className='w-full'
            />
          </div>
        ),
        cell: ({ row }) => {
          const isPrinted = row.original.is_printed;
          return (
            <StatusBadge
              dot={true}
              status={isPrinted ? 'Sudah Print' : 'Belum Print'}
              variant={isPrinted ? 'success' : 'secondary'}
              size='sm'
            />
          );
        },
      }),
      columnHelper.accessor('updatedAt', {
        id: 'print_date',
        header: 'Tanggal Print Terakhir',
        cell: (info) => {
          const isPrinted = info.row.original.is_printed;
          return isPrinted
            ? new Date(info.getValue()).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            : '-';
        },
      }),
      columnHelper.accessor('status.status_name', {
        id: 'status',
        header: ({ column }) => (
          <div className='space-y-0.5' onClick={(e) => e.stopPropagation()}>
            <div className='font-medium text-xs'>Status</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicStatusOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder='Semua'
              displayKey='name'
              valueKey='id'
              limitTags={1}
              size='small'
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => {
          const s = info.getValue();
          return s ? (
            <StatusBadge
              status={s}
              variant={resolveStatusVariant(s)}
              size='sm'
              dot
            />
          ) : (
            <span className='text-xs text-gray-500'>-</span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const packing = row.original;
          const processing = isProcessingStatus(packing);

          return (
            <div className='flex space-x-2'>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  !processing && onEdit(packing);
                }}
                className={`p-1 ${processing
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-green-600 hover:text-green-900'
                  }`}
                title={
                  processing
                    ? 'Packing sedang diproses dan tidak dapat diedit.'
                    : 'Edit'
                }
                disabled={processing}
              >
                <PencilIcon className='h-4 w-4' />
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(packing.id);
                }}
                disabled={deleteLoading}
                className='text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed'
                title='Delete'
              >
                <TrashIcon className='h-4 w-4' />
              </button>
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      packings,
      selectedPackings,
      onSelectPacking,
      onSelectAllPackings,
      onEdit,
      onDelete,
      deleteLoading,
      setPage,
      customerOptions,
      dynamicStatusOptions,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  const actionDisabled = isProcessing || isCompleting || !hasSelectedPackings;

  return (
    <div className='space-y-2'>
      <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100">
        <div className="flex items-center gap-2">
          {hasSelectedPackings && (
            <span className="text-xs font-medium text-blue-700">{selectedPackings.length} dipilih</span>
          )}
          <button
            onClick={handleBulkPrintSticker}
            disabled={isPrinting || actionDisabled}
            className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PrinterIcon className="h-3 w-3 mr-1" />{isPrinting ? '...' : 'Stiker'}
          </button>
          <button
            onClick={handleBulkPrintTandaTerimaGrouped}
            disabled={isPrintingTandaTerimaGrouped || actionDisabled}
            className="inline-flex items-center px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PrinterIcon className="h-3 w-3 mr-1" />{isPrintingTandaTerimaGrouped ? '...' : 'T.Terima'}
          </button>
          <button
            onClick={handleBulkEditTanggal}
            disabled={editTanggalLoading || actionDisabled}
            className="inline-flex items-center px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />{editTanggalLoading ? '...' : 'Edit Tanggal'}
          </button>
          <button
            onClick={onProcessSelected}
            disabled={actionDisabled}
            className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlayIcon className="h-3 w-3 mr-1" />{isProcessing ? '...' : 'Proses'}
          </button>
          <button
            onClick={onCompleteSelected}
            disabled={actionDisabled}
            className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckIcon className="h-3 w-3 mr-1" />{isCompleting ? '...' : 'Selesai'}
          </button>
        </div>
        {hasActiveFilters ? (
          <button
            onClick={resetFilters}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset Filter
          </button>
        ) : <div />}
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        loadingMessage='Memuat...'
        emptyMessage='Tidak ada data'
        emptyFilteredMessage='Tidak ada data sesuai filter'
        wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
        tableClassName='min-w-full bg-white border border-gray-200 text-xs table-fixed'
        headerRowClassName='bg-gray-50'
        headerCellClassName='px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider'
        bodyClassName='bg-white divide-y divide-gray-100'
        rowClassName='hover:bg-gray-50 cursor-pointer h-7'
        onRowClick={onRowClick}
        getRowClassName={({ row }) => {
          const isSelected = selectedPackingId === row.original.id;
          const isChecked = selectedPackings.includes(row.original.id);
          if (isSelected) return 'bg-blue-200 border-l-4 border-blue-600 font-medium text-gray-900';
          if (isChecked) return 'bg-emerald-100 border-l-2 border-emerald-500 text-gray-900';
          return undefined;
        }}
        selectedRowId={selectedPackingId}
        cellClassName='px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900'
        emptyCellClassName='px-1.5 py-0.5 text-center text-gray-500'
        footerRowClassName={`bg-gray-200 font-bold sticky bottom-0 ${(pagination?.totalItems || 0) > 0 ? 'z-10' : 'z-0'}`}
        footerContent={
          <tr>
            {table.getVisibleLeafColumns().map((column) => (
              <td
                key={column.id}
                className="px-1.5 py-1 text-xs border-t border-gray-300 text-center"
              >
                <TableFooterCell column={column} table={table} />
              </td>
            ))}
          </tr>
        }
      />


      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={handleConfirmExport}
        title="Konfirmasi Export"
        message="Apakah Anda yakin ingin mengexport data packing ini ke Excel?"
        confirmText="Ya, Export"
        cancelText="Batal"
        type="info"
        loading={exportLoading}
      />

      {/* Printer Selection Modal */}
      {isPrinterSelectionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsPrinterSelectionModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <PrinterIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Pilih Tipe Printer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Silakan pilih tipe layout printer yang akan digunakan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleConfirmPrintSticker('type1')}
                >
                  Type 1 (Default)
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleConfirmPrintSticker('type2')}
                >
                  Type 2
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsPrinterSelectionModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Tanggal */}
      {isEditTanggalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsEditTanggalModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CalendarIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Edit Tanggal Packing
                    </h3>
                    <div className="mt-2">
                      <div>
                        <input
                          type="date"
                          id="tanggal_packing"
                          name="tanggal_packing"
                          value={selectedTanggal}
                          onChange={(e) => setSelectedTanggal(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmEditTanggal}
                  disabled={editTanggalLoading || !selectedTanggal}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editTanggalLoading ? 'Memproses...' : 'Update Tanggal'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditTanggalModalOpen(false)}
                  disabled={editTanggalLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={pdfPreviewOpen}
        onClose={() => {
          setPdfPreviewOpen(false);
          setPreviewHtmlContent(null);
        }}
        htmlContent={previewHtmlContent}
        title={previewTitle}
        fileName={previewFileName}
      />

      {/* Excel Preview Modal */}
      <PackingExportPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        previewData={previewData}
        previewLoading={previewLoading}
        onExport={handleConfirmExport}
      />
    </div>
  );
});

PackingTableServerSide.displayName = 'PackingTableServerSide';

export default PackingTableServerSide;
