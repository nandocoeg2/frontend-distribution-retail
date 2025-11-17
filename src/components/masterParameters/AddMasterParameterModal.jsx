import React, { useState } from 'react';
import MasterParameterForm from './MasterParameterForm';

const AddMasterParameterModal = ({ show, onClose, onParameterAdded }) => {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onParameterAdded(formData);
  };

  const handleClose = () => {
    setFormData({
      key: '',
      value: '',
      description: ''
    });
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Add New Master Parameter
        </h3>
        <MasterParameterForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={handleClose}
        />
      </div>
    </div>
  );
};

export default AddMasterParameterModal;
