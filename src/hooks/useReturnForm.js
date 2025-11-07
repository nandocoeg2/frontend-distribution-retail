import { useCallback, useState } from 'react';
import { createReturn } from '@/services/returnsService';
import toastService from '@/services/toastService';

const DEFAULT_FORM = {
  itemId: '',
  quantity: '',
  reason: '',
};

const useReturnForm = ({ onSuccess } = {}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(() => {
    const nextErrors = {};
    const quantityValue = Number(formData.quantity);

    if (!formData.itemId) {
      nextErrors.itemId = 'Produk wajib dipilih.';
    }

    if (!formData.quantity || Number.isNaN(quantityValue) || quantityValue <= 0) {
      nextErrors.quantity = 'Jumlah harus lebih besar dari 0.';
    }

    if (!formData.reason || !formData.reason.trim()) {
      nextErrors.reason = 'Alasan retur wajib diisi.';
    }

    return nextErrors;
  }, [formData]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setSubmitting(true);

    try {
      const payload = {
        itemId: formData.itemId,
        quantity: Number(formData.quantity),
        reason: formData.reason.trim(),
      };

      await createReturn(payload);
      toastService.success('Retur berhasil dibuat.');
      resetForm();

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (err) {
      toastService.error(err.message || 'Gagal membuat retur.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSuccess, resetForm, validate]);

  return {
    formData,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    resetForm,
    validate,
    setFormData,
    setErrors,
  };
};

export default useReturnForm;
