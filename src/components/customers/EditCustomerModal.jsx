import React, { useState, useEffect } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import FormModal from '@/components/common/FormModal';

const EditCustomerModal = ({ show, onClose, customer, onCustomerUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    namaCustomer: '',
    kodeCustomer: '',
    groupCustomerId: '',
    regionId: '',
    alamatPengiriman: '',
    phoneNumber: '',
    email: '',
    NPWP: '',
    alamatNPWP: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        namaCustomer: customer.namaCustomer || '',
        kodeCustomer: customer.kodeCustomer || '',
        groupCustomerId: customer.groupCustomerId || '',
        regionId: customer.regionId || '',
        alamatPengiriman: customer.alamatPengiriman || '',
        phoneNumber: customer.phoneNumber || '',
        email: customer.email || '',
        NPWP: customer.NPWP || '',
        alamatNPWP: customer.alamatNPWP || '',
        description: customer.description || '',
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const customerData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== '')
    );

    try {
      await customerService.updateCustomer(customer.id, customerData);
      toastService.success('Customer updated successfully');
      onCustomerUpdated();
    } catch (err) {
      if (handleAuthError && handleAuthError(err)) {
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to update customer';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      onClose={onClose}
      title="Edit Customer"
      subtitle="Edit the customer details"
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEdit
    >
      <CustomerForm
        formData={formData}
        handleInputChange={handleInputChange}
        isSubmitting={isSubmitting}
        isEdit
      />
    </FormModal>
  );
};

export default EditCustomerModal;
