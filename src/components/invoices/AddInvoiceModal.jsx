import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddInvoiceModal = ({ show, onClose, onInvoiceAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
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
    TOP: '',
    type: 'PEMBAYARAN'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch('http://localhost:5050/api/v1/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to create invoice');

      const result = await response.json();
      onInvoiceAdded(result.data);
      onClose();
      setFormData({
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
        TOP: '',
        type: 'PEMBAYARAN'
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Invoice</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="no_invoice" className="block text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <input
                type="text"
                id="no_invoice"
                name="no_invoice"
                value={formData.no_invoice}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="tanggal"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="deliver_to" className="block text-sm font-medium text-gray-700">
                Deliver To
              </label>
              <input
                type="text"
                id="deliver_to"
                name="deliver_to"
                value={formData.deliver_to}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="PEMBAYARAN">PEMBAYARAN</option>
              </select>
            </div>

            <div>
              <label htmlFor="sub_total" className="block text-sm font-medium text-gray-700">
                Sub Total
              </label>
              <input
                type="number"
                id="sub_total"
                name="sub_total"
                value={formData.sub_total}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="total_discount" className="block text-sm font-medium text-gray-700">
                Total Discount
              </label>
              <input
                type="number"
                id="total_discount"
                name="total_discount"
                value={formData.total_discount}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="ppn_percentage" className="block text-sm font-medium text-gray-700">
                PPN Percentage
              </label>
              <input
                type="number"
                id="ppn_percentage"
                name="ppn_percentage"
                value={formData.ppn_percentage}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="grand_total" className="block text-sm font-medium text-gray-700">
                Grand Total
              </label>
              <input
                type="number"
                id="grand_total"
                name="grand_total"
                value={formData.grand_total}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoiceModal;
