import React from 'react';
import ReturnStatusBadge from './ReturnStatusBadge.jsx';
import HeroIcon from '../atoms/HeroIcon.jsx';
import { formatDateTime } from '@/utils/formatUtils';

const TableHeaderCell = ({ children, className = '' }) => (
  <th
    scope='col'
    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

const ActionButton = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
}) => {
  const variants = {
    primary:
      'text-blue-600 hover:text-blue-700 focus:ring-blue-500 border border-blue-100 hover:border-blue-200',
    danger:
      'text-red-600 hover:text-red-700 focus:ring-red-500 border border-red-100 hover:border-red-200',
    neutral:
      'text-gray-600 hover:text-gray-700 focus:ring-gray-500 border border-gray-200 hover:border-gray-300',
  };

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

const ReturnsTable = ({
  returns,
  loading,
  onView,
  onClassify,
  onDelete,
  classifyLoading,
  deleteLoading,
  deleteLoadingId,
}) => {
  const hasData = Array.isArray(returns) && returns.length > 0;

  return (
    <div className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <TableHeaderCell>No. Retur</TableHeaderCell>
              <TableHeaderCell>Nama Barang</TableHeaderCell>
              <TableHeaderCell>Jumlah</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Dibuat</TableHeaderCell>
              <TableHeaderCell className='w-48'>Aksi</TableHeaderCell>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {loading && (
              <tr>
                <td colSpan={6} className='px-4 py-6 text-center'>
                  <div className='flex items-center justify-center text-sm text-gray-500'>
                    <span className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></span>
                    Memuat data retur...
                  </div>
                </td>
              </tr>
            )}

            {!loading && !hasData && (
              <tr>
                <td colSpan={6} className='px-4 py-10 text-center'>
                  <div className='flex flex-col items-center justify-center text-gray-500'>
                    <HeroIcon name='archive-box' className='w-10 h-10 mb-3 text-gray-300' />
                    <p className='text-sm font-medium'>
                      Belum ada data retur.
                    </p>
                    <p className='text-xs text-gray-400'>
                      Gunakan tombol &ldquo;Buat Retur Baru&rdquo; untuk menambahkan.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              hasData &&
              returns.map((item) => {
                const status = item.status || '';
                const isPending = status.toUpperCase() === 'PENDING';
                const isDeleting = deleteLoading && deleteLoadingId === item.id;

                return (
                  <tr key={item.id || item.returnNumber}>
                    <td className='px-4 py-3 text-sm font-medium text-gray-900'>
                      {item.returnNumber || '-'}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {item.inventory?.nama_barang ||
                        item.inventory?.name ||
                        '-'}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {item.quantity ?? '-'}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      <ReturnStatusBadge status={status} />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500'>
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      <div className='flex flex-wrap gap-2'>
                        <ActionButton
                          variant='neutral'
                          onClick={() => onView(item.id)}
                        >
                          <HeroIcon name='eye' className='w-5 h-5 mr-1.5' />
                          Detail
                        </ActionButton>
                        <ActionButton
                          variant='primary'
                          onClick={() => onClassify(item)}
                          disabled={!isPending || classifyLoading}
                        >
                          {classifyLoading ? (
                            <span className='flex items-center'>
                              <span className='w-4 h-4 mr-2 border-b-2 border-blue-600 rounded-full animate-spin'></span>
                              Proses
                            </span>
                          ) : (
                            <>
                          <HeroIcon name='sparkles' className='w-5 h-5 mr-1.5' />
                              Klasifikasi
                            </>
                          )}
                        </ActionButton>
                        <ActionButton
                          variant='danger'
                          onClick={() => onDelete(item)}
                          disabled={!isPending || isDeleting}
                        >
                          {isDeleting ? (
                            <span className='flex items-center'>
                              <span className='w-4 h-4 mr-2 border-b-2 border-red-600 rounded-full animate-spin'></span>
                              Hapus...
                            </span>
                          ) : (
                            <>
                              <HeroIcon name='trash' className='w-4 h-4 mr-1.5' />
                              Hapus
                            </>
                          )}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReturnsTable;
