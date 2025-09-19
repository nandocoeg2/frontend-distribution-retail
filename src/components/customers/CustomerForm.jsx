import React, { useState, useEffect } from 'react';
import { groupCustomerService } from '@/services/groupCustomerService';
import regionService from '@/services/regionService';
import toastService from '@/services/toastService';
import Autocomplete from '@/components/common/Autocomplete';

const CustomerForm = ({ formData, handleInputChange, handleSubmit, closeModal, isEdit = false, isSubmitting = false }) => {
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        const [groupCustomersResponse, regionsResponse] = await Promise.all([
          groupCustomerService.getAllGroupCustomers(1, 100),
          regionService.getAllRegions(1, 100)
        ]);
        
        if (groupCustomersResponse.success) {
          // API mengembalikan data dalam format: {success: true, data: {data: [...], pagination: {...}}}
          const groupCustomersData = groupCustomersResponse.data.data || [];
          setGroupCustomers(groupCustomersData);
        } else {
          throw new Error(groupCustomersResponse.error?.message || 'Failed to fetch group customers');
        }
        
        // RegionService returns data directly in the expected format
        const regionsData = regionsResponse.data || [];
        setRegions(regionsData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toastService.error('Failed to load required data for the form.');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleAutocompleteChange = (name, value) => {
    handleInputChange({ target: { name, value } });
  };

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit}>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
        {/* Customer Name */}
        <div className="md:col-span-2">
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Customer Name *
          </label>
          <input
            type='text'
            name='namaCustomer'
            value={formData.namaCustomer}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Customer Code */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Customer Code *
          </label>
          <input
            type='text'
            name='kodeCustomer'
            value={formData.kodeCustomer}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Phone Number *
          </label>
          <input
            type='tel'
            name='phoneNumber'
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Group Customer Autocomplete */}
        <div>
          <Autocomplete
            label="Group Customer"
            name="groupCustomerId"
            options={groupCustomers}
            value={formData.groupCustomerId}
            onChange={(e) => handleAutocompleteChange('groupCustomerId', e.target.value)}
            placeholder="Search for a group"
            displayKey="nama_group"
            valueKey="id"
            required
            disabled={isLoading}
          />
        </div>

        {/* Region Autocomplete */}
        <div>
          <Autocomplete
            label="Region"
            name="regionId"
            options={regions}
            value={formData.regionId}
            onChange={(e) => handleAutocompleteChange('regionId', e.target.value)}
            placeholder="Search for a region"
            displayKey="nama_region"
            valueKey="id"
            required
            disabled={isLoading}
          />
        </div>

        {/* Shipping Address */}
        <div className="md:col-span-2">
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Shipping Address *
          </label>
          <textarea
            name='alamatPengiriman'
            value={formData.alamatPengiriman}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            rows='2'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Email
          </label>
          <input
            type='email'
            name='email'
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* NPWP */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            NPWP
          </label>
          <input
            type='text'
            name='NPWP'
            value={formData.NPWP}
            onChange={handleInputChange}
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* NPWP Address */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            NPWP Address
          </label>
          <textarea
            name='alamatNPWP'
            value={formData.alamatNPWP}
            onChange={handleInputChange}
            disabled={isLoading}
            rows='1'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Description
          </label>
          <textarea
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            disabled={isLoading}
            rows='2'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>
      </div>

      <div className='mt-6 flex justify-end space-x-3'>
        <button
          type='button'
          onClick={closeModal}
          disabled={isSubmitting}
          className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300'
          disabled={isLoading}
        >
          {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Customer')}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;

