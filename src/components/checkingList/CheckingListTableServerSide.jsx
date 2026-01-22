import React, { useMemo, useState, useCallback } from 'react';
import { createColumnHelper, useReactTable } from '@tanstack/react-table';
import { TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { useCheckingListQuery } from '../../hooks/useCheckingListQuery';
import { formatDateTime } from '../../utils/formatUtils';
import checkingListService from '../../services/checkingListService';
import toastService from '../../services/toastService';
import authService from '../../services/authService';
import { useServerSideTable } from '../../hooks/useServerSideTable';
import { DataTable } from '../table';
import PdfPreviewModal from '../common/PdfPreviewModal';
import DateFilter from '../common/DateFilter';
import TextColumnFilter from '../common/TextColumnFilter';

const columnHelper = createColumnHelper();

const resolveChecklistId = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  return (
    item.id ||
    item.checklistId ||
    item._id ||
    (typeof item === 'string' ? item : null)
  );
};

const resolveStatusVariant = (status) => {
  const statusText = typeof status === 'string'
    ? status
    : status?.status_name || status?.status_code || '';

  const value = statusText.toLowerCase();

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('selesai') || value.includes('success')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('canceled') || value.includes('failed') || value.includes('batal')) {
    return 'danger';
  }

  if (value.includes('processed') && !value.includes('processing')) {
    return 'primary';
  }

  if (value.includes('processing') || value.includes('proses') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('menunggu') || value.includes('waiting')) {
    return 'secondary';
  }

  return 'default';
};

const resolveStatusText = (status) => {
  if (typeof status === 'string') {
    return status;
  }
  if (!status) {
    return null;
  }
  return status.status_name || status.status_code || null;
};

