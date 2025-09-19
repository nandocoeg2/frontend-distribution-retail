import React, { useState, useEffect } from 'react';
import UserForm from '@/components/users/UserForm';
import userService from '@/services/userService';
import toastService from '@/services/toastService';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditUserModal = ({ show, onClose, user, onUserUpdated, handleAuthError }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    companyId: '',
    phoneNumber: '',
    address: '',
    position: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Don't pre-fill password for security
        roleId: user.role?.id || '',
        companyId: user.company?.id || '',
        phoneNumber: user.profile?.phoneNumber || '',
        address: user.profile?.address || '',
        position: user.profile?.position || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Remove empty password field if not provided
    const userData = { ...formData };
    if (!userData.password) {
      delete userData.password;
    }

    // Remove empty fields
    const filteredData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== '')
    );

    try {
      await userService.updateUser(user.id, filteredData);
      toastService.success('User updated successfully');
      onUserUpdated();
    } catch (err) {
      if (handleAuthError && handleAuthError(err)) {
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      toastService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show || !user) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-600">Update user information</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <UserForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleSubmit={handleSubmit} 
            closeModal={onClose} 
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
