import React from 'react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { formatDateTime } from '../../utils/formatUtils';

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

const CheckingListTable = ({
  checklists,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onView,
  loading = false,
  searchQuery,
  hasActiveFilters = false,
}) => {
  const data = Array.isArray(checklists) ? checklists : [];
  const hasData = data.length > 0;
  const hasSearch =
    hasActiveFilters ||
    (typeof searchQuery === 'string' && searchQuery.trim() !== '');

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto rounded-xl border border-gray-200 shadow-sm'>
        <table className='min-w-full divide-y divide-gray-200 bg-white'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Checklist ID
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Tanggal
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Checker
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Driver
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Kendaraan
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Kota
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Surat Jalan
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Status Checklist
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className='px-6 py-6 text-center text-sm text-gray-500'
                >
                  Memuat data checklist surat jalan...
                </td>
              </tr>
            ) : !hasData ? (
              <tr>
                <td
                  colSpan={9}
                  className='px-6 py-6 text-center text-sm text-gray-500'
                >
                  {hasSearch
                    ? 'Tidak ada checklist surat jalan yang cocok dengan pencarian.'
                    : 'Belum ada checklist surat jalan.'}
                </td>
              </tr>
            ) : (
              data.map((checklist, index) => {
                const checklistId = resolveChecklistId(checklist);
                const suratJalanList = Array.isArray(checklist?.suratJalan)
                  ? checklist.suratJalan
                  : checklist?.suratJalan
                    ? [checklist.suratJalan]
                    : [];
                const primarySuratJalan = suratJalanList[0];
                const additionalSuratJalanCount =
                  suratJalanList.length > 1 ? suratJalanList.length - 1 : 0;

                return (
                  <tr
                    key={checklistId || `checklist-row-${index}`}
                    className='hover:bg-gray-50'
                  >
                    <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900'>
                      {checklistId || '-'}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>
                      {formatDateTime(checklist?.tanggal)}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>
                      {checklist?.checker || '-'}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>
                      {checklist?.driver || '-'}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>
                      {checklist?.mobil || '-'}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-600'>
                      {checklist?.kota || '-'}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-600'>
                        <p className='font-medium text-gray-900'>
                          {primarySuratJalan?.no_surat_jalan ||
                            checklist?.suratJalanId ||
                            '-'}
                        </p>
                        {primarySuratJalan?.deliver_to && (
                          <p className='text-xs text-gray-500'>
                            {primarySuratJalan.deliver_to}
                          </p>
                        )}
                        {additionalSuratJalanCount > 0 && (
                          <p className='text-xs text-gray-400'>
                            +{additionalSuratJalanCount} surat jalan lainnya
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-600'>
                        <p className='font-medium text-gray-900'>
                          {checklist?.status?.status_name ||
                            checklist?.status?.status_code ||
                            '-'}
                        </p>
                        {(checklist?.status?.status_code ||
                          checklist?.statusId) && (
                          <p className='text-xs text-gray-500'>
                            {checklist?.status?.status_code || checklist?.statusId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => onView && onView(checklist)}
                          className='inline-flex items-center rounded-md border border-transparent bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                        >
                          <EyeIcon className='mr-1 h-4 w-4' />
                          Detail
                        </button>
                        <button
                          type='button'
                          onClick={() => onEdit && onEdit(checklist)}
                          className='inline-flex items-center rounded-md border border-transparent bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        >
                          <PencilIcon className='mr-1 h-4 w-4' />
                          Edit
                        </button>
                        <button
                          type='button'
                          onClick={() =>
                            onDelete && checklistId && onDelete(checklistId)
                          }
                          className='inline-flex items-center rounded-md border border-transparent bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                        >
                          <TrashIcon className='mr-1 h-4 w-4' />
                          Hapus
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

export default CheckingListTable;
