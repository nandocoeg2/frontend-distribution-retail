import React, { useState, useEffect, useRef } from 'react';
import useCustomersPage from '../../hooks/useCustomersPage';
import useStatuses from '../../hooks/useStatuses';
import useTermOfPayments from '../../hooks/useTermOfPayments';
import Autocomplete from '../common/Autocomplete';

const PurchaseOrderForm = ({ formData, handleInputChange, onGeneratePONumber, isEditMode = false, customerName = '', purchaseOrderDetails = [] }) => {
  // Use customers hook
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    searchCustomers,
    fetchCustomers
  } = useCustomersPage();

  
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const searchTimeoutRef = useRef(null);
  
  // Use purchase order statuses hook
  const { 
    purchaseOrderStatuses, 
    loading, 
    error: statusError,
    fetchPurchaseOrderStatuses 
  } = useStatuses();

  // Use term of payments hook
  const {
    termOfPayments,
    loading: termOfPaymentsLoading,
    error: termOfPaymentsError,
    fetchTermOfPayments
  } = useTermOfPayments();


  // Fetch purchase order statuses on component mount
  useEffect(() => {
    fetchPurchaseOrderStatuses();
  }, [fetchPurchaseOrderStatuses]);

  // Fetch term of payments on component mount
  useEffect(() => {
    fetchTermOfPayments(1, 100); // Fetch all term of payments
  }, [fetchTermOfPayments]);

  // Set initial filtered customers when customers are loaded
  useEffect(() => {
    if (customers && customers.length > 0) {
      setFilteredCustomers(customers);
    }
  }, [customers]);

  // Update total_items based on purchaseOrderDetails length
  useEffect(() => {
    if (purchaseOrderDetails && purchaseOrderDetails.length > 0) {
      const newTotalItems = purchaseOrderDetails.length;
      if (formData.total_items !== newTotalItems) {
        handleInputChange({
          target: {
            name: 'total_items',
            value: newTotalItems,
            type: 'number'
          }
        });
      }
    }
  }, [purchaseOrderDetails, formData.total_items, handleInputChange]);

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Informasi Dasar
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor PO *
            </label>
            <div className="flex">
              <input
                type="text"
                name="po_number"
                value={formData.po_number || ''}
                onChange={handleInputChange}
                required
                placeholder="PO-2024-01-001"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={onGeneratePONumber}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-r-md hover:bg-blue-200 text-sm font-medium transition-colors"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <Autocomplete
              label=""
              options={filteredCustomers}
              value={formData.customerId}
              onChange={handleInputChange}
              placeholder="Cari nama atau ID customer"
              displayKey="namaCustomer"
              valueKey="id"
              name="customerId"
              required
              disabled={customersLoading}
              loading={customersLoading}
              onSearch={async (query) => {
                try {
                  await searchCustomers(query, 1, 20);
                  // The hook will update the customers state, which will trigger the useEffect above
                } catch (error) {
                  console.error('Failed to search customers:', error);
                  setFilteredCustomers([]);
                }
              }}
              showId={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Item *
            </label>
            <input
              type="number"
              name="total_items"
              value={formData.total_items || 0}
              readOnly
              required
              min="1"
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Otomatis terisi sesuai jumlah Purchase Order Details</p>
          </div>
        </div>
      </div>

      {/* Date & Type Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Tanggal & Tipe
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Masuk *
            </label>
            <input
              type="date"
              name="tanggal_masuk_po"
              value={formData.tanggal_masuk_po || ''}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batas Kirim
            </label>
            <input
              type="date"
              name="tanggal_batas_kirim"
              value={formData.tanggal_batas_kirim || ''}
              onChange={handleInputChange}
              placeholder="dd/mm/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe PO *
            </label>
            <select
              name="po_type"
              value={formData.po_type || ''}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Pilih Tipe</option>
              <option value="SINGLE">Single Item</option>
              <option value="BULK">Bulk Items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status & Payment Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Status & Pembayaran
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status_code"
              value={formData.status_code}
              onChange={handleInputChange}
              required
              disabled={loading.purchaseOrder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">Pilih Status</option>
              {Array.isArray(purchaseOrderStatuses) && purchaseOrderStatuses.map((status) => (
                <option key={status.id} value={status.status_code}>
                  {status.status_code} - {status.status_description || status.status_name}
                </option>
              ))}
            </select>
            {statusError && (
              <p className="mt-1 text-xs text-red-500">Gagal memuat status</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termin Bayar
            </label>
            <select
              name="termin_bayar"
              value={formData.termin_bayar || ''}
              onChange={handleInputChange}
              disabled={termOfPaymentsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">Pilih Termin</option>
              {Array.isArray(termOfPayments) && termOfPayments.map((term) => (
                <option key={term.id} value={term.kode_top}>
                  {term.kode_top} - {term.batas_hari} hari
                </option>
              ))}
            </select>
            {termOfPaymentsError && (
              <p className="mt-1 text-xs text-red-500">Gagal memuat termin bayar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
