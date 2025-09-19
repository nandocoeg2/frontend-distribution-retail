import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import suratJalanService from '../services/suratJalanService';

const useSuratJalanForm = (initialData = null, isEdit = false) => {
  const [formData, setFormData] = useState({
    no_surat_jalan: '',
    deliver_to: '',
    PIC: '',
    alamat_tujuan: '',
    invoiceId: null,
    suratJalanDetails: [
      {
        no_box: '',
        total_quantity_in_box: 0,
        isi_box: 0,
        sisa: 0,
        total_box: 0,
        items: [
          {
            nama_barang: '',
            PLU: '',
            quantity: 0,
            satuan: 'pcs',
            total_box: 0,
            keterangan: ''
          }
        ]
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        no_surat_jalan: initialData.no_surat_jalan || '',
        deliver_to: initialData.deliver_to || '',
        PIC: initialData.PIC || '',
        alamat_tujuan: initialData.alamat_tujuan || '',
        invoiceId: initialData.invoiceId || null,
        suratJalanDetails: initialData.suratJalanDetails || [
          {
            no_box: '',
            total_quantity_in_box: 0,
            isi_box: 0,
            sisa: 0,
            total_box: 0,
            items: [
              {
                nama_barang: '',
                PLU: '',
                quantity: 0,
                satuan: 'pcs',
                total_box: 0,
                keterangan: ''
              }
            ]
          }
        ]
      });
    }
  }, [isEdit, initialData]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate main form fields
    if (!formData.no_surat_jalan.trim()) {
      newErrors.no_surat_jalan = 'Nomor surat jalan wajib diisi';
    }

    if (!formData.deliver_to.trim()) {
      newErrors.deliver_to = 'Nama penerima wajib diisi';
    }

    if (!formData.PIC.trim()) {
      newErrors.PIC = 'PIC wajib diisi';
    }

    if (!formData.alamat_tujuan.trim()) {
      newErrors.alamat_tujuan = 'Alamat tujuan wajib diisi';
    }

    // Validate surat jalan details
    if (!formData.suratJalanDetails || formData.suratJalanDetails.length === 0) {
      newErrors.suratJalanDetails = 'Minimal harus ada satu detail surat jalan';
    } else {
      formData.suratJalanDetails.forEach((detail, detailIndex) => {
        if (!detail.no_box.trim()) {
          newErrors[`suratJalanDetails.${detailIndex}.no_box`] = 'Nomor box wajib diisi';
        }

        if (detail.total_quantity_in_box <= 0) {
          newErrors[`suratJalanDetails.${detailIndex}.total_quantity_in_box`] = 'Total quantity dalam box harus lebih dari 0';
        }

        if (detail.isi_box <= 0) {
          newErrors[`suratJalanDetails.${detailIndex}.isi_box`] = 'Isi box harus lebih dari 0';
        }

        if (detail.total_box <= 0) {
          newErrors[`suratJalanDetails.${detailIndex}.total_box`] = 'Total box harus lebih dari 0';
        }

        // Validate items
        if (!detail.items || detail.items.length === 0) {
          newErrors[`suratJalanDetails.${detailIndex}.items`] = 'Minimal harus ada satu item dalam box';
        } else {
          detail.items.forEach((item, itemIndex) => {
            if (!item.nama_barang.trim()) {
              newErrors[`suratJalanDetails.${detailIndex}.items.${itemIndex}.nama_barang`] = 'Nama barang wajib diisi';
            }

            if (!item.PLU.trim()) {
              newErrors[`suratJalanDetails.${detailIndex}.items.${itemIndex}.PLU`] = 'PLU wajib diisi';
            }

            if (item.quantity <= 0) {
              newErrors[`suratJalanDetails.${detailIndex}.items.${itemIndex}.quantity`] = 'Quantity harus lebih dari 0';
            }

            if (!item.satuan.trim()) {
              newErrors[`suratJalanDetails.${detailIndex}.items.${itemIndex}.satuan`] = 'Satuan wajib diisi';
            }

            if (item.total_box <= 0) {
              newErrors[`suratJalanDetails.${detailIndex}.items.${itemIndex}.total_box`] = 'Total box harus lebih dari 0';
            }
          });
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);

    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const handleDetailChange = useCallback((detailIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      suratJalanDetails: prev.suratJalanDetails.map((detail, index) =>
        index === detailIndex ? { ...detail, [field]: value } : detail
      )
    }));
    setIsDirty(true);

    // Clear specific field error
    const errorKey = `suratJalanDetails.${detailIndex}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  }, [errors]);

  const handleItemChange = useCallback((detailIndex, itemIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      suratJalanDetails: prev.suratJalanDetails.map((detail, dIndex) =>
        dIndex === detailIndex
          ? {
              ...detail,
              items: detail.items.map((item, iIndex) =>
                iIndex === itemIndex ? { ...item, [field]: value } : item
              )
            }
          : detail
      )
    }));
    setIsDirty(true);

    // Clear specific field error
    const errorKey = `suratJalanDetails.${detailIndex}.items.${itemIndex}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  }, [errors]);

  const addDetail = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      suratJalanDetails: [
        ...prev.suratJalanDetails,
        {
          no_box: '',
          total_quantity_in_box: 0,
          isi_box: 0,
          sisa: 0,
          total_box: 0,
          items: [
            {
              nama_barang: '',
              PLU: '',
              quantity: 0,
              satuan: 'pcs',
              total_box: 0,
              keterangan: ''
            }
          ]
        }
      ]
    }));
    setIsDirty(true);
  }, []);

  const removeDetail = useCallback((detailIndex) => {
    if (formData.suratJalanDetails.length > 1) {
      setFormData(prev => ({
        ...prev,
        suratJalanDetails: prev.suratJalanDetails.filter((_, index) => index !== detailIndex)
      }));
      setIsDirty(true);
    }
  }, [formData.suratJalanDetails.length]);

  const addItem = useCallback((detailIndex) => {
    setFormData(prev => ({
      ...prev,
      suratJalanDetails: prev.suratJalanDetails.map((detail, index) =>
        index === detailIndex
          ? {
              ...detail,
              items: [
                ...detail.items,
                {
                  nama_barang: '',
                  PLU: '',
                  quantity: 0,
                  satuan: 'pcs',
                  total_box: 0,
                  keterangan: ''
                }
              ]
            }
          : detail
      )
    }));
    setIsDirty(true);
  }, []);

  const removeItem = useCallback((detailIndex, itemIndex) => {
    setFormData(prev => ({
      ...prev,
      suratJalanDetails: prev.suratJalanDetails.map((detail, dIndex) =>
        dIndex === detailIndex
          ? {
              ...detail,
              items: detail.items.filter((_, iIndex) => iIndex !== itemIndex)
            }
          : detail
      )
    }));
    setIsDirty(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toastService.error('Mohon perbaiki error yang ada');
      return false;
    }

    try {
      setSubmitting(true);
      setLoading(true);

      let result;
      if (isEdit) {
        result = await suratJalanService.updateSuratJalan(initialData.id, formData);
      } else {
        result = await suratJalanService.createSuratJalan(formData);
      }

      if (result.success) {
        toastService.success(
          isEdit ? 'Surat jalan berhasil diperbarui' : 'Surat jalan berhasil dibuat'
        );
        setIsDirty(false);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to save surat jalan');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleAuthError();
        return false;
      }

      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const newErrors = {};
          errorData.errors.forEach(error => {
            newErrors[error.field] = error.message;
          });
          setErrors(newErrors);
        }
        toastService.error(errorData.message || 'Validation error');
      } else if (err.response?.status === 409) {
        toastService.error('Nomor surat jalan sudah ada');
      } else if (err.response?.status === 422) {
        toastService.error('Invoice ID tidak valid');
      } else {
        toastService.error(
          isEdit ? 'Gagal memperbarui surat jalan' : 'Gagal membuat surat jalan'
        );
      }
      return false;
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  }, [formData, isEdit, initialData?.id, validateForm, handleAuthError]);

  const resetForm = useCallback(() => {
    setFormData({
      no_surat_jalan: '',
      deliver_to: '',
      PIC: '',
      alamat_tujuan: '',
      invoiceId: null,
      suratJalanDetails: [
        {
          no_box: '',
          total_quantity_in_box: 0,
          isi_box: 0,
          sisa: 0,
          total_box: 0,
          items: [
            {
              nama_barang: '',
              PLU: '',
              quantity: 0,
              satuan: 'pcs',
              total_box: 0,
              keterangan: ''
            }
          ]
        }
      ]
    });
    setErrors({});
    setIsDirty(false);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    submitting,
    isDirty,
    handleInputChange,
    handleDetailChange,
    handleItemChange,
    addDetail,
    removeDetail,
    addItem,
    removeItem,
    handleSubmit,
    resetForm,
    clearErrors,
    validateForm
  };
};

export default useSuratJalanForm;
