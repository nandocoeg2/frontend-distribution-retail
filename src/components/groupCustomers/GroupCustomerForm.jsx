import React from 'react';
import useGroupCustomerForm from '../../hooks/useGroupCustomerForm';

const GroupCustomerForm = ({ initialData = null, onSubmit, onCancel, isEdit = false }) => {
  const {
    formData,
    loading,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm
  } = useGroupCustomerForm(initialData);

  const handleFormSubmit = async (e) => {
    try {
      const result = await handleSubmit(e);
      if (result && onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Kode Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kode Group Customer *
        </label>
        <input
          type="text"
          name="kode_group"
          value={formData.kode_group}
          onChange={handleInputChange}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.kode_group ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan kode group customer"
        />
        {errors.kode_group && (
          <p className="mt-1 text-sm text-red-600">{errors.kode_group}</p>
        )}
      </div>

      {/* Kode Group Surat */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kode Group Surat
        </label>
        <input
          type="text"
          name="kode_group_surat"
          value={formData.kode_group_surat}
          onChange={handleInputChange}
          disabled={loading}
          maxLength={5}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.kode_group_surat ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan kode untuk Surat Jalan (max 5 karakter)"
        />
        {errors.kode_group_surat && (
          <p className="mt-1 text-sm text-red-600">{errors.kode_group_surat}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Kode ini akan digunakan untuk generate nomor Surat Jalan</p>
      </div>

      {/* Nama Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Group Customer *
        </label>
        <input
          type="text"
          name="nama_group"
          value={formData.nama_group}
          onChange={handleInputChange}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.nama_group ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan nama group customer"
        />
        {errors.nama_group && (
          <p className="mt-1 text-sm text-red-600">{errors.nama_group}</p>
        )}
      </div>

      {/* Alamat */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alamat
        </label>
        <textarea
          name="alamat"
          value={formData.alamat}
          onChange={handleInputChange}
          disabled={loading}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.alamat ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan alamat group customer"
        />
        {errors.alamat && (
          <p className="mt-1 text-sm text-red-600">{errors.alamat}</p>
        )}
      </div>

      {/* NPWP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          NPWP
        </label>
        <input
          type="text"
          name="npwp"
          value={formData.npwp}
          onChange={handleInputChange}
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            errors.npwp ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Masukkan NPWP (15 digit)"
        />
        {errors.npwp && (
          <p className="mt-1 text-sm text-red-600">{errors.npwp}</p>
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
          {loading ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Simpan')}
        </button>
      </div>
    </form>
  );
};

export default GroupCustomerForm;