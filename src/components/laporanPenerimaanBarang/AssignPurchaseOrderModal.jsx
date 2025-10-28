import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import purchaseOrderService from '../../services/purchaseOrderService';

const AssignPurchaseOrderModal = ({
  show,
  onClose,
  onAssign,
  isSubmitting = false,
  lpbData = null,
}) => {
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoadingPurchaseOrders, setIsLoadingPurchaseOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load purchase orders when modal opens or search query changes
  useEffect(() => {
    if (show) {
      loadPurchaseOrders();
    } else {
      // Reset state when modal closes
      setSelectedPurchaseOrderId('');
      setSearchQuery('');
    }
  }, [show]);

  const loadPurchaseOrders = useCallback(async (query = '') => {
    setIsLoadingPurchaseOrders(true);
    try {
      const params = {
        page: 1,
        limit: 50,
      };
      
      if (query) {
        params.po_number = query;
      }

      const response = await purchaseOrderService.getPurchaseOrders(params);
      // Handle nested response structure: response.data.data or response.data.purchaseOrders
      const orders = 
        response?.data?.data || 
        response?.data?.purchaseOrders || 
        response?.purchaseOrders || 
        [];
      setPurchaseOrders(orders);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      setPurchaseOrders([]);
    } finally {
      setIsLoadingPurchaseOrders(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (query) => {
      setSearchQuery(query);
      await loadPurchaseOrders(query);
    },
    [loadPurchaseOrders]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPurchaseOrderId) {
      onAssign(selectedPurchaseOrderId);
    }
  };

  const handleChange = (e) => {
    setSelectedPurchaseOrderId(e.target.value);
  };

  if (!show) {
    return null;
  }

  const autocompleteOptions = purchaseOrders.map((po) => ({
    id: po.id,
    name: po.po_number || 'N/A',
    po_date: po.po_date,
    customer: po.customer?.namaCustomer || 'N/A',
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Assign Purchase Order
              </h2>
              <p className="text-sm text-gray-600">
                Hubungkan LPB dengan Purchase Order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lpbData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Informasi LPB
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">No. LPB:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {lpbData.no_lpb || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {lpbData.tanggal_po
                      ? new Date(lpbData.tanggal_po).toLocaleDateString('id-ID')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Autocomplete
                label="Purchase Order"
                placeholder="Cari berdasarkan No. PO..."
                options={autocompleteOptions}
                value={selectedPurchaseOrderId}
                onChange={handleChange}
                displayKey="name"
                valueKey="id"
                required
                disabled={isSubmitting}
                onSearch={handleSearch}
                loading={isLoadingPurchaseOrders}
                showId={false}
                className="w-full"
              />

              {selectedPurchaseOrderId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    PO Terpilih
                  </h4>
                  {(() => {
                    const selectedPO = purchaseOrders.find(
                      (po) => po.id === selectedPurchaseOrderId
                    );
                    if (!selectedPO) return null;

                    return (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-blue-700">No. PO:</span>
                          <span className="ml-2 font-medium text-blue-900">
                            {selectedPO.po_number || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">Customer:</span>
                          <span className="ml-2 font-medium text-blue-900">
                            {selectedPO.customer?.namaCustomer || 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedPurchaseOrderId || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Menyimpan...
                  </div>
                ) : (
                  'Assign'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignPurchaseOrderModal;

