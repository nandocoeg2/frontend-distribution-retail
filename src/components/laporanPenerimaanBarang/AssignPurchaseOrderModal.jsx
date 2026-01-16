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
        hasNoLpb: true, // Only show POs that haven't been assigned to any LPB
      };

      // Filter by company if lpbData has companyId
      if (lpbData?.companyId) {
        params.companyId = lpbData.companyId;
      }

      // Filter by customer if lpbData has customerId
      if (lpbData?.customerId) {
        params.customerId = lpbData.customerId;
      }

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
  }, [lpbData?.companyId, lpbData?.customerId]);

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
    name: `${po.po_number || 'N/A'} - ${po.customer?.namaCustomer || '-'}`,
    po_number: po.po_number,
    po_date: po.po_date,
    customer: po.customer?.namaCustomer || 'N/A',
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col">
        {/* Header - Compact */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded">
              <LinkIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Assign Purchase Order</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content - Compact */}
        <div className="flex-1 overflow-visible p-3">
          <div className="flex gap-3">
            {/* Left: LPB Info */}
            {lpbData && (
              <div className="w-1/3 p-2 bg-gray-50 rounded border border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-1.5">Info LPB</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">No. LPB:</span>
                    <span className="font-medium text-gray-900 truncate ml-1">{lpbData.no_lpb || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="font-medium text-gray-900">
                      {lpbData.tanggal_po ? new Date(lpbData.tanggal_po).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-medium text-gray-900 truncate ml-1">{lpbData.customer?.namaCustomer || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right: PO Selection */}
            <div className={lpbData ? 'w-2/3' : 'w-full'}>
              <form onSubmit={handleSubmit} className="space-y-2">
                <Autocomplete
                  label="Pilih Purchase Order"
                  placeholder="Cari No. PO..."
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
                  optionsClassName="bg-white border-gray-300 z-[60]"
                />

                {selectedPurchaseOrderId && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <h4 className="text-xs font-semibold text-blue-800 mb-1">PO Terpilih</h4>
                    {(() => {
                      const selectedPO = purchaseOrders.find((po) => po.id === selectedPurchaseOrderId);
                      if (!selectedPO) return null;
                      return (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-blue-600">No. PO:</span>
                            <span className="font-medium text-blue-900">{selectedPO.po_number || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Customer:</span>
                            <span className="font-medium text-blue-900 truncate">{selectedPO.customer?.namaCustomer || '-'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Footer - Inline */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedPurchaseOrderId || isSubmitting}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Assign'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPurchaseOrderModal;

