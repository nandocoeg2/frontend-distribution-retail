import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import {
  TrashIcon,
  CheckIcon,
  LinkIcon,
  LinkSlashIcon,
  PrinterIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useLaporanPenerimaanBarangQuery } from '../../hooks/useLaporanPenerimaanBarangQuery';
import { formatDate, formatCurrency } from '../../utils/formatUtils';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable, TableFooterCell } from '../table';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import AssignPurchaseOrderModal from './AssignPurchaseOrderModal';
import useLaporanPenerimaanBarangOperations from '../../hooks/useLaporanPenerimaanBarangOperations';
import laporanPenerimaanBarangService from '../../services/laporanPenerimaanBarangService';
import toastService from '../../services/toastService';
import statusService from '../../services/statusService';
import customerService from '../../services/customerService';
import AutocompleteCheckboxLimitTag from '../common/AutocompleteCheckboxLimitTag';
import authService from '../../services/authService';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';

const columnHelper = createColumnHelper();

// Filter Selisih / Grandtotal LPB / Grandtotal Inv berbentuk checklist (seperti filter Excel);
// disaring client-side di processedReports
const selisihChecklistFilterFn = () => true;
selisihChecklistFilterFn.autoRemove = (val) => !Array.isArray(val) || val.length === 0;

const getSelisihValue = (row) => {
  const lpb = parseFloat(row.detailInvoice?.grand_total) || 0;
  const inv = parseFloat(row.purchaseOrder?.invoice?.grand_total) || 0;
  return lpb - inv;
};
const getSelisihKey = (row) => String(Math.round(getSelisihValue(row) * 100) / 100);

// Grandtotal LPB / Invoice: kunci filter = nilai dibulatkan 2 desimal, atau '__EMPTY__' bila belum ada
const toAmountKey = (raw) => {
  if (raw === null || raw === undefined || raw === '') return '__EMPTY__';
  return String(Math.round((parseFloat(raw) || 0) * 100) / 100);
};
const getLpbTotalKey = (row) => toAmountKey(row.detailInvoice?.grand_total);
const getInvoiceTotalKey = (row) => toAmountKey(row.purchaseOrder?.invoice?.grand_total);

// Opsi checklist (nilai unik, urut naik, "(Kosong)" di paling atas jika ada)
const buildAmountOptions = (rows, getKey, selectedValues, emptyLabel) => {
  const map = new Map();
  const add = (key) => {
    if (map.has(key)) return;
    map.set(
      key,
      key === '__EMPTY__'
        ? { id: key, name: emptyLabel, sortValue: -Infinity }
        : { id: key, name: formatCurrency(parseFloat(key)), sortValue: parseFloat(key) }
    );
  };
  (rows || []).forEach((row) => add(getKey(row)));
  selectedValues.forEach((val) => val != null && add(val));
  return Array.from(map.values()).sort((a, b) => a.sortValue - b.sortValue);
};



const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('tagih') || value.includes('complete')) {
    return 'success';
  }

  if (value.includes('pengganti') || value.includes('indikasi') || value.includes('failed')) {
    return 'danger';
  }

  if (value.includes('normal') || value.includes('pending')) {
    return 'default';
  }

  return 'default';
};

const resolveReportId = (report) => {
  if (!report) {
    return null;
  }

  return report.id || report.lpbId || report._id || report.uuid || null;
};

