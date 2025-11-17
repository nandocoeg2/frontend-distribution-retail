import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  KeyIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable } from '../ui';
import toastService from '@/services/toastService';
import MasterParameterForm from './MasterParameterForm';

const MasterParameterDetailCard = ({ parameter, onClose, onUpdate, updateParameter }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (parameter) {
      setFormData({
        key: parameter.key || '',
        value: parameter.value || '',
        description: parameter.description || ''
      });
    }
  }, [parameter]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (parameter) {
      setFormData({
        key: parameter.key || '',
        value: parameter.value || '',
        description: parameter.description || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) {
      toastService.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await updateParameter(parameter.id, formData);
      if (response && response.success) {
        toastService.success('Master parameter updated successfully');
        setIsEditMode(false);
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating parameter:', error);
      toastService.error(error.message || 'Failed to update parameter');
    } finally {
      setSaving(false);
    }
  };

  if (!parameter) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Master Parameter Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <KeyIcon className="h-4 w-4 text-gray-400" />
            {parameter?.key || 'No key available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditMode ? (
            <>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        /* EDIT MODE */
        <div className="bg-gray-50 rounded-lg p-6">
          <MasterParameterForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleSubmit={(e) => { e.preventDefault(); handleSave(); }} 
            closeModal={handleCancelEdit}
            isEdit={true}
          />
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Parameter Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <KeyIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Parameter Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Key', value: parameter?.key, copyable: true },
                { 
                  label: 'Value', 
                  component: (
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                      {parameter?.value}
                    </div>
                  )
                },
              ]}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {parameter?.description || 'No description provided.'}
            </p>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Created By', value: parameter?.createdBy || '—' },
                { label: 'Created At', value: formatDateTime(parameter?.createdAt) },
                { label: 'Updated By', value: parameter?.updatedBy || '—' },
                { label: 'Updated At', value: formatDateTime(parameter?.updatedAt) },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterParameterDetailCard;
