import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';
import suratJalanService from '../../services/suratJalanService';

const AddSuratJalanModal = ({ show, onClose, onSuratJalanAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
    no_surat_jalan: '',
    deliver_to: '',
    PIC: '',
    alamat_tujuan: '',
    invoiceId: '',
    suratJalanDetails: []
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
      const submitData = {
        ...formData,
        suratJalanDetails: [] // Start with empty details, can be enhanced later
      };

      const result = await suratJalanService.createSuratJalan(submitData);
      onSuratJalanAdded(result.data);
      toastService.success('Surat jalan created successfully');
      onClose();
      setFormData({
        no_surat_jalan: '',
        deliver_to: '',
        PIC: '',
        alamat_tujuan: '',
        invoiceId: '',
        suratJalanDetails: []
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error creating surat jalan:', err);
      toastService.error('Failed to create surat jalan');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Surat Jalan</h3>
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
              <label htmlFor="no_surat_jalan" className="block text-sm font-medium text-gray-700">
                No Surat Jalan
              </label>
              <input
                type="text"
                id="no_surat_jalan"
                name="no_surat_jalan"
                value={formData.no_surat_jalan}
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
              <label htmlFor="PIC" className="block text-sm font-medium text-gray-700">
                PIC
              </label>
              <input
                type="text"
                id="PIC"
                name="PIC"
                value={formData.PIC}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="alamat_tujuan" className="block text-sm font-medium text-gray-700">
                Alamat Tujuan
              </label>
              <input
                type="text"
                id="alamat_tujuan"
                name="alamat_tujuan"
                value={formData.alamat_tujuan}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700">
                Invoice ID (Optional)
              </label>
              <input
                type="text"
                id="invoiceId"
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Leave empty if not linked to invoice"
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
              {loading ? 'Creating...' : 'Create Surat Jalan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSuratJalanModal;
