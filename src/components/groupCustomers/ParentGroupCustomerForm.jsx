import React, { useState } from 'react';
import { parentGroupCustomerService } from '@/services/parentGroupCustomerService';
import toastService from '@/services/toastService';

const ParentGroupCustomerForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    kode_parent: '',
    nama_parent: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.kode_parent.trim()) {
      newErrors.kode_parent = 'Kode parent group wajib diisi';
    }

    if (!formData.nama_parent.trim()) {
      newErrors.nama_parent = 'Nama parent group wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastService.error('Mohon perbaiki error pada form');
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const submitData = {
        kode_parent: formData.kode_parent.trim(),
        nama_parent: formData.nama_parent.trim(),
      };

      const result = await parentGroupCustomerService.createParentGroupCustomer(submitData);
      
      if (result.success) {
        toastService.success('Parent group customer berhasil dibuat');
        if (onSubmit) {
          onSubmit(result.data);
        }
      } else {
        throw new Error(result.error?.message || 'Failed to create parent group customer');
      }
    } catch (err) {
      let errorMessage = 'Gagal menyimpan parent group customer';
      
      if (err.message.includes('409')) {
        errorMessage = 'Kode parent group sudah digunakan';
        setErrors({ kode_parent: 'Kode parent group sudah digunakan' });
      } else if (err.message) {
        errorMessage = err.message;
      }

      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kode Parent Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kode Parent Group *
        </label>
        <input
          type="text"
          name="kode_parent"
          value={formData.kode_parent}
          onChange={handleInputChange}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.kode_parent ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan kode parent group (contoh: PG001)"
        />
        {errors.kode_parent && (
          <p className="mt-1 text-sm text-red-600">{errors.kode_parent}</p>
        )}
      </div>

      {/* Nama Parent Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Parent Group *
        </label>
        <input
          type="text"
          name="nama_parent"
          value={formData.nama_parent}
          onChange={handleInputChange}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.nama_parent ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan nama parent group"
        />
        {errors.nama_parent && (
          <p className="mt-1 text-sm text-red-600">{errors.nama_parent}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default ParentGroupCustomerForm;
