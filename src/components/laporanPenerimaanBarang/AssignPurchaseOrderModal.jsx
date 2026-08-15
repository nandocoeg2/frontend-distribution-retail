import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import purchaseOrderService from '../../services/purchaseOrderService';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

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

  // Load purchase orders when modal opens
  useEffect(() => {
    if (show) {
      setSearchQuery('');
      loadPurchaseOrders('');
    } else {
      setSelectedPurchaseOrderId('');
      setPurchaseOrders([]);
    }
  }, [show]);

  const loadPurchaseOrders = useCallback(async (query = '') => {
    setIsLoadingPurchaseOrders(true);
    try {
      const params = {
        page: 1,
        limit: 50,
        hasNoLpb: true,
      };

      if (lpbData?.companyId) {
        params.companyId = lpbData.companyId;
      }

      if (lpbData?.customerId) {
        params.customerId = lpbData.customerId;
      }

      if (query) {
        params.po_number = query;
      }

      const response = await purchaseOrderService.getPurchaseOrders(params);
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPurchaseOrders(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, loadPurchaseOrders]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPurchaseOrderId) {
      onAssign(selectedPurchaseOrderId);
    }
  };

  if (!show) return null;

  const selectedPO = purchaseOrders.find((po) => po.id === selectedPurchaseOrderId);

  // LPB grand total from detailInvoice or fallback properties
  const lpbGrandTotal =
    lpbData?.detailInvoice?.grand_total ??
    lpbData?.grand_total ??
    lpbData?.total_amount ??
    (lpbData?.detailItems && Array.isArray(lpbData.detailItems) && lpbData.detailItems.length > 0
      ? lpbData.detailItems.reduce((acc, item) => acc + (Number(item.total_pembelian) || Number(item.total_harga) || (Number(item.harga) || 0) * (Number(item.total_qty) || Number(item.qty_pcs) || 0)), 0)
      : null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <LinkIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Assign Purchase Order</h2>
              <p className="text-xs text-gray-500">Pilih PO untuk di-assign ke LPB ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">

          {/* LPB Info */}
          {lpbData && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Info LPB</h3>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-gray-500 block">No. LPB</span>
                  <span className="font-semibold text-gray-900">{lpbData.no_lpb || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Tanggal</span>
                  <span className="font-medium text-gray-900">
                    {lpbData.tanggal_po ? formatDate(lpbData.tanggal_po) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Customer</span>
                  <span className="font-medium text-gray-900 truncate block">{lpbData.customer?.namaCustomer || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Grand Total LPB</span>
                  <span className="font-bold text-blue-700">
                    {lpbGrandTotal != null ? formatCurrency(lpbGrandTotal) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PO Table */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. PO..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="w-8 px-3 py-2 text-center"></th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Nomor PO</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Nama DC</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Tanggal Expired</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Grand Total PO</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoadingPurchaseOrders ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Memuat data PO...
                        </div>
                      </td>
                    </tr>
                  ) : purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        {searchQuery ? 'Tidak ada PO yang cocok dengan pencarian.' : 'Tidak ada Purchase Order tersedia.'}
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const isSelected = selectedPurchaseOrderId === po.id;
                      const grandTotal =
                        po.grand_total ??
                        po.grandTotal ??
                        po.total_amount ??
                        po.invoice?.grand_total ??
                        (po.purchaseOrderDetails && Array.isArray(po.purchaseOrderDetails) && po.purchaseOrderDetails.length > 0
                          ? po.purchaseOrderDetails.reduce((acc, item) => acc + (Number(item.total_harga) || (Number(item.harga) || 0) * (Number(item.qty) || 0)), 0)
                          : null);
                      const expiredDate = po.tanggal_batas_kirim || po.delivery_date || po.tanggal_expired || po.expired_date || null;
                      return (
                        <tr
                          key={po.id}
                          onClick={() => setSelectedPurchaseOrderId(po.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-l-2 border-l-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => setSelectedPurchaseOrderId(po.id)}
                              className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                            {po.po_number || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {po.customer?.namaCustomer || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {expiredDate ? formatDate(expiredDate) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                            {grandTotal != null ? formatCurrency(grandTotal) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected PO summary */}
            {selectedPO && (() => {
              const selectedGrandTotal =
                selectedPO.grand_total ??
                selectedPO.grandTotal ??
                selectedPO.total_amount ??
                selectedPO.invoice?.grand_total ??
                (selectedPO.purchaseOrderDetails && Array.isArray(selectedPO.purchaseOrderDetails) && selectedPO.purchaseOrderDetails.length > 0
                  ? selectedPO.purchaseOrderDetails.reduce((acc, item) => acc + (Number(item.total_harga) || (Number(item.harga) || 0) * (Number(item.qty) || 0)), 0)
                  : null);
              const selectedExpiredDate = selectedPO.tanggal_batas_kirim || selectedPO.delivery_date || selectedPO.tanggal_expired || selectedPO.expired_date || null;
              return (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-semibold">PO Terpilih:</span>
                    <span className="text-blue-900 font-bold">{selectedPO.po_number}</span>
                    <span className="text-blue-600">—</span>
                    <span className="text-blue-800">{selectedPO.customer?.namaCustomer || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600">—</span>
                    <span className="text-blue-600 font-semibold">Exp:</span>
                    <span className="text-blue-900 font-semibold">{selectedExpiredDate ? formatDate(selectedExpiredDate) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600">—</span>
                    <span className="text-blue-600 font-semibold">Grand Total PO:</span>
                    <span className="text-blue-900 font-bold">{selectedGrandTotal != null ? formatCurrency(selectedGrandTotal) : '-'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedPurchaseOrderId || isSubmitting}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3 h-3" />
                    Assign
                  </>
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
