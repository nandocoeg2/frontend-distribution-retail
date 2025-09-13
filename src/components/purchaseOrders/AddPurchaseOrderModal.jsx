import React, { useState, useEffect } from 'react';
import fileService from '../../services/fileService.js';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';
import { toast } from 'react-toastify';
import { usePurchaseOrderStatuses } from '../../hooks/useStatusTypes';

const AddPurchaseOrderModal = ({ isOpen, onClose, onFinished, createPurchaseOrder }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 1,
    tanggal_order: new Date().toISOString().split('T')[0],
    po_type: 'SINGLE',
    statusId: '',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('manual');
  
  // Get purchase order statuses using hook
  const { statuses } = usePurchaseOrderStatuses();

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setUploadMode('manual');
    }
  }, [isOpen, statuses]);



  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleFileChange = (e) => {
    setError(null);
    if (uploadMode === 'bulk') {
      setSelectedFile(e.target.files.length > 0 ? e.target.files : null);
    } else {
      setSelectedFile(e.target.files.length > 0 ? e.target.files[0] : null);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || selectedFile.length === 0) {
      setError('Please select files to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fileService.uploadBulkPurchaseOrders(selectedFile);
      if (result.success) {
        toast.success(result.data.message || 'Files uploaded successfully!');
        if (onFinished) onFinished();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to upload bulk files';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.po_number || !formData.statusId) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError(null);
    const newOrder = await createPurchaseOrder(formData, selectedFile);
    setLoading(false);
    if (newOrder) {
      if (onFinished) onFinished();
    } else {
      setError('Failed to create purchase order. Please check the form and try again.');
    }
  };

  const resetForm = () => {
    const pendingStatus = statuses.find(s => s.status_code === 'PENDING');
    setFormData({
      customerId: '', 
      po_number: '', 
      total_items: 1,
      tanggal_order: new Date().toISOString().split('T')[0],
      po_type: 'SINGLE', 
      statusId: pendingStatus?.id || '',
      suratJalan: '', 
      invoicePengiriman: '', 
      suratPO: '', 
      suratPenagihan: ''
    });
    setError(null);
    setSelectedFile(null);
  };

  const generatePONumber = () => {
    const today = new Date();
    const poNumber = `PO-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setFormData(prev => ({ ...prev, po_number: poNumber }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Purchase Order</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>}

        <div className="mb-4 flex justify-center space-x-4">
          <button onClick={() => { setUploadMode('manual'); resetForm(); }} className={`px-4 py-2 text-sm font-medium rounded-md ${uploadMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Manual Input</button>
          <button onClick={() => { setUploadMode('bulk'); resetForm(); }} className={`px-4 py-2 text-sm font-medium rounded-md ${uploadMode === 'bulk' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Bulk Upload</button>
        </div>

        {uploadMode === 'manual' ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order Document (Optional)</label>
              <div className="flex items-center space-x-2">
                <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
            <hr className="my-4" />
            <PurchaseOrderForm 
              formData={formData} 
              handleInputChange={handleInputChange} 
              onGeneratePONumber={generatePONumber} 
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300" disabled={loading}>Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={loading || !formData.customerId || !formData.po_number}>{loading ? 'Creating...' : 'Add Purchase Order'}</button>
            </div>
          </form>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bulk Purchase Orders</label>
            <div className="flex items-center space-x-2">
              <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300" disabled={loading}>Cancel</button>
              <button type="button" onClick={handleBulkUpload} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={!selectedFile || loading}>{loading ? 'Uploading...' : 'Upload Files'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPurchaseOrderModal;

