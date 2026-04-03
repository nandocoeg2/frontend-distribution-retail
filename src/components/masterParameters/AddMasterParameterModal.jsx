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
        <div className='flex items-center justify-between border-b border-gray-200 bg-blue-600 px-5 py-3 text-white'>
          <h3 className='text-base font-semibold'>Master Parameter</h3>
        </div>
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
