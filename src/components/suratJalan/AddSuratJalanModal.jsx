import React, { useState } from 'react';
import FormModal from '../common/FormModal';
import toastService from '../../services/toastService';
import suratJalanService from '../../services/suratJalanService';

const defaultFormValues = {
  no_surat_jalan: '',
  deliver_to: '',
  PIC: '',
  alamat_tujuan: '',
  invoiceId: '',
  checklistSuratJalan: {
    tanggal: '',
    checker: '',
    driver: '',
    mobil: '',
    kota: ''
  },
  suratJalanDetails: []
};

const AddSuratJalanModal = ({ show, onClose, onSuratJalanAdded, handleAuthError }) => {
  const [formData, setFormData] = useState(defaultFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChecklistChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      checklistSuratJalan: {
        ...prev.checklistSuratJalan,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        suratJalanDetails: [] // Start with empty details, can be enhanced later
      };

      const result = await suratJalanService.createSuratJalan(submitData);
      onSuratJalanAdded(result.data);
      toastService.success('Surat jalan created successfully');
      onClose();
      setFormData(defaultFormValues);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error creating surat jalan:', err);
      toastService.error('Failed to create surat jalan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfoSection = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">📄</span>
        Informasi Dasar
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="no_surat_jalan" className="block mb-1 text-sm font-medium text-gray-700">
            No Surat Jalan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="no_surat_jalan"
            name="no_surat_jalan"
            value={formData.no_surat_jalan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Masukkan nomor surat jalan"
          />
        </div>

        <div>
          <label htmlFor="deliver_to" className="block mb-1 text-sm font-medium text-gray-700">
            Deliver To <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="deliver_to"
            name="deliver_to"
            value={formData.deliver_to}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Nama penerima"
          />
        </div>

        <div>
          <label htmlFor="PIC" className="block mb-1 text-sm font-medium text-gray-700">
            PIC <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="PIC"
            name="PIC"
            value={formData.PIC}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Person in Charge"
          />
        </div>

        <div>
          <label htmlFor="alamat_tujuan" className="block mb-1 text-sm font-medium text-gray-700">
            Alamat Tujuan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="alamat_tujuan"
            name="alamat_tujuan"
            value={formData.alamat_tujuan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="Alamat pengiriman"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="invoiceId" className="block mb-1 text-sm font-medium text-gray-700">
            Invoice ID (Optional)
          </label>
          <input
            type="text"
            id="invoiceId"
            name="invoiceId"
            value={formData.invoiceId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kosongkan jika tidak terkait invoice"
          />
          <p className="mt-1 text-xs text-gray-500">
            Sisakan kosong jika surat jalan tidak terkait dengan invoice tertentu.
          </p>
        </div>
      </div>
    </div>
  );

  const renderChecklistSection = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">✅</span>
        Checklist Surat Jalan
      </h3>
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/30">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="tanggal" className="block mb-1 text-sm font-medium text-gray-700">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="tanggal"
              name="tanggal"
              value={formData.checklistSuratJalan.tanggal}
              onChange={handleChecklistChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="checker" className="block mb-1 text-sm font-medium text-gray-700">
              Checker <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="checker"
              name="checker"
              value={formData.checklistSuratJalan.checker}
              onChange={handleChecklistChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
              placeholder="Nama pemeriksa"
            />
          </div>

          <div>
            <label htmlFor="driver" className="block mb-1 text-sm font-medium text-gray-700">
              Driver <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="driver"
              name="driver"
              value={formData.checklistSuratJalan.driver}
              onChange={handleChecklistChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
              placeholder="Nama driver"
            />
          </div>

          <div>
            <label htmlFor="mobil" className="block mb-1 text-sm font-medium text-gray-700">
              Mobil <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="mobil"
              name="mobil"
              value={formData.checklistSuratJalan.mobil}
              onChange={handleChecklistChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
              placeholder="Nomor kendaraan (misal: B 1234 XYZ)"
            />
          </div>

          <div>
            <label htmlFor="kota" className="block mb-1 text-sm font-medium text-gray-700">
              Kota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="kota"
              name="kota"
              value={formData.checklistSuratJalan.kota}
              onChange={handleChecklistChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
              placeholder="Kota tujuan"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FormModal
      show={show}
      onClose={onClose}
      title="Tambah Surat Jalan Baru"
      subtitle="Lengkapi data untuk membuat surat jalan baru."
      isSubmitting={isSubmitting}
      isEdit={false}
      handleSubmit={handleSubmit}
      entityName="Surat Jalan"
    >
      {renderBasicInfoSection()}
      {renderChecklistSection()}
    </FormModal>
  );
};

export default AddSuratJalanModal;
