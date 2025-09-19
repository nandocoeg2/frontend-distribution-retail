import React, { useState } from 'react';
import CustomerForm from '@/components/customers/CustomerForm';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';
import FormModal from '@/components/common/FormModal';

const AddCustomerModal = ({ show, onClose, onCustomerAdded, handleAuthError }) => {
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
      await customerService.createCustomer(customerData);
      toastService.success('Customer created successfully');
      onCustomerAdded();
    } catch (err) {
      if (handleAuthError && handleAuthError(err)) {
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to create customer';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      show={show}
      onClose={onClose}
      title="Add New Customer"
      subtitle="Fill in the details to create a new customer"
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      entityName="Customer"
    >
      <CustomerForm
        formData={formData}
        handleInputChange={handleInputChange}
        isSubmitting={isSubmitting}
        isEdit={false}
      />
    </FormModal>
  );
};

export default AddCustomerModal;
