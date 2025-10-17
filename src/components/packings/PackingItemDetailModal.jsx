import React, { useState, useEffect } from 'react';
import { InfoCard, StatusBadge, InfoTable } from '../ui';
import { formatDateTime } from '../../utils/formatUtils';
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
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <span className='text-2xl'>📦</span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Detail Barang
              </h2>
              <p className='text-sm text-gray-600'>{item.nama_barang}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 transition-colors rounded-lg hover:bg-gray-100'
          >
            <svg
              className='w-6 h-6 text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          {loading && (
            <div className='flex items-center justify-center py-8'>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin'></div>
                <span className='text-gray-600'>Memuat data inventory...</span>
              </div>
            </div>
          )}

          {error && (
            <div className='p-4 mb-6 border border-red-200 rounded-lg bg-red-50'>
              <div className='flex items-center'>
                <div className='mr-2 text-xl text-red-500'>âš ï¸</div>
                <div>
                  <h3 className='text-sm font-medium text-red-800'>Error</h3>
                  <p className='mt-1 text-sm text-red-700'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className='space-y-6'>
              {/* Inventory Information */}
              {inventory && (
                <div className='p-6 rounded-lg bg-blue-50'>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                    Informasi Inventory
                  </h3>
                  <InfoTable
                    data={[
                      {
                        label: 'Nama Barang',
                        value: inventory.nama_barang || 'N/A',
                      },
                      { label: 'PLU', value: inventory.plu || 'N/A' },
                      {
                        label: 'Harga Barang',
                        value: inventory.harga_barang
                          ? `Rp ${inventory.harga_barang.toLocaleString('id-ID')}`
                          : 'N/A',
                      },
                      { label: 'Stok C', value: inventory.stok_c || 0 },
                      { label: 'Stok Q', value: inventory.stok_q || 0 },
                      { label: 'Min Stok', value: inventory.min_stok || 0 },
                      {
                        label: 'Created At',
                        value: formatDateTime(inventory.createdAt),
                      },
                      {
                        label: 'Updated At',
                        value: formatDateTime(inventory.updatedAt),
                      },
                      {
                        label: 'Inventory ID',
                        value: inventory.id,
                        copyable: true,
                      },
                      {
                        label: 'Created By',
                        value: inventory.createdBy || 'N/A',
                        copyable: true,
                      },
                      {
                        label: 'Updated By',
                        value: inventory.updatedBy || 'N/A',
                        copyable: true,
                      },
                    ]}
                  />
                </div>
              )}

              {/* Packing Item Information */}
              <div className='p-6 rounded-lg bg-gray-50'>
                <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                  Informasi Packing Item
                </h3>
                <InfoTable
                  data={[
                    { label: 'Nama Barang (Packing)', value: item.nama_barang },
                    { label: 'Total Qty', value: item.total_qty },
                    { label: 'Jumlah Carton', value: item.jumlah_carton },
                    { label: 'Isi per Carton', value: item.isi_per_carton },
                    { label: 'No Box', value: item.no_box || 'Not assigned' },
                    {
                      label: 'Inventory ID',
                      value: item.inventoryId,
                      copyable: true,
                    },
                  ]}
                />
              </div>

              {/* Status Information */}
              {item.status && (
                <div className='p-6 rounded-lg bg-yellow-50'>
                  <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                    Status Information
                  </h3>
                  <InfoTable
                    data={[
                      { label: 'Status Code', value: item.status.status_code },
                      { label: 'Status Name', value: item.status.status_name },
                      {
                        label: 'Description',
                        value: item.status.status_description,
                      },
                    ]}
                  />
                </div>
              )}

              {/* System Information */}
              <div className='p-6 rounded-lg bg-purple-50'>
                <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                  System Information
                </h3>
                <InfoTable
                  data={[
                    { label: 'Item ID', value: item.id, copyable: true },
                    {
                      label: 'Packing ID',
                      value: item.packingId,
                      copyable: true,
                    },
                    {
                      label: 'Status ID',
                      value: item.statusId,
                      copyable: true,
                    },
                    {
                      label: 'Created At',
                      value: formatDateTime(item.createdAt),
                    },
                    {
                      label: 'Updated At',
                      value: formatDateTime(item.updatedAt),
                    },
                    {
                      label: 'Created By',
                      value: item.createdBy,
                      copyable: true,
                    },
                    {
                      label: 'Updated By',
                      value: item.updatedBy,
                      copyable: true,
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
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
