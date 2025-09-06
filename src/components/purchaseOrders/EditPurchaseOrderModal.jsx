import React, { useEffect, useState } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm.jsx';
import EditablePurchaseOrderDetailsTable from './EditablePurchaseOrderDetailsTable.jsx';
import HeroIcon from '../atoms/HeroIcon.jsx';
import fileService from '../../services/fileService.js';
import authService from '../../services/authService.js';
import axios from 'axios';

const EditPurchaseOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 0,
    tanggal_order: '',
    po_type: 'Regular',
    statusId: '',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: ''
  });
  const [purchaseOrderDetails, setPurchaseOrderDetails] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        customerId: order.customerId || '',
        po_number: order.po_number || '',
        total_items: order.total_items || 0,
        tanggal_order: order.tanggal_order ? new Date(order.tanggal_order).toISOString().split('T')[0] : '',
        po_type: order.po_type || 'Regular',
        statusId: order.statusId || '',
        suratJalan: order.suratJalan || '',
        invoicePengiriman: order.invoicePengiriman || '',
        suratPO: order.suratPO || '',
        suratPenagihan: order.suratPenagihan || ''
      });
      setPurchaseOrderDetails(order.purchaseOrderDetails || []);
      
      if (order.customerId) {
        fetchCustomerName(order.customerId);
      }
    }
  }, [order]);

  const fetchStatuses = async () => {
    try {
      const token = authService.getToken();
      const response = await axios.get('http://localhost:5050/api/v1/statuses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setStatuses(response.data);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  const fetchCustomerName = async (customerId) => {
    try {
      const token = authService.getToken();
      const response = await axios.get(`http://localhost:5050/api/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.data) {
        setCustomerName(response.data.name || '');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  const handleDetailsChange = (newDetails) => {
    setPurchaseOrderDetails(newDetails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      purchaseOrderDetails: purchaseOrderDetails,
    };
    await onSubmit(order.id, dataToSubmit);
  };

  const handleDownload = async (fileId, fileName) => {
    await fileService.downloadFile(fileId, fileName);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Edit Purchase Order
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PurchaseOrderForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            statuses={statuses}
            isEditMode={true}
            customerName={customerName}
          />

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Purchase Order Details</h4>
            <EditablePurchaseOrderDetailsTable 
              details={purchaseOrderDetails} 
              onDetailsChange={handleDetailsChange} 
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Attached Files</h4>
            {order?.files && order.files.length > 0 ? (
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {order.files.map((file) => (
                  <li key={file.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <HeroIcon icon="PaperClipIcon" className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      <span className="ml-2 flex-1 w-0 truncate">{file.filename}</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(file.id, file.filename)}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-gray-900">No files attached.</p>
            )}
          </div>

          {order?.createdAt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Updated At</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Update Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPurchaseOrderModal;

