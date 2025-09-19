import { useState, useEffect } from 'react';
import toastService from '@/services/toastService';

const useSupplierForm = (initialData = null, onSubmit) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phoneNumber: '',
    bank: {
      name: '',
      account: '',
      holder: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        address: initialData.address || '',
        phoneNumber: initialData.phoneNumber || '',
        bank: {
          name: initialData.bank?.name || '',
          account: initialData.bank?.account || '',
          holder: initialData.bank?.holder || ''
        }
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nama supplier wajib diisi';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Kode supplier wajib diisi';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat supplier wajib diisi';
    }

    // Bank validation (if any bank field is filled, all are required)
    const hasBankData = formData.bank.name || formData.bank.account || formData.bank.holder;
    if (hasBankData) {
      if (!formData.bank.name.trim()) {
        newErrors['bank.name'] = 'Nama bank wajib diisi jika informasi bank diisi';
      }
      if (!formData.bank.account.trim()) {
        newErrors['bank.account'] = 'Nomor rekening wajib diisi jika informasi bank diisi';
      }
      if (!formData.bank.holder.trim()) {
        newErrors['bank.holder'] = 'Nama pemegang rekening wajib diisi jika informasi bank diisi';
      }
    }

    // Phone number validation (optional but if provided, should be valid format)
    if (formData.phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor telepon tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('bank.')) {
      const bankField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bank: {
          ...prev.bank,
          [bankField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toastService.error('Mohon perbaiki error pada form');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        address: formData.address.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        bank: formData.bank.name || formData.bank.account || formData.bank.holder 
          ? {
              name: formData.bank.name.trim(),
              account: formData.bank.account.trim(),
              holder: formData.bank.holder.trim()
            }
          : undefined
      };

      await onSubmit(submitData);
      
      // Reset form if not editing
      if (!initialData) {
        setFormData({
          name: '',
          code: '',
          address: '',
          phoneNumber: '',
          bank: {
            name: '',
            account: '',
            holder: ''
          }
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phoneNumber: '',
      bank: {
        name: '',
        account: '',
        holder: ''
      }
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    resetForm,
    validateForm
  };
};

export default useSupplierForm;
