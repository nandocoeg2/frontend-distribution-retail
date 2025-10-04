import React from 'react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon, CheckIcon } from '@heroicons/react/24/solid';
import Pagination from '../common/Pagination';
import { StatusBadge } from '../ui/Badge';
import { resolveStatusVariant } from '../../utils/modalUtils';

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const resolveReportId = (report) => {
  if (!report) {
    return null;
  }

  return report.id || report.lpbId || report._id || report.uuid || null;
};

const LaporanPenerimaanBarangTable = ({
  reports,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  searchQuery,
  selectedReports = [],
  onSelectReport,
  onSelectAllReports,
  onProcessSelected,
  onCompleteSelected,
  isProcessing = false,
  isCompleting = false,
  disableSelection = false,
}) => {
  const data = Array.isArray(reports) ? reports : [];
  const selectedIds = Array.isArray(selectedReports) ? selectedReports : [];
  const selectableIds = data.map((report) => resolveReportId(report)).filter(Boolean);
  const hasSelectableRows = selectableIds.length > 0;
  const allSelected = hasSelectableRows && selectableIds.every((id) => selectedIds.includes(id));
  const hasSelection = selectedIds.length > 0;
  const isIndeterminate = hasSelection && !allSelected;
  const selectionDisabled = disableSelection || !hasSelectableRows;

  return (
    <div className='space-y-4'>
      {hasSelection && (
        <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div>
            <span className='text-sm font-medium text-blue-900'>{selectedIds.length} laporan dipilih</span>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => onProcessSelected && onProcessSelected()}
              disabled={isProcessing || isCompleting}
              className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isProcessing ? (
                <svg className='-ml-0.5 mr-2 h-4 w-4 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : (
                <PlayIcon className='-ml-0.5 mr-2 h-4 w-4' />
              )}
              <span>{isProcessing ? 'Memproses...' : `Proses (${selectedIds.length})`}</span>
            </button>
            <button
              type='button'
              onClick={() => onCompleteSelected && onCompleteSelected()}
              disabled={isProcessing || isCompleting}
              className='inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isCompleting ? (
                <svg className='-ml-0.5 mr-2 h-4 w-4 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              ) : (
                <CheckIcon className='-ml-0.5 mr-2 h-4 w-4' />
              )}
              <span>{isCompleting ? 'Menyelesaikan...' : `Selesaikan (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                <input
                  type='checkbox'
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  checked={allSelected && hasSelectableRows}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={(e) => onSelectAllReports && onSelectAllReports(e.target.checked)}
                  disabled={selectionDisabled || isProcessing || isCompleting || !onSelectAllReports}
                />
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>No. PO</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Tanggal PO</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Customer</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Termin Bayar</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Status</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>File</th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {data.length === 0 ? (
              <tr>
                <td colSpan='8' className='px-6 py-4 text-center text-gray-500'>
                  {searchQuery ? 'Tidak ada laporan yang cocok dengan pencarian.' : 'Belum ada laporan penerimaan barang.'}
                </td>
              </tr>
            ) : (
              data.map((report, index) => {
                const reportId = resolveReportId(report);
                const isSelected = reportId ? selectedIds.includes(reportId) : false;
                const rowClassName = isSelected ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-50';

                const poNumber = report?.purchaseOrder?.po_number || report?.purchaseOrderId || '-';
                const customerName = report?.customer?.namaCustomer || report?.customerId || '-';
                const terminName = report?.termOfPayment?.nama_top || report?.termin_bayar || '-';
                const statusName =
                  report?.status?.status_name ||
                  report?.status?.status_code ||
                  report?.statusId ||
                  '-';
                const fileCount = Array.isArray(report?.files) ? report.files.length : 0;

                return (
                  <tr key={reportId || report?.id || report?.purchaseOrderId || index} className={rowClassName}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        checked={isSelected}
                        onChange={(e) => {
                          if (onSelectReport && reportId) {
                            onSelectReport(reportId, e.target.checked);
                          }
                        }}
                        disabled={selectionDisabled || isProcessing || isCompleting || !reportId || !onSelectReport}
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{poNumber}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{formatDate(report?.tanggal_po || report?.purchaseOrder?.tanggal_po)}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{customerName}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{terminName}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <StatusBadge
                        status={statusName}
                        variant={resolveStatusVariant(statusName)}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{fileCount}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => onView && onView(report)}
                          className='p-1 text-indigo-600 hover:text-indigo-900'
                          title='Lihat detail'
                          type='button'
                        >
                          <EyeIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(report)}
                          className='p-1 text-indigo-600 hover:text-indigo-900'
                          title='Edit laporan'
                          type='button'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => onDelete && reportId && onDelete(reportId)}
                          className='p-1 text-red-600 hover:text-red-900'
                          title='Hapus laporan'
                          type='button'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangTable;
