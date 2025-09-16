import React, { useState } from 'react';
import RegionForm from '@/components/regions/RegionForm';
import toastService from '@/services/toastService';
import { regionService } from '@/services/regionService';

const AddRegionModal = ({ show, onClose, onRegionAdded, handleAuthError }) => {
  const [formData, setFormData] = useState({
    kode_region: '',
    nama_region: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const createRegion = async (e) => {
    e.preventDefault();

    try {
      const newRegion = await regionService.createRegion(formData);
      onRegionAdded(newRegion);
      toastService.success('Region created successfully');
      onClose();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to create region');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Region
        </h3>
        <RegionForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={createRegion} 
          closeModal={onClose} 
        />
      </div>
    </div>
  );
};

export default AddRegionModal;

