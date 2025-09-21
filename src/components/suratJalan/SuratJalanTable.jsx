import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';

const SuratJalanTable = ({ suratJalan = [], pagination, onPageChange, onLimitChange, onEdit, onDelete, onView, searchQuery }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Ensure suratJalan is always an array
  const safeSuratJalan = Array.isArray(suratJalan) ? suratJalan : [];

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              No Surat Jalan
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Deliver To
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              PIC
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Alamat Tujuan
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Status
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {safeSuratJalan.length === 0 ? (
            <tr>
              <td colSpan="6" className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'Tidak ada surat jalan yang sesuai dengan pencarian.' : 'Belum ada surat jalan.'}
              </td>
            </tr>
          ) : (
            safeSuratJalan.map((item) => (
              <tr key={item.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {item.no_surat_jalan}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item.deliver_to}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {item.PIC}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900 max-w-xs truncate'>
                    {item.alamat_tujuan}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'DRAFT SURAT JALAN' ? 'bg-gray-100 text-gray-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'READY TO SHIP SURAT JALAN' ? 'bg-blue-100 text-blue-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'SHIPPED SURAT JALAN' ? 'bg-yellow-100 text-yellow-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'DELIVERED SURAT JALAN' ? 'bg-green-100 text-green-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'CANCELLED SURAT JALAN' ? 'bg-red-100 text-red-800' :
                    // Fallback untuk status lama
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'READY_TO_SHIP' ? 'bg-blue-100 text-blue-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'SHIPPED' ? 'bg-yellow-100 text-yellow-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    (typeof item.status === 'string' ? item.status : item.status?.status_code) === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {typeof item.status === 'string' ? item.status : (item.status?.status_code || item.status?.status_name || 'DRAFT SURAT JALAN')}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => onView(item)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='View'
                    >
                      <EyeIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className='text-indigo-600 hover:text-indigo-900 p-1'
                      title='Edit'
                    >
                      <PencilIcon className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className='text-red-600 hover:text-red-900 p-1'
                      title='Delete'
                    >
                      <TrashIcon className='h-4 w-4' />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <Pagination pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </div>
  );
};

export default SuratJalanTable;