const CheckingListTableServerSide = ({
  onViewDetail,
  selectedChecklistId = null,
  initialPage = 1,
  initialLimit = 9999,
  selectedChecklists = [],
  onSelectChecklist,
  onDeleteSelected,
  isDeleting = false,
  hasSelectedChecklists = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingGrouped, setIsExportingGrouped] = useState(false);

  // PDF Preview states
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewHtmlContent, setPreviewHtmlContent] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFileName, setPreviewFileName] = useState('document.pdf');

  const globalFilterConfig = useMemo(
    () => ({
      enabled: true,
      initialValue: '',
      debounceMs: 500,
    }),
    []
  );

  const companyId = authService.getCompanyData()?.id;

  const getQueryParams = useCallback(({ filters, ...rest }) => {
    const mappedFilters = { ...filters };

    if (companyId) {
      mappedFilters.companyId = companyId;
    }

    return {
      ...rest,
      filters: mappedFilters,
    };
  }, [companyId]);

  const {
    data: checklists,
    pagination,
    setPage,
    hasActiveFilters,
    isLoading,
    error,
    resetFilters,
    tableOptions,
  } = useServerSideTable({
    queryHook: useCheckingListQuery,
    selectData: (response) => response?.checklists ?? [],
    selectPagination: (response) => response?.pagination,
    initialPage,
    initialLimit,
    globalFilter: globalFilterConfig,
    getQueryParams,
    columnFilterDebounceMs: 0,
    storageKey: 'checking-list', // Persist filter state to sessionStorage
  });

  // Handler untuk select all toggle
  const handleSelectAllInternalToggle = useCallback(() => {
    const currentPageChecklistIds = checklists
      .map((checklist) => resolveChecklistId(checklist))
      .filter(Boolean);

    const allCurrentPageSelected = currentPageChecklistIds.every((id) =>
      selectedChecklists.includes(id)
    );

    if (allCurrentPageSelected) {
      currentPageChecklistIds.forEach((id) => {
        if (selectedChecklists.includes(id)) {
          onSelectChecklist(id, false);
        }
      });
    } else {
      currentPageChecklistIds.forEach((id) => {
        if (!selectedChecklists.includes(id)) {
          onSelectChecklist(id, true);
        }
      });
    }
  }, [checklists, selectedChecklists, onSelectChecklist]);

  // Handler untuk Export PDF (Bulk)
  const handleExportSelected = async () => {
    if (!selectedChecklists || selectedChecklists.length === 0) {
      toastService.error('Tidak ada checklist yang dipilih');
      return;
    }

    const companyData = authService.getCompanyData();
    if (!companyData || !companyData.id) {
      toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsExporting(true);
    try {
      toastService.info('Memproses ' + selectedChecklists.length + ' checklist...');

      const html = await checkingListService.exportCheckingListBulk(selectedChecklists, companyData.id);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Checking List Preview (${selectedChecklists.length} dokumen)`);
      setPreviewFileName(`checking-list-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success('Berhasil memproses ' + selectedChecklists.length + ' checklist.');

    } catch (error) {
      console.error('Error in bulk export checklist:', error);
      toastService.error(error.message || 'Gagal memproses checklist');
    } finally {
      setIsExporting(false);
    }
  };

  // Handler untuk Export PDF Grouped (Bulk)
  const handleExportGroupedSelected = async () => {
    if (!selectedChecklists || selectedChecklists.length === 0) {
      toastService.error('Tidak ada checklist yang dipilih');
      return;
    }

    const companyData = authService.getCompanyData();
    if (!companyData || !companyData.id) {
      toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsExportingGrouped(true);
    try {
      toastService.info('Memproses ' + selectedChecklists.length + ' checklist grouped...');

      const html = await checkingListService.exportCheckingListGroupedBulk(selectedChecklists, companyData.id);

      // Open preview modal with HTML content
      setPreviewHtmlContent(html);
      setPreviewTitle(`Checking List Grouped Preview (${selectedChecklists.length} dokumen)`);
      setPreviewFileName(`checking-list-grouped-bulk-${Date.now()}.pdf`);
      setPdfPreviewOpen(true);

      toastService.success('Berhasil memproses ' + selectedChecklists.length + ' checklist grouped.');

    } catch (error) {
      console.error('Error in bulk export checklist grouped:', error);
      toastService.error(error.message || 'Gagal memproses checklist grouped');
    } finally {
      setIsExportingGrouped(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => {
          const currentPageChecklistIds = checklists
            .map((checklist) => resolveChecklistId(checklist))
            .filter(Boolean);

          const isAllSelected =
            checklists.length > 0 &&
            currentPageChecklistIds.length > 0 &&
            currentPageChecklistIds.every((id) => selectedChecklists.includes(id));

          const isIndeterminate =
            currentPageChecklistIds.some((id) => selectedChecklists.includes(id)) &&
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
          const checklistId = resolveChecklistId(row.original);
          return (
            <input
              type="checkbox"
              checked={selectedChecklists.includes(checklistId)}
              onChange={() =>
                onSelectChecklist(checklistId, !selectedChecklists.includes(checklistId))
              }
              onClick={(e) => e.stopPropagation()}
              disabled={!checklistId}
              className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tanggal', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Tanggal</div>
            <DateFilter
              value={column.getFilterValue() ?? ''}
              onChange={(val) => {
                column.setFilterValue(val);
                setPage(1);
              }}
            />
          </div>
        ),
        cell: (info) => formatDateTime(info.getValue()),
      }),
      columnHelper.accessor('suratJalan', {
        id: 'surat_jalan',
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Surat Jalan</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => {
          const suratJalanList = Array.isArray(info.getValue())
            ? info.getValue()
            : info.getValue()
              ? [info.getValue()]
              : [];
          const primarySuratJalan = suratJalanList[0];
          const additionalCount = suratJalanList.length > 1 ? suratJalanList.length - 1 : 0;

          return (
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {primarySuratJalan?.no_surat_jalan || info.row.original?.suratJalanId || '-'}
              </p>
              {primarySuratJalan?.deliver_to && (
                <p className="text-xs text-gray-500">{primarySuratJalan.deliver_to}</p>
              )}
              {additionalCount > 0 && (
                <p className="text-xs text-gray-400">+{additionalCount} surat jalan lainnya</p>
              )}
            </div>
          );
        },
        enableColumnFilter: false,
      }),
      columnHelper.accessor('checker', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Checker</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('driver', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Driver</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('mobil', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Kendaraan</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('kota', {
        header: ({ column }) => (
          <div className="space-y-1">
            <div className="font-medium text-xs">Kota</div>
            <TextColumnFilter column={column} placeholder="Filter..." />
          </div>
        ),
        cell: (info) => info.getValue() || '-',
      }),
    ],
    [
      checklists,
      selectedChecklists,
      onSelectChecklist,
      handleSelectAllInternalToggle,
      setPage,
    ]
  );

  const table = useReactTable({
    ...tableOptions,
    columns,
  });

  return (
    <div className="space-y-4">
      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {hasSelectedChecklists && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <span className="text-xs font-medium text-blue-900">
            {selectedChecklists.length} dipilih
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportSelected}
              disabled={isExporting || isExportingGrouped}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowDownIcon className="h-3.5 w-3.5" />
              {isExporting ? 'Proses...' : 'Print'}
            </button>
            <button
              onClick={handleExportGroupedSelected}
              disabled={isExporting || isExportingGrouped}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowDownIcon className="h-3.5 w-3.5" />
              {isExportingGrouped ? 'Proses...' : 'Print Grouped'}
            </button>
            <button
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {isDeleting ? 'Proses...' : 'Hapus'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="w-8 h-8 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span>Memuat data checklist surat jalan...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm text-red-800">
            Terjadi kesalahan: {error.message}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <>
          <DataTable
            table={table}
            isLoading={isLoading}
            error={error}
            hasActiveFilters={hasActiveFilters}
            loadingMessage="Memuat data checklist surat jalan..."
            emptyMessage="Belum ada checklist surat jalan."
            emptyFilteredMessage="Tidak ada checklist surat jalan yang cocok dengan pencarian."
            wrapperClassName="overflow-x-auto overflow-y-auto min-h-[300px] max-h-[calc(85vh-300px)]"
            tableClassName="min-w-full bg-white border border-gray-200 text-xs table-fixed"
            headerRowClassName="bg-gray-50"
            headerCellClassName="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            bodyClassName="divide-y divide-gray-100 bg-white"
            rowClassName="hover:bg-gray-50 cursor-pointer h-8"
            getRowClassName={({ row }) => {
              const checklistId = resolveChecklistId(row.original);

              if (checklistId === selectedChecklistId) {
                return 'bg-blue-50 border-l-4 border-blue-500';
              }

              if (checklistId && selectedChecklists.includes(checklistId)) {
                return 'bg-blue-50';
              }

              return undefined;
            }}
            cellClassName="px-2 py-1 whitespace-nowrap text-xs text-gray-900"
            onRowClick={(checklist) => {
              onViewDetail && onViewDetail(checklist);
            }}
            emptyCellClassName="px-2 py-1 text-center text-xs text-gray-500"
          />


        </>
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
    </div>
  );
};

export default CheckingListTableServerSide;

