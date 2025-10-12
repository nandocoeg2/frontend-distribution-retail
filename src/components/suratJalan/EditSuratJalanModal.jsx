import React, { useState, useEffect } from 'react';
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
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

const EditSuratJalanModal = ({ show, onClose, suratJalan, onSuratJalanUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState(defaultFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});

  useEffect(() => {
    if (suratJalan) {
      const hasChecklist = suratJalan.checklistSuratJalan && Object.keys(suratJalan.checklistSuratJalan).length > 0;

      setFormData({
        no_surat_jalan: suratJalan.no_surat_jalan || '',
        deliver_to: suratJalan.deliver_to || '',
        PIC: suratJalan.PIC || '',
        alamat_tujuan: suratJalan.alamat_tujuan || '',
        invoiceId: suratJalan.invoiceId || '',
        checklistSuratJalan: hasChecklist ? {
          tanggal: suratJalan.checklistSuratJalan.tanggal ? new Date(suratJalan.checklistSuratJalan.tanggal).toISOString().slice(0, 16) : '',
          checker: suratJalan.checklistSuratJalan.checker || '',
          driver: suratJalan.checklistSuratJalan.driver || '',
          mobil: suratJalan.checklistSuratJalan.mobil || '',
          kota: suratJalan.checklistSuratJalan.kota || ''
        } : {
          tanggal: '',
          checker: '',
          driver: '',
          mobil: '',
          kota: ''
        },
        suratJalanDetails: suratJalan.suratJalanDetails || []
      });
    }
  }, [suratJalan]);

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

  const toggleDetail = (detailId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailId]: !prev[detailId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Normalize payload to match API contract
      const sanitizedChecklist = (() => {
        if (!formData.checklistSuratJalan) {
          return null;
        }

        const { id, suratJalanId, createdAt, updatedAt, ...restChecklist } = formData.checklistSuratJalan;
        let tanggalValue = restChecklist.tanggal;

        if (tanggalValue) {
          if (!tanggalValue.endsWith('Z')) {
            if (tanggalValue.length === 16) {
              tanggalValue += ':00Z';
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(tanggalValue)) {
              tanggalValue += '.000Z';
            }
          }
          tanggalValue = new Date(tanggalValue).toISOString();
        }

        return {
          ...restChecklist,
          tanggal: tanggalValue || null
        };
      })();

      const sanitizedDetails = (formData.suratJalanDetails || []).map(detail => {
        const { items, suratJalanDetailItems, createdAt, updatedAt, suratJalanId, ...detailRest } = detail;
        const detailItems = items || suratJalanDetailItems || [];

        const normalizedItems = detailItems.map(({ id, suratJalanDetailId, createdAt: itemCreatedAt, updatedAt: itemUpdatedAt, ...itemRest }) => ({
          ...itemRest
        }));

        return {
          ...detailRest,
          items: normalizedItems
        };
      });

      const submitData = {
        no_surat_jalan: formData.no_surat_jalan,
        deliver_to: formData.deliver_to,
        PIC: formData.PIC,
        alamat_tujuan: formData.alamat_tujuan,
        invoiceId: formData.invoiceId || null,
        checklistSuratJalan: sanitizedChecklist,
        suratJalanDetails: sanitizedDetails
      };

      const result = await suratJalanService.updateSuratJalan(suratJalan.id, submitData);
      onSuratJalanUpdated(result.data);
      toastService.success('Surat jalan updated successfully');
      onClose();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return;
      }
      console.error('Error updating surat jalan:', err);
      toastService.error('Failed to update surat jalan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfoSection = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <DocumentTextIcon className="mr-2 h-5 w-5 text-blue-600" aria-hidden="true" />
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
        <ClipboardDocumentCheckIcon className="mr-2 h-5 w-5 text-blue-600" aria-hidden="true" />
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

  const renderDetailsSection = () => {
    if (!formData.suratJalanDetails || formData.suratJalanDetails.length === 0) {
      return null;
    }

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          <ArchiveBoxIcon className="mr-2 h-5 w-5 text-indigo-600" aria-hidden="true" />
          Surat Jalan Details (Read-only)
        </h3>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/30">
          <p className="text-xs text-gray-600 mb-3">
            Total: {formData.suratJalanDetails.length} box(es)
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {formData.suratJalanDetails.map((detail, detailIndex) => (
              <div key={detail.id || detailIndex} className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleDetail(detail.id || detailIndex)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-blue-100 rounded">
                      <ArchiveBoxIcon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900">Box #{detail.no_box}</h5>
                      <p className="text-xs text-gray-600">
                        Total Qty: {detail.total_quantity_in_box} • Boxes: {detail.total_box}
                      </p>
                    </div>
                  </div>
                  {expandedDetails[detail.id || detailIndex] ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {expandedDetails[detail.id || detailIndex] && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                    <div className="mt-3 grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">No Box</label>
                        <input
                          type="text"
                          value={detail.no_box}
                          disabled
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Total Quantity in Box</label>
                        <input
                          type="number"
                          value={detail.total_quantity_in_box}
                          disabled
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Isi Box</label>
                        <input
                          type="number"
                          value={detail.isi_box}
                          disabled
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sisa</label>
                        <input
                          type="number"
                          value={detail.sisa}
                          disabled
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Total Box</label>
                        <input
                          type="number"
                          value={detail.total_box}
                          disabled
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>

                    {(detail.items || detail.suratJalanDetailItems) && (detail.items?.length > 0 || detail.suratJalanDetailItems?.length > 0) && (
                      <div>
                        <h6 className="text-xs font-semibold text-gray-700 mb-2">
                          Items ({(detail.items || detail.suratJalanDetailItems).length})
                        </h6>
                        <div className="overflow-x-auto border border-gray-200 rounded">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Nama Barang</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">PLU</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Satuan</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Total Box</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Keterangan</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(detail.items || detail.suratJalanDetailItems || []).map((item, itemIndex) => (
                                <tr key={item.id || itemIndex} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.nama_barang}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.PLU}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.quantity}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.satuan}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.total_box}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.keterangan || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <FormModal
      show={show}
      onClose={onClose}
      title="Edit Surat Jalan"
      subtitle="Perbarui detail surat jalan."
      isSubmitting={isSubmitting}
      isEdit={true}
      handleSubmit={handleSubmit}
      entityName="Surat Jalan"
    >
      {renderBasicInfoSection()}
      {renderChecklistSection()}
      {renderDetailsSection()}
    </FormModal>
  );
};

export default EditSuratJalanModal;
