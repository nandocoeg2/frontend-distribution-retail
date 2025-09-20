import React, { useState, useEffect, useRef } from 'react';
import customerService from '../../services/customerService';
import useStatuses from '../../hooks/useStatuses';
import Autocomplete from '../common/Autocomplete';

const PurchaseOrderForm = ({ formData, handleInputChange, onGeneratePONumber, isEditMode = false, customerName = '' }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // Use purchase order statuses hook
  const { 
    purchaseOrderStatuses, 
    loading, 
    error: statusError,
    fetchPurchaseOrderStatuses 
  } = useStatuses();


  // Fetch purchase order statuses on component mount
  useEffect(() => {
    fetchPurchaseOrderStatuses();
  }, [fetchPurchaseOrderStatuses]);

  // Fetch all customers on component mount (for initial dropdown population)
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const response = await customerService.getAllCustomers(1, 20);
        const customersArray = Array.isArray(response.data) ? response.data : [];
        setCustomers(customersArray);
        setFilteredCustomers(customersArray);
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        setCustomers([]);
        setFilteredCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Set initial filtered customers when customers are loaded
  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

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

        <div>
          <Autocomplete
            label="Customer *"
            options={filteredCustomers}
            value={formData.customerId}
            onChange={handleInputChange}
            placeholder="Search customer by name or ID"
            displayKey="name"
            valueKey="id"
            name="customerId"
            required
            disabled={isLoading}
            loading={isLoading}
            onSearch={async (query) => {
              try {
                setIsLoading(true);
                const response = await customerService.searchCustomers(query, 1, 20);
                const customersArray = Array.isArray(response.data) ? response.data : [];
                setFilteredCustomers(customersArray);
              } catch (error) {
                console.error('Failed to search customers:', error);
                setFilteredCustomers([]);
              } finally {
                setIsLoading(false);
              }
            }}
            showId={true}
          />
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
            Tanggal Masuk PO *
          </label>
          <input
            type="date"
            name="tanggal_masuk_po"
            value={formData.tanggal_masuk_po || ''}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Batas Kirim
          </label>
          <input
            type="date"
            name="tanggal_batas_kirim"
            value={formData.tanggal_batas_kirim || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PO Type *
          </label>
          <select
            name="po_type"
            value={formData.po_type || ''}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select PO Type</option>
            <option value="SINGLE">SINGLE</option>
            <option value="BULK">BULK</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Code *
          </label>
          <select
            name="status_code"
            value={formData.status_code}
            onChange={handleInputChange}
            required
            disabled={loading.purchaseOrder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Status</option>
            {Array.isArray(purchaseOrderStatuses) && purchaseOrderStatuses.map((status) => (
              <option key={status.id} value={status.status_code}>
                {status.status_code} - {status.status_description || status.status_name}
              </option>
            ))}
          </select>
          {statusError && (
            <p className="mt-1 text-xs text-red-500">Failed to load statuses</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Termin Bayar
          </label>
          <input
            type="text"
            name="termin_bayar"
            value={formData.termin_bayar || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 30 days, COD, etc."
          />
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
