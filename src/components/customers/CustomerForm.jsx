import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { groupCustomerService } from '@/services/groupCustomerService';
import toastService from '@/services/toastService';
import Autocomplete from '@/components/common/Autocomplete';
import CustomerPICForm from './CustomerPICForm';

const CustomerForm = ({ onSubmit, onClose, initialData = {}, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    namaCustomer: '',
    kodeCustomer: '',
    groupCustomerId: '',
    region: '',
    alamatPengiriman: '',
    alamatNPWP: '',
    customerPics: [],
  });
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const memoizedInitialData = useMemo(() => initialData, [
    initialData?.namaCustomer,
    initialData?.kodeCustomer,
    initialData?.groupCustomerId,
    initialData?.region,
    initialData?.alamatPengiriman,
    initialData?.alamatNPWP,
    initialData?.customerPics
  ]);

  useEffect(() => {
    if (memoizedInitialData) {
      setFormData({
        namaCustomer: memoizedInitialData.namaCustomer || '',
        kodeCustomer: memoizedInitialData.kodeCustomer || '',
        groupCustomerId: memoizedInitialData.groupCustomerId || '',
        region: memoizedInitialData.region || '',
        alamatPengiriman: memoizedInitialData.alamatPengiriman || '',
        alamatNPWP: memoizedInitialData.alamatNPWP || '',
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
        const groupCustomersResponse = await groupCustomerService.getAllGroupCustomers(1, 100);
        
        if (groupCustomersResponse.success) {
          const groupCustomersData = groupCustomersResponse.data.data || [];
          setGroupCustomers(groupCustomersData);
        } else {
          throw new Error(groupCustomersResponse.error?.message || 'Failed to fetch group customers');
        }
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

  const handleGroupCustomerChange = (groupId) => {
    const selectedGroup = groupCustomers.find(group => group.id === groupId);
    setFormData(prev => {
      const updated = {
        ...prev,
        groupCustomerId: groupId,
      };
      
      if (selectedGroup) {
        updated.alamatNPWP = selectedGroup.alamat || '';
      }
      
      return updated;
    });
  };

  const handlePICsChange = (pics) => {
    setFormData(prev => ({ ...prev, customerPics: pics }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isLoading = dropdownLoading || loading;
  const selectedGroupCustomer = groupCustomers.find(group => group.id === formData.groupCustomerId)
    || (memoizedInitialData?.groupCustomer?.id === formData.groupCustomerId ? memoizedInitialData.groupCustomer : null)
    || null;

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
            placeholder='cth. Toko Sejahtera'
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
            placeholder='cth. CUST001'
          />
        </div>



        {/* Group Customer Autocomplete */}
        <div>
          <Autocomplete
            label="Group Customer"
            name="groupCustomerId"
            options={groupCustomers}
            value={formData.groupCustomerId}
            onChange={(e) => handleGroupCustomerChange(e.target.value)}
            placeholder="Search for a group"
            displayKey="nama_group"
            valueKey="id"
            required
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            NPWP: {selectedGroupCustomer?.npwp || '-'}
          </p>
        </div>

        {/* Region (Freetext) */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Region
          </label>
          <input
            type='text'
            name='region'
            value={formData.region}
            onChange={handleChange}
            disabled={isLoading}
            placeholder='cth. Jakarta Selatan'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          />
        </div>

        {/* Shipping Address */}
        <div className="md:col-span-2">
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Shipping Address *
          </label>
          <input
            type='text'
            name='alamatPengiriman'
            value={formData.alamatPengiriman}
            onChange={handleChange}
            required
            disabled={isLoading}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
            placeholder='cth. Jl. Kirim No. 5, Bandung'
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
