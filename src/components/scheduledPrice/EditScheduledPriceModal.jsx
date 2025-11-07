import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useScheduledPriceOperations from '../../hooks/useScheduledPriceOperations';

const EditScheduledPriceModal = ({ schedule, onClose, onSuccess }) => {
  const { updateSchedule, loading, validateScheduleData } = useScheduledPriceOperations();
  
  const [formData, setFormData] = useState({
    effectiveDate: schedule.effectiveDate ? schedule.effectiveDate.split('T')[0] : '',
    harga: schedule.harga || '',
    pot1: schedule.pot1 || '',
    harga1: schedule.harga1 || '',
    pot2: schedule.pot2 || '',
    harga2: schedule.harga2 || '',
    ppn: schedule.ppn || '',
    notes: schedule.notes || ''
  });

  const [errors, setErrors] = useState({});

  // Auto-calculate harga1 (after pot1)
  useEffect(() => {
    if (formData.harga && formData.pot1) {
      const harga = parseFloat(formData.harga);
      const pot1 = parseFloat(formData.pot1);
      const harga1 = harga - (harga * pot1 / 100);
      setFormData(prev => ({ ...prev, harga1: harga1.toFixed(2) }));
    }
  }, [formData.harga, formData.pot1]);

  // Auto-calculate harga2 (after pot2)
  useEffect(() => {
    if (formData.harga1 && formData.pot2) {
      const harga1 = parseFloat(formData.harga1);
      const pot2 = parseFloat(formData.pot2);
      const harga2 = harga1 - (harga1 * pot2 / 100);
      setFormData(prev => ({ ...prev, harga2: harga2.toFixed(2) }));
    }
  }, [formData.harga1, formData.pot2]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if status is still PENDING
    if (schedule.status !== 'PENDING') {
      setErrors({ general: 'Only PENDING schedules can be edited' });
      return;
    }

    // Validate
    const validationErrors = validateScheduleData({
      ...formData,
      itemPriceId: schedule.itemPriceId
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Prepare data for submission
      const submitData = {
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        harga: parseFloat(formData.harga),
        pot1: formData.pot1 ? parseFloat(formData.pot1) : null,
        harga1: formData.harga1 ? parseFloat(formData.harga1) : null,
        pot2: formData.pot2 ? parseFloat(formData.pot2) : null,
        harga2: formData.harga2 ? parseFloat(formData.harga2) : null,
        ppn: formData.ppn ? parseFloat(formData.ppn) : null,
        notes: formData.notes || null
      };

      await updateSchedule(schedule.id, submitData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update schedule error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Price Schedule</h2>
            <p className="text-sm text-gray-600">
              {schedule.itemPrice?.inventory?.nama_barang || 'Unknown Item'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleChange('effectiveDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.effectiveDate && (
                <p className="text-sm text-red-600 mt-1">{errors.effectiveDate}</p>
              )}
            </div>

            {/* Price Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.harga}
                  onChange={(e) => handleChange('harga', e.target.value)}
                  placeholder="12000"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.harga && (
                  <p className="text-sm text-red-600 mt-1">{errors.harga}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PPN (%)
                </label>
                <input
                  type="number"
                  value={formData.ppn}
                  onChange={(e) => handleChange('ppn', e.target.value)}
                  placeholder="11"
                  step="0.01"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Discounts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potongan A (%)
                </label>
                <input
                  type="number"
                  value={formData.pot1}
                  onChange={(e) => handleChange('pot1', e.target.value)}
                  placeholder="5"
                  step="0.01"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga After Pot A
                </label>
                <input
                  type="number"
                  value={formData.harga1}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potongan B (%)
                </label>
                <input
                  type="number"
                  value={formData.pot2}
                  onChange={(e) => handleChange('pot2', e.target.value)}
                  placeholder="2"
                  step="0.01"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga After Pot B
                </label>
                <input
                  type="number"
                  value={formData.harga2}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Optional notes about this price change..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditScheduledPriceModal;
