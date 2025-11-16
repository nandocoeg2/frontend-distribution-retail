import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import InvoicePenagihanForm from './InvoicePenagihanForm';

const buildInitialValues = () => ({
  purchaseOrderId: '',
  termOfPaymentId: '',
  statusId: '',
  tanggal: new Date().toISOString().substring(0, 10),
  kepada: '',
  sub_total: '',
  total_discount: '',
  total_price: '',
  ppn_percentage: '11',
  ppnRupiah: '',
  grand_total: '',
  invoicePenagihanDetails: [],
});

const AddInvoicePenagihanModal = ({ show, onClose, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(buildInitialValues);

  useEffect(() => {
    if (show) {
      setInitialValues(buildInitialValues());
    }
  }, [show]);

  const handleSubmit = async (payload) => {
    if (!onCreate) {
      toastService.error('Handler create invoice penagihan tidak tersedia.');
      return;
    }

    try {
      setLoading(true);
      const result = await onCreate(payload);
      if (result) {
        onClose?.();
      }
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Gagal membuat invoice penagihan.';
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4'>
          <div>
            <h3 className='text-lg font-semibold text-white'>Tambah Invoice Penagihan</h3>
            <p className='text-sm text-indigo-100'>Lengkapi data berikut untuk membuat invoice penagihan baru.</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30'
            aria-label='Tutup form tambah invoice penagihan'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <div className='px-6 py-6'>
          <InvoicePenagihanForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel='Simpan Invoice Penagihan'
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AddInvoicePenagihanModal;
