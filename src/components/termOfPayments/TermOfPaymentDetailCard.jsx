import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  CreditCardIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable } from '../ui';
import toastService from '../../services/toastService';

const TermOfPaymentDetailCard = ({ termOfPayment, onClose, onUpdate, updateTermOfPayment }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    kode_top: '',
    batas_hari: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (termOfPayment) {
      setFormData({
        kode_top: termOfPayment.kode_top || '',
        batas_hari: termOfPayment.batas_hari || ''
      });
    }
  }, [termOfPayment]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values
    if (termOfPayment) {
      setFormData({
        kode_top: termOfPayment.kode_top || '',
        batas_hari: termOfPayment.batas_hari || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'batas_hari' ? parseInt(value) || '' : value 
    }));
  };

  const handleSave = async () => {
    if (!formData.kode_top || !formData.batas_hari) {
      toastService.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateTermOfPayment(termOfPayment.id, formData);
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating term of payment:', error);
      toastService.error('Failed to update term of payment');
    } finally {
      setSaving(false);
    }
  };

  if (!termOfPayment) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Term of Payment Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <CreditCardIcon className="h-4 w-4 text-gray-400" />
            {termOfPayment?.kode_top || 'No TOP code available'}
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
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Code *
                </label>
                <input
                  type='text'
                  name='kode_top'
                  value={formData.kode_top}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., TOP001'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Days Limit *
                </label>
                <input
                  type='number'
                  name='batas_hari'
                  value={formData.batas_hari}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., 30'
                />
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Term Code', value: termOfPayment?.kode_top, copyable: true },
                { label: 'Days Limit', value: termOfPayment?.batas_hari ? `${termOfPayment.batas_hari} days` : 'N/A' },
                { label: 'Description', value: termOfPayment?.description || '—' },
              ]}
            />
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Created By', value: termOfPayment?.createdBy || '—' },
                { label: 'Created At', value: formatDateTime(termOfPayment?.createdAt) },
                { label: 'Updated By', value: termOfPayment?.updatedBy || '—' },
                { label: 'Updated At', value: formatDateTime(termOfPayment?.updatedAt) },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TermOfPaymentDetailCard;
