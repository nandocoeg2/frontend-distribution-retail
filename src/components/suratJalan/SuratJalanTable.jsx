import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import Pagination from '../common/Pagination';
import { StatusBadge } from '../ui/Badge';
import { resolveStatusVariant } from '../../utils/modalUtils';

const SuratJalanTable = ({
  suratJalan = [],
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  hasActiveFilters = false,
  loading = false,
  selectedSuratJalan = [],
  onSelectSuratJalan,
  onSelectAllSuratJalan,
  onProcessSelected,
  isProcessing = false,
  hasSelectedSuratJalan = false,
}) => {
  // Ensure suratJalan is always an array
  const safeSuratJalan = Array.isArray(suratJalan) ? suratJalan : [];
  const selectedIds = Array.isArray(selectedSuratJalan)
    ? selectedSuratJalan
    : [];
  const currentItemIds = safeSuratJalan
    .map((item) => item?.id)
    .filter(Boolean);
  const isAllSelected =
    currentItemIds.length > 0 &&
    currentItemIds.every((id) => selectedIds.includes(id));
  const isIndeterminate =
    selectedIds.length > 0 &&
    !isAllSelected &&
    currentItemIds.some((id) => selectedIds.includes(id));

  return (
    <div className='space-y-4'>
      {hasSelectedSuratJalan && (
        <div className='flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <span className='text-sm font-medium text-blue-900'>
            {selectedIds.length} surat jalan dipilih
          </span>
          <button
            type='button'
            onClick={onProcessSelected}
            disabled={isProcessing}
            className='flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <PlayIcon className='h-4 w-4' />
            <span>{isProcessing ? 'Memproses...' : 'Proses Surat Jalan'}</span>
          </button>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead>
            <tr>
              <th className='px-4 py-3'>
                <input
                  type='checkbox'
                  checked={isAllSelected && currentItemIds.length > 0}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={() =>
                    !isProcessing && onSelectAllSuratJalan?.(safeSuratJalan)
                  }
                  disabled={isProcessing || safeSuratJalan.length === 0}
                  className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                No Surat Jalan
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Deliver To
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                PIC
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Alamat Tujuan
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {loading ? (
              <tr>
                <td
                  colSpan='7'
                  className='px-6 py-4 text-center text-gray-500'
                >
                  Memuat data surat jalan...
                </td>
              </tr>
            ) : safeSuratJalan.length === 0 ? (
              <tr>
                <td
                  colSpan='7'
                  className='px-6 py-4 text-center text-gray-500'
                >
                  {hasActiveFilters
                    ? 'Tidak ada surat jalan yang sesuai dengan filter pencarian.'
                    : 'Belum ada surat jalan.'}
                </td>
              </tr>
            ) : (
              safeSuratJalan.map((item, index) => {
                const itemId = item?.id ?? `surat-jalan-${index}`;
                const isSelected = Boolean(item?.id && selectedIds.includes(item.id));

                return (
                  <tr
                    key={itemId}
                    className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                  >
                    <td className='whitespace-nowrap px-4 py-4'>
                      <input
                        type='checkbox'
                        checked={isSelected}
                        onChange={() =>
                          item?.id && !isProcessing && onSelectSuratJalan?.(item.id)
                        }
                        disabled={isProcessing || !item?.id}
                        className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <div className='text-sm font-medium text-gray-900'>
                        {item.no_surat_jalan}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <div className='text-sm text-gray-900'>
                        {item.deliver_to}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <div className='text-sm text-gray-900'>
                        {item.PIC}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <div className='max-w-xs truncate text-sm text-gray-900'>
                        {item.alamat_tujuan}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <StatusBadge
                        status={
                          typeof item.status === 'string'
                            ? item.status
                            : item.status?.status_name ||
                              item.status?.status_code ||
                              'DRAFT SURAT JALAN'
                        }
                        variant={resolveStatusVariant(
                          typeof item.status === 'string'
                            ? item.status
                            : item.status?.status_name ||
                              item.status?.status_code
                        )}
                        size='sm'
                        dot
                      />
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-right text-sm font-medium'>
                      <div className='flex space-x-2'>
                        <button
                          onClick={() => onView(item)}
                          className='p-1 text-indigo-600 hover:text-indigo-900'
                          title='View'
                        >
                          <EyeIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className='p-1 text-indigo-600 hover:text-indigo-900'
                          title='Edit'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className='p-1 text-red-600 hover:text-red-900'
                          title='Delete'
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
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
};

export default SuratJalanTable;
