import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import invoicePengirimanService from '../../services/invoicePengirimanService';

const buildInitialState = () => ({
  no_invoice: '',
  tanggal: '',
  deliver_to: '',
  sub_total: '',
  total_discount: '',
  total_price: '',
  ppn_percentage: '',
  ppn_rupiah: '',
  grand_total: '',
  expired_date: '',
  term_of_payment_id: '',
  type: 'PEMBAYARAN',
});

const AddInvoicePengirimanModal = ({
  show,
  onClose,
  onInvoiceAdded,
  handleAuthError,
}) => {
  const [formData, setFormData] = useState(buildInitialState());
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        sub_total: parseFloat(formData.sub_total) || 0,
        total_discount: parseFloat(formData.total_discount) || 0,
        total_price: parseFloat(formData.total_price) || 0,
        ppn_percentage: parseFloat(formData.ppn_percentage) || 0,
        ppn_rupiah: parseFloat(formData.ppn_rupiah) || 0,
        grand_total: parseFloat(formData.grand_total) || 0,
      };

      const result =
        await invoicePengirimanService.createInvoicePengiriman(submitData);

      if (result?.success === false) {
        throw new Error(
          result?.error?.message || 'Failed to create invoice pengiriman'
        );
      }

      const createdInvoice = result?.data || result;
      onInvoiceAdded(createdInvoice);
      toastService.success('Invoice pengiriman created successfully');
      setFormData(buildInitialState());
      onClose();
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError();
        return;
      }
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to create invoice pengiriman';
      toastService.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Tambah Invoice Pengiriman
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='no_invoice'
                className='block text-sm font-medium text-gray-700'
              >
                Nomor Invoice
              </label>
              <input
                type='text'
                id='no_invoice'
                name='no_invoice'
                value={formData.no_invoice}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                required
              />
            </div>

            <div>
              <label
                htmlFor='tanggal'
                className='block text-sm font-medium text-gray-700'
              >
                Tanggal
              </label>
              <input
                type='date'
                id='tanggal'
                name='tanggal'
                value={formData.tanggal}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                required
              />
            </div>

            <div>
              <label
                htmlFor='deliver_to'
                className='block text-sm font-medium text-gray-700'
              >
                Tujuan Pengiriman
              </label>
              <input
                type='text'
                id='deliver_to'
                name='deliver_to'
                value={formData.deliver_to}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                required
              />
            </div>

            <div>
              <label
                htmlFor='type'
                className='block text-sm font-medium text-gray-700'
              >
                Tipe Invoice
              </label>
              <select
                id='type'
                name='type'
                value={formData.type}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              >
                <option value='PEMBAYARAN'>PEMBAYARAN</option>
                <option value='PENGIRIMAN'>PENGIRIMAN</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='sub_total'
                className='block text-sm font-medium text-gray-700'
              >
                Sub Total
              </label>
              <input
                type='number'
                id='sub_total'
                name='sub_total'
                value={formData.sub_total}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                required
              />
            </div>

            <div>
              <label
                htmlFor='total_discount'
                className='block text-sm font-medium text-gray-700'
              >
                Total Diskon
              </label>
              <input
                type='number'
                id='total_discount'
                name='total_discount'
                value={formData.total_discount}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label
                htmlFor='total_price'
                className='block text-sm font-medium text-gray-700'
              >
                Total Harga
              </label>
              <input
                type='number'
                id='total_price'
                name='total_price'
                value={formData.total_price}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label
                htmlFor='ppn_percentage'
                className='block text-sm font-medium text-gray-700'
              >
                PPN (%)
              </label>
              <input
                type='number'
                id='ppn_percentage'
                name='ppn_percentage'
                value={formData.ppn_percentage}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label
                htmlFor='ppn_rupiah'
                className='block text-sm font-medium text-gray-700'
              >
                PPN (Rp)
              </label>
              <input
                type='number'
                id='ppn_rupiah'
                name='ppn_rupiah'
                value={formData.ppn_rupiah}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label
                htmlFor='expired_date'
                className='block text-sm font-medium text-gray-700'
              >
                Tanggal Expired (Optional)
              </label>
              <input
                type='date'
                id='expired_date'
                name='expired_date'
                value={formData.expired_date}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              />
            </div>

            <div>
              <label
                htmlFor='term_of_payment_id'
                className='block text-sm font-medium text-gray-700'
              >
                Term of Payment (Optional)
              </label>
              <input
                type='text'
                id='term_of_payment_id'
                name='term_of_payment_id'
                value={formData.term_of_payment_id}
                onChange={handleInputChange}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                placeholder='Term of Payment ID'
              />
            </div>
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600'
            >
              Batal
            </button>
            <button
              type='submit'
              disabled={loading}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
            >
              {loading ? 'Menyimpan...' : 'Simpan Invoice Pengiriman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoicePengirimanModal;
