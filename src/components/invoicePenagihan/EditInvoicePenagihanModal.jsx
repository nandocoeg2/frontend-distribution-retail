import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import InvoicePenagihanForm from './InvoicePenagihanForm';

const EditInvoicePenagihanModal = ({ show, onClose, invoice, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(invoice || {});

  useEffect(() => {
    setInitialValues(invoice || {});
  }, [invoice]);

  if (!show || !invoice) {
    return null;
  }

  const handleSubmit = async (payload) => {
    if (!onUpdate) {
      toastService.error('Handler update invoice penagihan tidak tersedia.');
      return;
    }

    try {
      setLoading(true);
      const result = await onUpdate(invoice.id, payload);
      if (result) {
        onClose?.();
      }
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Gagal memperbarui invoice penagihan.';
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl'>
        <div className='flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4'>
          <div>
            <h3 className='text-lg font-semibold text-white'>Ubah Invoice Penagihan</h3>
            <p className='text-sm text-orange-100'>Perbarui informasi invoice penagihan sesuai kebutuhan.</p>
          </div>
          <button
            onClick={onClose}
            className='rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30'
            aria-label='Tutup form ubah invoice penagihan'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>

        <div className='px-6 py-6'>
          <InvoicePenagihanForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel='Simpan Perubahan'
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default EditInvoicePenagihanModal;