const LaporanPenerimaanBarangTableServerSide = ({
  onView,
  onEdit,
  selectedReports = [],
  onSelectReport,
  onCompleteSelected,
  onDeleteSelected,
  isCompleting = false,
  isDeleting = false,
  hasSelectedReports = false,
  selectedReportId = null,
  onFiltersChange,
  onOpenGenerateDialog,
  isGenerating = false,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLpbForAssign, setSelectedLpbForAssign] = useState(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [lpbToUnassign, setLpbToUnassign] = useState(null);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lpbStatuses, setLpbStatuses] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Fetch statuses from API
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await statusService.getLaporanPenerimaanBarangStatuses();
        if (response?.data) {
          setLpbStatuses(response.data);
        }
      } catch (error) {
        console.error('Error fetching LPB statuses:', error);
      }
    };
    fetchStatuses();
  }, []);

  // Fetch customers for autocomplete filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers(1, 100, { hasLaporanPenerimaanBarang: true });
        const data = response?.data?.data || response?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  const { isAssigning, isUnassigning, assignPurchaseOrder, unassignPurchaseOrder } =
    useLaporanPenerimaanBarangOperations();

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
      id: 'tanggal_tiba',
      value: { from: todayStr, to: todayStr },
    },
  ], [todayStr]);

  const {
    data: reports,
    pagination,
    setPage,
    resetFilters,
    hasActiveFilters,
    isLoading,
    error,
    tableOptions,
    filters,
    columnFilters,
    sorting,
  } = useServerSideTable({
    queryHook: useLaporanPenerimaanBarangQuery,
    selectData: (response) => response?.reports ?? [],
    selectPagination: (response) => response?.pagination,
    initialLimit: 9999,
    initialPage: 1,
    globalFilter: globalFilterConfig,
    columnFilterDebounceMs: 0,
    initialColumnFilters,
    storageKey: 'laporan-penerimaan-barang',
    getQueryParams: useCallback(({ filters, sorting, ...rest }) => {
      const companyId = authService.getCompanyData()?.id;
      const mappedFilters = { ...filters };

      if (mappedFilters.tanggal_tiba && typeof mappedFilters.tanggal_tiba === 'object') {
        if (mappedFilters.tanggal_tiba.from) mappedFilters.tanggal_tiba_from = mappedFilters.tanggal_tiba.from;
        if (mappedFilters.tanggal_tiba.to) mappedFilters.tanggal_tiba_to = mappedFilters.tanggal_tiba.to;
        delete mappedFilters.tanggal_tiba;
      }

      if (mappedFilters.tanggal_po && typeof mappedFilters.tanggal_po === 'object') {
        if (mappedFilters.tanggal_po.from) mappedFilters.tanggal_po_from = mappedFilters.tanggal_po.from;
        if (mappedFilters.tanggal_po.to) mappedFilters.tanggal_po_to = mappedFilters.tanggal_po.to;
        delete mappedFilters.tanggal_po;
      }

      if (mappedFilters.tanggal_faktur && typeof mappedFilters.tanggal_faktur === 'object') {
        if (mappedFilters.tanggal_faktur.from) mappedFilters.tanggal_faktur_from = mappedFilters.tanggal_faktur.from;
        if (mappedFilters.tanggal_faktur.to) mappedFilters.tanggal_faktur_to = mappedFilters.tanggal_faktur.to;
        delete mappedFilters.tanggal_faktur;
      }

      // Do not forward client-side virtual column filter to backend
      if ('selisih' in mappedFilters) {
        delete mappedFilters.selisih;
      }
      // Filter checklist Grandtotal LPB / Inv juga disaring di sisi klien
      delete mappedFilters.grandtotal_lpb;
      delete mappedFilters.grandtotal_invoice;

      if (companyId) {
        mappedFilters.companyId = companyId;
      }

      // Do not forward client-side virtual column sorting to backend
      const serverSorting = Array.isArray(sorting)
        ? sorting.filter((s) => s.id !== 'selisih')
        : sorting;

      return {
        ...rest,
        sorting: serverSorting,
        filters: mappedFilters,
      };
    }, []),
  });

  const customerOptions = useMemo(() => {
    const map = new Map();
    (reports || []).forEach((item) => {
      const id = item.customer?.id || item.customerId;
      const name = item.customer?.namaCustomer;
      if (id && name && !map.has(id)) {
        map.set(id, { id, namaCustomer: name });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'customerIds');
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
  }, [reports, columnFilters, customers]);

  const dynamicNoLpbOptions = useMemo(() => {
    const map = new Map();
    (reports || []).forEach((item) => {
      const val = item.no_lpb;
      if (val && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'no_lpb');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [reports, columnFilters]);

  const dynamicPoOptions = useMemo(() => {
    const map = new Map();
    let hasEmpty = false;
    (reports || []).forEach((item) => {
      const val = item.purchaseOrder?.po_number || item.po_number;
      if (val) {
        if (!map.has(val)) {
          map.set(val, { id: val, name: val });
        }
      } else {
        hasEmpty = true;
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'po_number');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && val !== '__EMPTY__' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    const sortedOptions = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (hasEmpty || selectedValues.includes('__EMPTY__')) {
      sortedOptions.unshift({ id: '__EMPTY__', name: '(Kosong / Belum Assign)' });
    }

    return sortedOptions;
  }, [reports, columnFilters]);

  const dynamicNoPoPenggantiOptions = useMemo(() => {
    const map = new Map();
    let hasEmpty = false;
    (reports || []).forEach((item) => {
      const val = item.no_po_pengganti;
      if (val && val.trim() !== '') {
        if (!map.has(val)) {
          map.set(val, { id: val, name: val });
        }
      } else {
        hasEmpty = true;
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'no_po_pengganti');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && val !== '__EMPTY__' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    const sortedOptions = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (hasEmpty || selectedValues.includes('__EMPTY__')) {
      sortedOptions.unshift({ id: '__EMPTY__', name: '(Kosong / Tanpa PO Pengganti)' });
    }

    return sortedOptions;
  }, [reports, columnFilters]);

  const dynamicInvoiceOptions = useMemo(() => {
    const map = new Map();
    let hasEmpty = false;
    (reports || []).forEach((item) => {
      const val = item.purchaseOrder?.invoice?.no_invoice || item.invoice;
      if (val) {
        if (!map.has(val)) {
          map.set(val, { id: val, name: val });
        }
      } else {
        hasEmpty = true;
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'invoice');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && val !== '__EMPTY__' && !map.has(val)) {
        map.set(val, { id: val, name: val });
      }
    });

    const sortedOptions = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (hasEmpty || selectedValues.includes('__EMPTY__')) {
      sortedOptions.unshift({ id: '__EMPTY__', name: '(Kosong / Belum Ada Invoice)' });
    }

    return sortedOptions;
  }, [reports, columnFilters]);

  const grandtotalLpbOptions = useMemo(() => {
    const active = columnFilters.find((f) => f.id === 'grandtotal_lpb')?.value;
    return buildAmountOptions(reports, getLpbTotalKey, Array.isArray(active) ? active : [], '(Kosong)');
  }, [reports, columnFilters]);

  const grandtotalInvoiceOptions = useMemo(() => {
    const active = columnFilters.find((f) => f.id === 'grandtotal_invoice')?.value;
    return buildAmountOptions(reports, getInvoiceTotalKey, Array.isArray(active) ? active : [], '(Kosong)');
  }, [reports, columnFilters]);

  const selisihOptions = useMemo(() => {
    const map = new Map();
    (reports || []).forEach((item) => {
      const key = getSelisihKey(item);
      if (!map.has(key)) {
        map.set(key, { id: key, name: formatCurrency(parseFloat(key)), sortValue: parseFloat(key) });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'selisih');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val != null && !map.has(val)) {
        map.set(val, { id: val, name: formatCurrency(parseFloat(val)), sortValue: parseFloat(val) });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.sortValue - b.sortValue);
  }, [reports, columnFilters]);

  const statusOptions = useMemo(() => {
    const map = new Map();
    (reports || []).forEach((item) => {
      const code = item.status?.status_code;
      const name = item.status?.status_name || code;
      if (code && !map.has(code)) {
        map.set(code, { id: code, name });
      }
    });

    const activeFilter = columnFilters.find((f) => f.id === 'status_codes');
    const selectedValues = Array.isArray(activeFilter?.value) ? activeFilter.value : [];
    selectedValues.forEach((val) => {
      if (val && !map.has(val)) {
        const fallback = lpbStatuses.find((s) => s.status_code === val);
        map.set(val, { id: val, name: fallback?.status_name || val });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [reports, columnFilters, lpbStatuses]);

  const totals = useMemo(() => {
    if (!reports || !Array.isArray(reports)) {
      return { lpb: 0, invoice: 0, selisih: 0 };
    }
    return reports.reduce(
      (acc, row) => {
        const lpbVal = parseFloat(row.detailInvoice?.grand_total) || 0;
        const invVal = parseFloat(row.purchaseOrder?.invoice?.grand_total) || 0;
        const selVal = lpbVal - invVal;
        return {
          lpb: acc.lpb + lpbVal,
          invoice: acc.invoice + invVal,
          selisih: acc.selisih + selVal,
        };
      },
      { lpb: 0, invoice: 0, selisih: 0 }
    );
  }, [reports]);

  // Notify parent of filter changes for export
  useEffect(() => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Handler untuk membuka modal assign
  const handleOpenAssignModal = (report) => {
    setSelectedLpbForAssign(report);
    setShowAssignModal(true);
  };

  // Handler untuk menutup modal assign
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedLpbForAssign(null);
  };

  // Handler untuk proses assign dari modal (sebelum konfirmasi)
  const handleAssignFromModal = (purchaseOrderId) => {
    setShowAssignModal(false);
    setSelectedPurchaseOrderId(purchaseOrderId);
    setShowAssignConfirmation(true);
  };

  // Handler untuk konfirmasi assign
  const handleConfirmAssign = async () => {
    const reportId = resolveReportId(selectedLpbForAssign);
    if (!reportId || !selectedPurchaseOrderId) return;

    try {
      await assignPurchaseOrder(reportId, selectedPurchaseOrderId);
      setShowAssignConfirmation(false);
      setSelectedLpbForAssign(null);
      setSelectedPurchaseOrderId(null);
      // Cache will be automatically invalidated by the mutation
    } catch (error) {
      console.error('Error assigning purchase order:', error);
    }
  };

  // Handler untuk cancel assign confirmation
  const handleCancelAssignConfirmation = () => {
    setShowAssignConfirmation(false);
    setSelectedPurchaseOrderId(null);
  };

  // Handler untuk tombol unassign
  const handleUnassignClick = (report) => {
    setLpbToUnassign(report);
    setShowUnassignConfirmation(true);
  };

  // Handler untuk konfirmasi unassign
  const handleConfirmUnassign = async () => {
    const reportId = resolveReportId(lpbToUnassign);
    if (!reportId) return;

    try {
      await unassignPurchaseOrder(reportId);
      setShowUnassignConfirmation(false);
      setLpbToUnassign(null);
      // Cache will be automatically invalidated by the mutation
    } catch (error) {
      console.error('Error unassigning purchase order:', error);
    }
  };

  // Handler untuk cancel unassign confirmation
  const handleCancelUnassignConfirmation = () => {
    setShowUnassignConfirmation(false);
    setLpbToUnassign(null);
  };

  // Handler untuk print LPB
  const handlePrintSelected = async () => {
    if (!selectedReports || selectedReports.length === 0) {
      toastService.error('Tidak ada laporan yang dipilih');
      return;
    }

    setIsPrinting(true);
    try {
      toastService.info(`Mendownload ${selectedReports.length} file LPB...`);

      let successCount = 0;
      let failCount = 0;

      // Loop through selected reports and download LPB files
      for (let i = 0; i < selectedReports.length; i++) {
        const reportId = selectedReports[i];

        try {
          // Get report data to extract no_lpb
          const report = reports.find(r => resolveReportId(r) === reportId);
          const noLpb = report?.no_lpb || reportId;

          // Generate current datetime for filename
          const now = new Date();
          const datetime = now.toISOString()
            .replace(/[-:]/g, '')
            .replace('T', '_')
            .split('.')[0];

          const result = await laporanPenerimaanBarangService.exportLPB(reportId);

          // Create a URL for the blob
          const blobUrl = window.URL.createObjectURL(result.blob);

          // Download file directly (works better in Electron)
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${noLpb}_${datetime}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);

          successCount++;

          // Small delay between downloads
          if (i < selectedReports.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          failCount++;
          console.error(`Error downloading LPB ${reportId}:`, error);
        }
      }

      if (successCount > 0) {
        toastService.success(
          `Berhasil mendownload ${successCount} file LPB${failCount > 0 ? `. ${failCount} gagal.` : ''}. Silakan buka file untuk print.`
        );
      } else {
        toastService.error('Gagal mendownload file LPB');
      }
    } catch (error) {
      console.error('Error in bulk download LPB:', error);
      toastService.error(error.message || 'Gagal mendownload LPB');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBulkGenerateInvoicePenagihan = () => {
    if (!selectedReports || selectedReports.length === 0) {
      toastService.error('Tidak ada laporan yang dipilih');
      return;
    }

    // Filter reports that have invoice pengiriman
    const validReports = selectedReports.filter((id) => {
      const report = reports.find((r) => resolveReportId(r) === id);
      return !!report?.purchaseOrder?.invoice?.id;
    });

    if (validReports.length === 0) {
      toastService.error('Laporan Penerimaan Barang yang dipilih tidak memiliki Invoice Pengiriman');
      return;
    }

    if (validReports.length < selectedReports.length) {
      toastService.warning(
        `Hanya ${validReports.length} dari ${selectedReports.length} laporan penerimaan barang yang memiliki Invoice Pengiriman`
      );
    }

    if (onOpenGenerateDialog) {
      onOpenGenerateDialog(validReports);
    }
  };

  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageReportIds = reports
      .map((report) => resolveReportId(report))
      .filter(Boolean);

    const allCurrentPageSelected = currentPageReportIds.every((id) =>
      selectedReports.includes(id)
    );

    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageReportIds.forEach((id) => {
        if (selectedReports.includes(id)) {
          onSelectReport(id, false);
        }
      });
    } else {
      // Select all on current page
      currentPageReportIds.forEach((id) => {
        if (!selectedReports.includes(id)) {
          onSelectReport(id, true);
        }
      });
    }
  }, [reports, selectedReports, onSelectReport]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const currentPageReportIds = reports
            .map((report) => resolveReportId(report))
            .filter(Boolean);

          const isAllSelected =
            reports.length > 0 &&
            currentPageReportIds.length > 0 &&
            currentPageReportIds.every((id) => selectedReports.includes(id));

          const isIndeterminate =
            currentPageReportIds.some((id) => selectedReports.includes(id)) &&
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
          const reportId = resolveReportId(row.original);
          return (
            <input
              type="checkbox"
              checked={selectedReports.includes(reportId)}
              onChange={() =>
                onSelectReport(reportId, !selectedReports.includes(reportId))
              }
              onClick={(e) => e.stopPropagation()}
              disabled={!reportId}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor(
        (row) => row.purchaseOrder?.invoice?.tanggal || row.detailInvoice?.tanggal || null,
        {
          id: 'tanggal_faktur',
          header: ({ column }) => {
            const filterValue = column.getFilterValue() || { from: '', to: '' };
            return (
              <div className="space-y-0.5">
                <div className="font-medium text-xs">Tanggal Faktur</div>
                <div className="flex flex-col gap-0.5">
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
          cell: (info) => (
            <span className="text-xs text-gray-600">
              {info.getValue() ? formatDate(info.getValue()) : '-'}
            </span>
          ),
        }
      ),
      columnHelper.accessor(
        (row) => row.tanggal_tiba || row.tanggal_po || null,
        {
          id: 'tanggal_tiba',
          header: ({ column }) => {
            const filterValue = column.getFilterValue() || { from: '', to: '' };
            return (
              <div className="space-y-0.5">
                <div className="font-medium text-xs">Tanggal LPB</div>
                <div className="flex flex-col gap-0.5">
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
          cell: (info) => <span className="text-xs text-gray-600">{info.getValue() ? formatDate(info.getValue()) : '-'}</span>,
        }
      ),
      columnHelper.accessor('no_lpb', {
        id: 'no_lpb',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No LPB</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicNoLpbOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.purchaseOrder?.po_number ?? null, {
        id: 'po_number',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No PO</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicPoOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('no_po_pengganti', {
        id: 'no_po_pengganti',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">No PO Pengganti</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicNoPoPenggantiOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.customer?.namaCustomer ?? null, {
        id: 'customerIds',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Customer</div>
            <AutocompleteCheckboxLimitTag
              options={customerOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="namaCustomer"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium truncate">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.purchaseOrder?.invoice?.no_invoice ?? null, {
        id: 'invoice',
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Invoice</div>
            <AutocompleteCheckboxLimitTag
              options={dynamicInvoiceOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor((row) => row.status?.status_name ?? null, {
        id: 'status_codes',
        header: ({ column }) => (
          <div className="space-y-0.5 max-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Status</div>
            <AutocompleteCheckboxLimitTag
              options={statusOptions}
              value={column.getFilterValue() ?? []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="Semua"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
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
      }),
      columnHelper.accessor((row) => row.detailInvoice?.grand_total ?? null, {
        id: 'grandtotal_lpb',
        filterFn: selisihChecklistFilterFn,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Grandtotal LPB</div>
            <AutocompleteCheckboxLimitTag
              options={grandtotalLpbOptions}
              showSelectAll
              value={Array.isArray(column.getFilterValue()) ? column.getFilterValue() : []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() ? formatCurrency(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor((row) => row.purchaseOrder?.invoice?.grand_total ?? null, {
        id: 'grandtotal_invoice',
        filterFn: selisihChecklistFilterFn,
        header: ({ column }) => (
          <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="font-medium text-xs">Grandtotal Inv</div>
            <AutocompleteCheckboxLimitTag
              options={grandtotalInvoiceOptions}
              showSelectAll
              value={Array.isArray(column.getFilterValue()) ? column.getFilterValue() : []}
              onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
              placeholder="All"
              displayKey="name"
              valueKey="id"
              limitTags={1}
              size="small"
              fetchOnClose
            />
          </div>
        ),
        cell: (info) => <span className="font-medium">{info.getValue() ? formatCurrency(info.getValue()) : '-'}</span>,
      }),
      columnHelper.accessor(
        (row) => {
          const lpb = parseFloat(row.detailInvoice?.grand_total) || 0;
          const inv = parseFloat(row.purchaseOrder?.invoice?.grand_total) || 0;
          return lpb - inv;
        },
        {
          id: 'selisih',
          filterFn: selisihChecklistFilterFn,
          header: ({ column }) => (
            <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
              <div className="font-medium text-xs">Selisih</div>
              <AutocompleteCheckboxLimitTag
                options={selisihOptions}
                showSelectAll
                value={Array.isArray(column.getFilterValue()) ? column.getFilterValue() : []}
                onChange={(e) => { column.setFilterValue(e.target.value); setPage(1); }}
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
            const diff = info.getValue() ?? 0;
            return (
              <span className={`font-medium ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {formatCurrency(diff)}
              </span>
            );
          },
          enableSorting: true,
        }
      ),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="font-medium text-xs">Aksi</div>,
        cell: ({ row }) => {
          const report = row.original;
          const hasAssignedPO = Boolean(report.purchaseOrderId || report.purchaseOrder?.id);

          return (
            <div className="flex items-center space-x-1">
              {hasAssignedPO ? (
                <button
                  onClick={() => handleUnassignClick(report)}
                  className="text-orange-600 hover:text-orange-900"
                  title="Unassign Purchase Order"
                >
                  <LinkSlashIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAssignModal(report)}
                  className="text-green-600 hover:text-green-900"
                  title="Assign Purchase Order"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [
      reports,
      selectedReports,
      onSelectReport,
      handleSelectAllInternalToggle,
      setPage,
      handleOpenAssignModal,
      handleUnassignClick,
      customerOptions,
      statusOptions,
      dynamicNoLpbOptions,
      dynamicPoOptions,
      dynamicNoPoPenggantiOptions,
      dynamicInvoiceOptions,
      selisihOptions,
      grandtotalLpbOptions,
      grandtotalInvoiceOptions,
    ]
  );

  const processedReports = useMemo(() => {
    let data = reports || [];

    // Filter client-side untuk PO Number (termasuk __EMPTY__)
    const poFilter = columnFilters.find((f) => f.id === 'po_number')?.value;
    if (Array.isArray(poFilter) && poFilter.length > 0) {
      const matchEmpty = poFilter.includes('__EMPTY__');
      const actualValues = poFilter.filter((v) => v !== '__EMPTY__');
      data = data.filter((row) => {
        const poNum = row.purchaseOrder?.po_number || row.po_number;
        const isEmpty = !poNum;
        if (matchEmpty && isEmpty) return true;
        if (actualValues.length > 0 && poNum && actualValues.includes(poNum)) return true;
        return false;
      });
    }

    // Filter client-side untuk No PO Pengganti (termasuk __EMPTY__)
    const poPenggantiFilter = columnFilters.find((f) => f.id === 'no_po_pengganti')?.value;
    if (Array.isArray(poPenggantiFilter) && poPenggantiFilter.length > 0) {
      const matchEmpty = poPenggantiFilter.includes('__EMPTY__');
      const actualValues = poPenggantiFilter.filter((v) => v !== '__EMPTY__');
      data = data.filter((row) => {
        const poPengganti = row.no_po_pengganti;
        const isEmpty = !poPengganti || poPengganti.trim() === '';
        if (matchEmpty && isEmpty) return true;
        if (actualValues.length > 0 && poPengganti && actualValues.includes(poPengganti)) return true;
        return false;
      });
    }

    // Filter client-side untuk Invoice (termasuk __EMPTY__)
    const invFilter = columnFilters.find((f) => f.id === 'invoice')?.value;
    if (Array.isArray(invFilter) && invFilter.length > 0) {
      const matchEmpty = invFilter.includes('__EMPTY__');
      const actualValues = invFilter.filter((v) => v !== '__EMPTY__');
      data = data.filter((row) => {
        const invNum = row.purchaseOrder?.invoice?.no_invoice || row.invoice;
        const isEmpty = !invNum;
        if (matchEmpty && isEmpty) return true;
        if (actualValues.length > 0 && invNum && actualValues.includes(invNum)) return true;
        return false;
      });
    }

    // Filter client-side untuk Grandtotal LPB dan Grandtotal Inv (checklist)
    const lpbTotalFilter = columnFilters.find((f) => f.id === 'grandtotal_lpb')?.value;
    if (Array.isArray(lpbTotalFilter) && lpbTotalFilter.length > 0) {
      data = data.filter((row) => lpbTotalFilter.includes(getLpbTotalKey(row)));
    }
    const invTotalFilter = columnFilters.find((f) => f.id === 'grandtotal_invoice')?.value;
    if (Array.isArray(invTotalFilter) && invTotalFilter.length > 0) {
      data = data.filter((row) => invTotalFilter.includes(getInvoiceTotalKey(row)));
    }

    // Filter client-side untuk selisih
    const selisihFilter = columnFilters.find((f) => f.id === 'selisih')?.value;
    if (Array.isArray(selisihFilter) && selisihFilter.length > 0) {
      data = data.filter((row) => selisihFilter.includes(getSelisihKey(row)));
    }

    // Sort client-side untuk selisih
    const selisihSort = (sorting || []).find((s) => s.id === 'selisih');
    if (selisihSort) {
      data = [...data].sort((a, b) => {
        const diffA = (parseFloat(a.detailInvoice?.grand_total) || 0) - (parseFloat(a.purchaseOrder?.invoice?.grand_total) || 0);
        const diffB = (parseFloat(b.detailInvoice?.grand_total) || 0) - (parseFloat(b.purchaseOrder?.invoice?.grand_total) || 0);
        return selisihSort.desc ? diffB - diffA : diffA - diffB;
      });
    }

    return data;
  }, [reports, columnFilters, sorting]);

  const table = useReactTable({
    ...tableOptions,
    data: processedReports,
    columns,
  });

  const actionDisabled = isCompleting;

  return (
    <div className="space-y-2 flex-1 flex flex-col min-h-0">
      {(hasActiveFilters || hasSelectedReports) && (
        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100 shrink-0">
          {hasSelectedReports ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-700">{selectedReports.length} dipilih</span>
              <button onClick={handlePrintSelected} disabled={isPrinting} className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50">
                <PrinterIcon className="h-3 w-3 mr-1" />{isPrinting ? '...' : 'Print'}
              </button>
              <button
                onClick={handleBulkGenerateInvoicePenagihan}
                disabled={isGenerating || isPrinting}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <DocumentPlusIcon className="h-3 w-3 mr-1" />
                {isGenerating ? '...' : 'Generate'}
              </button>
              <button onClick={onCompleteSelected} disabled={actionDisabled} className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                <CheckIcon className="h-3 w-3 mr-1" />{isCompleting ? '...' : 'Selesai'}
              </button>
              <button onClick={onDeleteSelected} disabled={isDeleting} className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                <TrashIcon className="h-3 w-3 mr-1" />{isDeleting ? '...' : 'Hapus'}
              </button>
            </div>
          ) : <div />}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Reset Filter</button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-visible">
        <DataTable
          table={table}
          isLoading={isLoading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          loadingMessage="Memuat..."
          emptyMessage="Tidak ada data"
          emptyFilteredMessage="Tidak ada data sesuai filter"
          tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed overflow-visible"
          headerRowClassName="bg-gray-50"
          headerCellClassName="px-1.5 py-1 text-left text-xs text-gray-500 uppercase tracking-wider overflow-visible"
          bodyClassName="bg-white divide-y divide-gray-100"
          rowClassName="hover:bg-gray-50 cursor-pointer h-7"
          onRowClick={(rowData) => rowData && onView && onView(rowData)}
          getRowClassName={({ row }) => {
            const reportId = resolveReportId(row.original);
            const isSelected = reportId === selectedReportId;
            const isChecked = reportId && selectedReports.includes(reportId);
            if (isSelected) return 'bg-blue-200 border-l-4 border-blue-600 font-medium text-gray-900';
            if (isChecked) return 'bg-emerald-100 border-l-2 border-emerald-500 text-gray-900';
            return undefined;
          }}
          selectedRowId={selectedReportId}
          cellClassName='px-1.5 py-0.5 whitespace-nowrap text-xs text-gray-900'
          emptyCellClassName='px-1.5 py-0.5 text-center text-gray-500'
          footerRowClassName={`bg-gray-200 font-bold sticky bottom-0 ${(pagination?.totalItems || 0) > 0 ? 'z-10' : 'z-0'}`}
          footerContent={
            <tr>
              {table.getVisibleLeafColumns().map((column) => (
                <td
                  key={column.id}
                  className="px-1.5 py-1 text-xs border-t border-r border-gray-300 border-r-gray-200 last:border-r-0 text-center"
                >
                  <TableFooterCell column={column} table={table} />
                </td>
              ))}
            </tr>
          }
          wrapperClassName="flex-grow overflow-x-auto overflow-y-auto flex-1 min-h-0"
        />
      </div>



      {/* Assign Purchase Order Modal */}
      <AssignPurchaseOrderModal
        show={showAssignModal}
        onClose={handleCloseAssignModal}
        onAssign={handleAssignFromModal}
        isSubmitting={isAssigning}
        lpbData={selectedLpbForAssign}
      />

      {/* Assign Confirmation Dialog */}
      <ConfirmationDialog
        show={showAssignConfirmation}
        onClose={handleCancelAssignConfirmation}
        onConfirm={handleConfirmAssign}
        title="Konfirmasi Assign Purchase Order"
        message={`Apakah Anda yakin ingin meng-assign Purchase Order ke LPB ${selectedLpbForAssign?.no_lpb || ''}? Data customer, term of payment, dan tanggal PO akan otomatis di-sync dari Purchase Order.`}
        confirmText="Ya, Assign"
        cancelText="Batal"
        type="success"
        loading={isAssigning}
      />

      {/* Unassign Confirmation Dialog */}
      <ConfirmationDialog
        show={showUnassignConfirmation}
        onClose={handleCancelUnassignConfirmation}
        onConfirm={handleConfirmUnassign}
        title="Konfirmasi Unassign Purchase Order"
        message={`Apakah Anda yakin ingin meng-unassign Purchase Order dari LPB ${lpbToUnassign?.no_lpb || ''}? Hubungan dengan Purchase Order akan dilepas.`}
        confirmText="Ya, Unassign"
        cancelText="Batal"
        type="warning"
        loading={isUnassigning}
      />
    </div>
  );
};

export default LaporanPenerimaanBarangTableServerSide;
