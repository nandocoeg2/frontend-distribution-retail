import React, { useState, useEffect } from 'react';
import Autocomplete from '../common/Autocomplete';
import { groupCustomerService } from '../../services/groupCustomerService';

const AutocompleteTest = () => {
  const [groupCustomers, setGroupCustomers] = useState([]);
  const [selectedGroupCustomer, setSelectedGroupCustomer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupCustomers = async () => {
      try {
        const response = await groupCustomerService.getAllGroupCustomers(1, 100);
        if (response.success) {
          const data = response.data.groupCustomers || [];
          console.log('Test - Group customers loaded:', data);
          setGroupCustomers(data);
        }
      } catch (error) {
        console.error('Test - Error loading group customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupCustomers();
  }, []);

  const handleGroupCustomerChange = (e) => {
    console.log('Test - Group customer changed:', e.target.value);
    setSelectedGroupCustomer(e.target.value);
  };

  if (loading) {
    return <div>Loading test data...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Autocomplete Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Group Customer ID: {selectedGroupCustomer}
        </label>
      </div>

      <Autocomplete
        label="Group Customer"
        name="groupCustomerId"
        options={groupCustomers}
        value={selectedGroupCustomer}
        onChange={handleGroupCustomerChange}
        placeholder="Search for a group customer"
        displayKey="nama_group"
        valueKey="id"
        required
      />

      <div className="mt-4">
        <h3 className="font-medium mb-2">Available Options:</h3>
        <ul className="text-sm text-gray-600">
          {groupCustomers.map((gc) => (
            <li key={gc.id}>
              {gc.nama_group} (ID: {gc.id})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AutocompleteTest;
