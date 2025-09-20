import React, { useState, useEffect } from 'react';
import { InfoCard, StatusBadge } from '../ui';
import { getInventoryById } from '../../services/inventoryService';
import toastService from '../../services/toastService';

const PackingItemDetailModal = ({ item, onClose }) => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item?.inventoryId) {
      fetchInventoryData();
    }
  }, [item?.inventoryId]);

  const fetchInventoryData = async () => {
    if (!item?.inventoryId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getInventoryById(item.inventoryId);
      console.log('Inventory response:', response); // Debug log
      
      // Handle API response structure: { success: true, data: {...} }
      const inventoryData = response?.success ? response.data : response;
      setInventory(inventoryData);
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengambil data inventory';
      setError(errorMessage);
      toastService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',  
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusVariant = (statusCode) => {
    if (!statusCode) return 'default';
    const status = statusCode.toUpperCase();
    if (status.includes('PENDING')) return 'warning';
    if (status.includes('COMPLETED')) return 'success';
    if (status.includes('IN_PROGRESS')) return 'primary';
    if (status.includes('CANCELLED')) return 'danger';
    return 'default';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Detail Barang</h2>
              <p className="text-sm text-gray-600">{item.nama_barang}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Memuat data inventory...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-500 text-xl mr-2">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
            {/* Inventory Information */}
            {inventory && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard 
                    label="Nama Barang" 
                    value={inventory.nama_barang || 'N/A'} 
                    variant="primary" 
                  />
                  <InfoCard 
                    label="PLU" 
                    value={inventory.plu || 'N/A'} 
                    variant="info" 
                  />
                  <InfoCard 
                    label="Harga Barang" 
                    value={inventory.harga_barang ? `Rp ${inventory.harga_barang.toLocaleString('id-ID')}` : 'N/A'} 
                    variant="success" 
                  />
                  <InfoCard 
                    label="Stok C" 
                    value={inventory.stok_c || 0} 
                    variant="warning" 
                  />
                  <InfoCard 
                    label="Stok Q" 
                    value={inventory.stok_q || 0} 
                    variant="warning" 
                  />
                  <InfoCard 
                    label="Min Stok" 
                    value={inventory.min_stok || 0} 
                    variant="danger" 
                  />
                  <InfoCard 
                    label="Created At" 
                    value={formatDate(inventory.createdAt)} 
                  />
                  <InfoCard 
                    label="Updated At" 
                    value={formatDate(inventory.updatedAt)} 
                  />
                  <InfoCard 
                    label="Inventory ID" 
                    value={inventory.id} 
                    copyable 
                  />
                  <InfoCard 
                    label="Created By" 
                    value={inventory.createdBy || 'N/A'} 
                    copyable 
                  />
                  <InfoCard 
                    label="Updated By" 
                    value={inventory.updatedBy || 'N/A'} 
                    copyable 
                  />
                </div>
              </div>
            )}

            {/* Packing Item Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Packing Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard 
                  label="Nama Barang (Packing)" 
                  value={item.nama_barang} 
                  variant="primary" 
                />
                <InfoCard 
                  label="Total Qty" 
                  value={item.total_qty} 
                  variant="success" 
                />
                <InfoCard 
                  label="Jumlah Carton" 
                  value={item.jumlah_carton} 
                  variant="info" 
                />
                <InfoCard 
                  label="Isi per Carton" 
                  value={item.isi_per_carton} 
                />
                <InfoCard 
                  label="No Box" 
                  value={item.no_box || 'Not assigned'} 
                />
                <InfoCard 
                  label="Inventory ID" 
                  value={item.inventoryId} 
                  copyable 
                />
              </div>
            </div>

            {/* Status Information */}
            {item.status && (
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoCard 
                    label="Status Code" 
                    value={item.status.status_code} 
                    variant="warning" 
                  />
                  <InfoCard 
                    label="Status Name" 
                    value={item.status.status_name} 
                    variant="warning" 
                  />
                  <InfoCard 
                    label="Description" 
                    value={item.status.status_description} 
                    variant="warning" 
                  />
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard 
                  label="Item ID" 
                  value={item.id} 
                  copyable 
                />
                <InfoCard 
                  label="Packing ID" 
                  value={item.packingId} 
                  copyable 
                />
                <InfoCard 
                  label="Status ID" 
                  value={item.statusId} 
                  copyable 
                />
                <InfoCard 
                  label="Created At" 
                  value={formatDate(item.createdAt)} 
                />
                <InfoCard 
                  label="Updated At" 
                  value={formatDate(item.updatedAt)} 
                />
                <InfoCard 
                  label="Created By" 
                  value={item.createdBy} 
                  copyable 
                />
                <InfoCard 
                  label="Updated By" 
                  value={item.updatedBy} 
                  copyable 
                />
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingItemDetailModal;
