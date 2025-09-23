import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import InfoTable from '../ui/InfoTable';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const renderFileList = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    return <span>Tidak ada lampiran</span>;
  }

  return (
    <ul className='space-y-1'>
      {files.map((file) => {
        const key = file?.id || file?.filename || file;
        return (
          <li key={key} className='flex flex-col'>
            <span className='text-sm text-gray-900'>{file?.originalName || file?.filename || key}</span>
            {file?.mimeType && (
              <span className='text-xs text-gray-500'>{file.mimeType}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const LaporanPenerimaanBarangDetailModal = ({ isOpen, onClose, report }) => {
  if (!isOpen) {
    return null;
  }

  const details = [
    {
      label: 'Nomor Purchase Order',
      value: report?.purchaseOrder?.po_number || report?.purchaseOrderId || '-',
      copyable: Boolean(report?.purchaseOrderId),
    },
    {
      label: 'Tanggal Purchase Order',
      value: formatDateTime(report?.tanggal_po || report?.purchaseOrder?.tanggal_po),
    },
    {
      label: 'Customer',
      value: report?.customer?.namaCustomer || report?.customerId || '-',
      copyable: Boolean(report?.customerId),
    },
    {
      label: 'Alamat Customer',
      value: report?.alamat_customer || '-',
    },
    {
      label: 'Termin Pembayaran',
      value: report?.termOfPayment?.nama_top || report?.termin_bayar || '-',
    },
    {
      label: 'Status',
      value: report?.status?.status_name || report?.status?.status_code || report?.statusId || '-',
    },
    {
      label: 'Dibuat Pada',
      value: formatDateTime(report?.createdAt),
    },
    {
      label: 'Diupdate Pada',
      value: formatDateTime(report?.updatedAt),
    },
    {
      label: 'Lampiran',
      component: renderFileList(report?.files),
    },
  ];

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4'>
        <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Detail Laporan Penerimaan Barang</h3>
            <p className='text-sm text-gray-500'>Tinjau informasi lengkap laporan.</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <div className='px-6 pb-6 pt-4'>
          <InfoTable data={details} />
        </div>

        <div className='px-6 py-4 border-t border-gray-200 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangDetailModal;
