import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useScheduledPriceOperations from '../../hooks/useScheduledPriceOperations';
import { searchItems } from '../../services/itemService';
import customerService from '../../services/customerService';
import Autocomplete from '../common/Autocomplete';
import BulkUploadScheduledPrice from './BulkUploadScheduledPrice';

const AddScheduledPriceModal = ({ onClose, onSuccess }) => {
  const { createSchedule, loading, validateScheduleData } = useScheduledPriceOperations();
  const [activeTab, setActiveTab] = useState('single');

  const [formData, setFormData] = useState({
    itemPriceId: '',
    itemId: '',
    customerId: '',
    effectiveDate: '',
    harga: '',
    pot1: '',
    harga1: '',
    pot2: '',
    harga2: '',
    ppn: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [itemOptions, setItemOptions] = useState([]);
  const [searchingItem, setSearchingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Auto-calculate harga1 (after pot1)
  useEffect(() => {
    if (formData.harga && formData.pot1) {
      const harga = parseFloat(formData.harga);
      const pot1 = parseFloat(formData.pot1);
      const harga1 = harga - (harga * pot1 / 100);
      setFormData(prev => ({ ...prev, harga1: harga1.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, harga1: '' }));
    }
  }, [formData.harga, formData.pot1]);

  // Auto-calculate harga2 (after pot2)
  useEffect(() => {
    if (formData.harga1 && formData.pot2) {
      const harga1 = parseFloat(formData.harga1);
      const pot2 = parseFloat(formData.pot2);
      const harga2 = harga1 - (harga1 * pot2 / 100);
      setFormData(prev => ({ ...prev, harga2: harga2.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, harga2: '' }));
    }
  }, [formData.harga1, formData.pot2]);

  const handleSearchItem = async (query) => {
    if (!query || query.length < 1) {
      setItemOptions([]);
      return;
    }

    setSearchingItem(true);
    try {
      const response = await searchItems(query, 1, 10);
      // Handle nested data structure: response.data.data
      const items = response.data?.data || response.data || [];

      // Transform to include display format
      const formattedItems = items.map(item => ({
        ...item,
        displayName: `${item.plu} - ${item.nama_barang}`,
        currentPrice: item.itemPrice?.harga
      }));

      setItemOptions(formattedItems);
    } catch (error) {
      console.error('Search error:', error);
      setItemOptions([]);
    } finally {
      setSearchingItem(false);
    }
  };

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    setFormData(prev => ({ ...prev, itemId }));

    if (itemId) {
      const item = itemOptions.find(itm => itm.id === itemId);
      if (item) {
        setSelectedItem(item);

        // Set itemPriceId from item
        if (item.itemPrice && item.itemPrice.id) {
          setFormData(prev => ({
            ...prev,
            itemPriceId: item.itemPrice.id,
            itemId: item.id
          }));
        }
      }
    } else {
      setSelectedItem(null);
      setFormData(prev => ({ ...prev, itemPriceId: '' }));
    }

    // Clear error when item is selected
    if (errors.itemPriceId) {
      setErrors(prev => ({ ...prev, itemPriceId: '' }));
    }
  };

  const handleSearchCustomer = async (query) => {
    if (!query || query.length < 1) {
      setCustomerOptions([]);
      return;
    }

    setSearchingCustomer(true);
    try {
      const response = await customerService.search(query, 1, 10);
      const customers = response.data?.data || response.data || [];
      const formattedCustomers = customers.map(c => ({
        ...c,
        displayName: `${c.kodeCustomer} - ${c.namaCustomer}`
      }));
      setCustomerOptions(formattedCustomers);
    } catch (error) {
      console.error('Customer search error:', error);
      setCustomerOptions([]);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setFormData(prev => ({ ...prev, customerId }));

    if (customerId) {
      const customer = customerOptions.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateScheduleData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Prepare data for submission
      const submitData = {
        itemPriceId: formData.itemPriceId,
        customerId: formData.customerId || null,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
        harga: parseFloat(formData.harga),
        pot1: formData.pot1 ? parseFloat(formData.pot1) : null,
        harga1: formData.harga1 ? parseFloat(formData.harga1) : null,
        pot2: formData.pot2 ? parseFloat(formData.pot2) : null,
        harga2: formData.harga2 ? parseFloat(formData.harga2) : null,
        ppn: formData.ppn ? parseFloat(formData.ppn) : null,
        notes: formData.notes || null
      };

      await createSchedule(submitData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Create schedule error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Price Schedule</h2>
            <p className="text-sm text-gray-600">Set a scheduled price for an item</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'single'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Tambah Satu
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bulk'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Bulk Upload
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Bulk Upload Tab */}
          {activeTab === 'bulk' && (
            <BulkUploadScheduledPrice onClose={onClose} onSuccess={onSuccess} />
          )}

          {/* Single Add Tab */}
          {activeTab === 'single' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Search with Autocomplete */}
              <div>
                <Autocomplete
                  label="Item / Product"
                  placeholder="Search by PLU or item name..."
                  value={formData.itemId}
                  onChange={handleItemChange}
                  options={itemOptions}
                  displayKey="displayName"
                  valueKey="id"
                  onSearch={handleSearchItem}
                  loading={searchingItem}
                  required={true}
                  name="itemId"
                />
                {errors.itemPriceId && (
                  <p className="text-sm text-red-600 mt-1">{errors.itemPriceId}</p>
                )}
                {selectedItem && selectedItem.itemPrice && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current Price: Rp {selectedItem.itemPrice.harga?.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Customer (Optional) */}
              <div>
                <Autocomplete
                  label="Customer (Opsional)"
                  placeholder="Kosongkan jika berlaku untuk semua customer..."
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  options={customerOptions}
                  displayKey="displayName"
                  valueKey="id"
                  onSearch={handleSearchCustomer}
                  loading={searchingCustomer}
                  required={false}
                  name="customerId"
                />
                {selectedCustomer && (
                  <p className="text-sm text-gray-600 mt-1">
                    Harga ini hanya berlaku untuk: {selectedCustomer.namaCustomer}
                  </p>
                )}
                {!formData.customerId && (
                  <p className="text-xs text-gray-400 mt-1">
                    Jika tidak dipilih, harga berlaku untuk semua customer
                  </p>
                )}
              </div>

              {/* Effective Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
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
                  {loading ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddScheduledPriceModal;
