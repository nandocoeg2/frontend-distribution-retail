import React, { useState, useEffect, useMemo } from 'react';
import { groupCustomerService } from '@/services/groupCustomerService';
import regionService from '@/services/regionService';
import toastService from '@/services/toastService';
import Autocomplete from '@/components/common/Autocomplete';
import CustomerPICForm from './CustomerPICForm';

const CustomerForm = ({ onSubmit, onClose, initialData = {}, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    namaCustomer: '',
    kodeCustomer: '',
    groupCustomerId: '',
    regionId: '',
    alamatPengiriman: '',
    phoneNumber: '',
    email: '',
    NPWP: '',
    alamatNPWP: '',
    description: '',
    customerPics: [],
  });
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const memoizedInitialData = useMemo(() => initialData, [
    initialData?.namaCustomer,
    initialData?.kodeCustomer,
    initialData?.groupCustomerId,
    initialData?.regionId,
    initialData?.alamatPengiriman,
    initialData?.phoneNumber,
    initialData?.email,
    initialData?.NPWP,
    initialData?.alamatNPWP,
    initialData?.description,
    initialData?.customerPics
  ]);

  useEffect(() => {
    if (memoizedInitialData) {
      setFormData({
        namaCustomer: memoizedInitialData.namaCustomer || '',
        kodeCustomer: memoizedInitialData.kodeCustomer || '',
        groupCustomerId: memoizedInitialData.groupCustomerId || '',
        regionId: memoizedInitialData.regionId || '',
        alamatPengiriman: memoizedInitialData.alamatPengiriman || '',
        phoneNumber: memoizedInitialData.phoneNumber || '',
        email: memoizedInitialData.email || '',
        NPWP: memoizedInitialData.NPWP || '',
        alamatNPWP: memoizedInitialData.alamatNPWP || '',
        description: memoizedInitialData.description || '',
        customerPics: memoizedInitialData.customerPics?.map(pic => ({
          nama_pic: pic.nama_pic || '',
          dept: pic.dept || '',
          telpon: pic.telpon || '',
          default: pic.default || false
        })) || [],
      });
    }
  }, [memoizedInitialData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setDropdownLoading(true);
        const [groupCustomersResponse, regionsResponse] = await Promise.all([
          groupCustomerService.getAllGroupCustomers(1, 100),
          regionService.getAllRegions(1, 100)
        ]);
        
        if (groupCustomersResponse.success) {
          const groupCustomersData = groupCustomersResponse.data.data || [];
          setGroupCustomers(groupCustomersData);
        } else {
          throw new Error(groupCustomersResponse.error?.message || 'Failed to fetch group customers');
        }
        
        const regionsData = regionsResponse.data || [];
        setRegions(regionsData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toastService.error('Failed to load required data for the form.');
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePICsChange = (pics) => {
    setFormData(prev => ({ ...prev, customerPics: pics }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      // Filter out empty values
      ...Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      )
    };
    onSubmit(dataToSubmit);
  };

  const isLoading = dropdownLoading || loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
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
            onChange={handleChange}
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
            onChange={handleChange}
            required
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Phone Number
          </label>
          <input
            type='tel'
            name='phoneNumber'
            value={formData.phoneNumber}
            onChange={handleChange}
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
            Shipping Address
          </label>
          <textarea
            name='alamatPengiriman'
            value={formData.alamatPengiriman}
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
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
            onChange={handleChange}
            disabled={isLoading}
            rows='2'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>
      </div>

      {/* Customer PICs Section */}
      <div className="pt-4 border-t border-gray-200">
        <CustomerPICForm
          pics={formData.customerPics}
          onChange={handlePICsChange}
          disabled={isLoading}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          disabled={loading}
        >
          Close
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : (memoizedInitialData?.id ? 'Update Customer' : 'Create Customer')}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;

