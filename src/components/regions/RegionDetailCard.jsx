import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  GlobeAltIcon,
  MapIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { formatDateTime } from '../../utils/formatUtils';
import { InfoTable, StatusBadge } from '../ui';
import toastService from '../../services/toastService';
import { regionService } from '../../services/regionService';

const RegionDetailCard = ({ region, onClose, onUpdate, handleAuthError }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    kode_region: '',
    nama_region: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (region) {
      setFormData({
        kode_region: region.kode_region || '',
        nama_region: region.nama_region || ''
      });
    }
  }, [region]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values
    if (region) {
      setFormData({
        kode_region: region.kode_region || '',
        nama_region: region.nama_region || ''
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
    if (!formData.kode_region || !formData.nama_region) {
      toastService.error('Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      await regionService.updateRegion(region.id, formData);
      toastService.success('Region updated successfully');
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating region:', err);
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error('Failed to update region');
    } finally {
      setSaving(false);
    }
  };

  if (!region) return null;

  const isDeleted = Boolean(region?.is_deleted);
  const statusVariant = isDeleted ? 'danger' : 'success';
  const statusLabel = isDeleted ? 'Deleted' : 'Active';

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Region Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            {region?.nama_region || 'No region name available'}
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
                  Region Code *
                </label>
                <input
                  type='text'
                  name='kode_region'
                  value={formData.kode_region}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., REG001'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Region Name *
                </label>
                <input
                  type='text'
                  name='nama_region'
                  value={formData.nama_region}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., Jakarta'
                />
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Region Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <MapIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Region Information</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Region Name', value: region?.nama_region },
                { label: 'Region Code', value: region?.kode_region, copyable: true },
                {
                  label: 'Status',
                  component: (
                    <StatusBadge
                      status={statusLabel}
                      variant={statusVariant}
                      dot
                    />
                  ),
                },
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
                { label: 'Created By', value: region?.createdBy || '—' },
                { label: 'Created At', value: formatDateTime(region?.createdAt) },
                { label: 'Updated By', value: region?.updatedBy || '—' },
                { label: 'Updated At', value: formatDateTime(region?.updatedAt) },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionDetailCard;
