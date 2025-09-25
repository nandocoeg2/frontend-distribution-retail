import React from 'react';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../common/Pagination';
import { StatusBadge } from '../ui/Badge';

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

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (
    value.includes('approve') ||
    value.includes('success') ||
    value.includes('selesai') ||
    value.includes('complete')
  ) {
    return 'success';
  }

  if (
    value.includes('pending') ||
    value.includes('menunggu') ||
    value.includes('waiting')
  ) {
    return 'warning';
  }

  if (
    value.includes('reject') ||
    value.includes('cancel') ||
    value.includes('batal') ||
    value.includes('failed') ||
    value.includes('error')
  ) {
    return 'danger';
  }

  if (value.includes('process') || value.includes('proses')) {
    return 'primary';
  }

  if (value.includes('draft')) {
    return 'secondary';
  }

  return 'default';
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
}) => {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>No. PO</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Tanggal PO</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Customer</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Alamat</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Termin Bayar</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>File</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {reports.length === 0 ? (
            <tr>
              <td colSpan='8' className='px-6 py-4 text-center text-gray-500'>
                {searchQuery ? 'Tidak ada laporan yang cocok dengan pencarian.' : 'Belum ada laporan penerimaan barang.'}
              </td>
            </tr>
          ) : (
            reports.map((report) => {
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
                <tr key={report.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{poNumber}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{formatDate(report?.tanggal_po || report?.purchaseOrder?.tanggal_po)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{customerName}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{report?.alamat_customer || '-'}</td>
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
                    <div className='flex space-x-2 justify-end'>
                      <button
                        onClick={() => onView(report)}
                        className='text-indigo-600 hover:text-indigo-900 p-1'
                        title='Lihat detail'
                      >
                        <EyeIcon className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => onEdit(report)}
                        className='text-indigo-600 hover:text-indigo-900 p-1'
                        title='Edit laporan'
                      >
                        <PencilIcon className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => onDelete(report.id)}
                        className='text-red-600 hover:text-red-900 p-1'
                        title='Hapus laporan'
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
  );
};

export default LaporanPenerimaanBarangTable;
