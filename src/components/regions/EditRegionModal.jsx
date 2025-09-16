import React, { useState, useEffect } from 'react';
import RegionForm from '@/components/regions/RegionForm';
import toastService from '@/services/toastService';
import { regionService } from '@/services/regionService';

const EditRegionModal = ({ show, onClose, region, onRegionUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    kode_region: '',
    nama_region: '',
  });

  useEffect(() => {
    if (region) {
      setFormData({
        kode_region: region.kode_region,
        nama_region: region.nama_region,
      });
    }
  }, [region]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const updateRegion = async (e) => {
    e.preventDefault();

    try {
      const updatedRegion = await regionService.updateRegion(region.id, formData);
      onRegionUpdated(updatedRegion);
      toastService.success('Region updated successfully');
      onClose();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to update region');
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Edit Region
        </h3>
        <RegionForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={updateRegion} 
          closeModal={onClose}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default EditRegionModal;

