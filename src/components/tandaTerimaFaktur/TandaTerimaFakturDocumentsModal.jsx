import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '@/services/toastService';

const DEFAULT_FORM_STATE = {
  fakturPajakIds: '',
  laporanIds: '',
};

const parseIds = (value = '') => {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\n\r\t\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolveSummary = (tandaTerimaFaktur) => {
  if (!tandaTerimaFaktur) {
    return null;
  }

  return {
    id: tandaTerimaFaktur.id || '-'.repeat(4),
    supplier: tandaTerimaFaktur.code_supplier || '-',
    groupCustomer:
      tandaTerimaFaktur?.groupCustomer?.nama_group ||
      tandaTerimaFaktur?.groupCustomer?.namaGroup ||
      tandaTerimaFaktur?.customer?.groupCustomer?.nama_group ||
      tandaTerimaFaktur?.customer?.groupCustomer?.namaGroup ||
      '-',
  };
};

const TandaTerimaFakturDocumentsModal = ({
  isOpen,
  onClose,
  onSubmit,
  tandaTerimaFaktur,
  mode = 'assign',
  loading = false,
}) => {
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [errors, setErrors] = useState({});

  const summary = useMemo(() => resolveSummary(tandaTerimaFaktur), [tandaTerimaFaktur]);

  useEffect(() => {
    if (isOpen) {
      setFormState(DEFAULT_FORM_STATE);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const title = mode === 'assign' ? 'Assign Dokumen' : 'Unassign Dokumen';
  const description =
    mode === 'assign'
      ? 'Hubungkan Faktur Pajak dan/atau Laporan Penerimaan Barang ke tanda terima faktur.'
      : 'Lepaskan keterikatan Faktur Pajak dan/atau Laporan Penerimaan Barang dari tanda terima faktur.';
  const primaryLabel = mode === 'assign' ? 'Assign Dokumen' : 'Unassign Dokumen';

  const handleChange = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fakturPajakIds = parseIds(formState.fakturPajakIds);
    const laporanIds = parseIds(formState.laporanIds);

    if (fakturPajakIds.length === 0 && laporanIds.length === 0) {
      const message = 'Masukkan minimal satu ID faktur pajak atau LPB.';
      toastService.error(message);
      setErrors({
        fakturPajakIds: message,
        laporanIds: message,
      });
      return;
    }

    try {
      await onSubmit?.({ fakturPajakIds, laporanIds });
    } catch (error) {
      // Parent is responsible for error handling/toast
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
            <p className='text-sm text-gray-500'>{description}</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 text-gray-500 transition-colors duration-150 rounded-lg hover:bg-gray-100'
            aria-label='Tutup modal dokumen tanda terima faktur'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto px-6 py-4 space-y-5'>
          {summary && (
            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1'>
              <div><span className='font-medium'>ID:</span> {summary.id}</div>
              <div><span className='font-medium'>Kode Supplier:</span> {summary.supplier}</div>
              <div><span className='font-medium'>Group Customer:</span> {summary.groupCustomer}</div>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Daftar ID Faktur Pajak</label>
            <textarea
              value={formState.fakturPajakIds}
              onChange={handleChange('fakturPajakIds')}
              placeholder='Pisahkan dengan koma atau baris baru. Contoh:\nfp-uuid-1\nfp-uuid-2'
              className={`w-full min-h-[96px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fakturPajakIds ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <p className='mt-1 text-xs text-gray-500'>Opsional. Biarkan kosong jika hanya ingin memproses LPB.</p>
            {errors.fakturPajakIds && (
              <p className='mt-1 text-xs text-red-600'>{errors.fakturPajakIds}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Daftar ID LPB</label>
            <textarea
              value={formState.laporanIds}
              onChange={handleChange('laporanIds')}
              placeholder='Pisahkan dengan koma atau baris baru. Contoh:\nlpb-uuid-1\nlpb-uuid-2'
              className={`w-full min-h-[96px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.laporanIds ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            <p className='mt-1 text-xs text-gray-500'>Opsional. Biarkan kosong jika hanya ingin memproses faktur pajak.</p>
            {errors.laporanIds && (
              <p className='mt-1 text-xs text-red-600'>{errors.laporanIds}</p>
            )}
          </div>

          <div className='flex justify-end space-x-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed'
            >
              {loading ? 'Memproses...' : primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TandaTerimaFakturDocumentsModal;
