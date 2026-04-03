import { useState } from 'react';
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        <h3 className='text-lg font-medium text-gray-900 px-5 py-3 border-b border-gray-200'>
          Add New Master Parameter
        </h3>
        <div className='px-5 py-4 overflow-y-auto max-h-[calc(85vh-60px)]'>
        <MasterParameterForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleSubmit} 
          closeModal={handleClose}
        />
        </div>
      </div>
    </div>
  );
};

export default AddMasterParameterModal;
