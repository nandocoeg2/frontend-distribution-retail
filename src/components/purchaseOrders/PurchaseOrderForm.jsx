import React, { useState, useEffect, useRef } from 'react';
import customerService from '../../services/customerService';

const PurchaseOrderForm = ({ formData, handleInputChange, statuses = [], onGeneratePONumber, isEditMode = false, customerName = '' }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Fetch all customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAllCustomers();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    handleInputChange({
      target: {
        name: 'customerId',
        value: customer.id
      }
    });
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
  };

  // Handle input change for customer search
  const handleCustomerSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    
    // Clear the customer ID if the search term is empty
    if (!e.target.value) {
      handleInputChange({
        target: {
          name: 'customerId',
          value: ''
        }
      });
    }
  };

  // Set initial search term when in edit mode and customer ID exists
  useEffect(() => {
    if (isEditMode && formData.customerId && customerName) {
      setSearchTerm(customerName);
    }
  }, [isEditMode, formData.customerId, customerName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Number *
          </label>
          <div className="flex">
            <input
              type="text"
              name="po_number"
              value={formData.po_number || ''}
              onChange={handleInputChange}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={onGeneratePONumber}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 text-sm font-medium"
            >
              Generate
            </button>
          </div>
        </div>

        <div ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer *
          </label>
          <div className="relative">
            <input
              type="text"
              name="customerSearch"
              value={searchTerm}
              onChange={handleCustomerSearchChange}
              required
              placeholder="Search customer by name or ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onFocus={() => setIsDropdownOpen(true)}
            />
            <input
              type="hidden"
              name="customerId"
              value={formData.customerId || ''}
              onChange={handleInputChange}
            />
            {isDropdownOpen && filteredCustomers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                <ul className="py-1">
                  {filteredCustomers.map((customer) => (
                    <li
                      key={customer.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.id}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">Select a customer for this purchase order</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Items *
          </label>
          <input
            type="number"
            name="total_items"
            value={formData.total_items || 0}
            onChange={handleInputChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Date *
          </label>
          <input
            type="date"
            name="tanggal_order"
            value={formData.tanggal_order || ''}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Type *
          </label>
          <input
            type="text"
            name="po_type"
            value={formData.po_type || ''}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            name="statusId"
            value={formData.statusId || ''}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.status_name} - {status.status_description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surat Jalan
        </label>
        <input
          type="text"
          name="suratJalan"
          value={formData.suratJalan || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invoice Pengiriman
        </label>
        <input
          type="text"
          name="invoicePengiriman"
          value={formData.invoicePengiriman || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surat PO
        </label>
        <input
          type="text"
          name="suratPO"
          value={formData.suratPO || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surat Penagihan
        </label>
        <input
          type="text"
          name="suratPenagihan"
          value={formData.suratPenagihan || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
