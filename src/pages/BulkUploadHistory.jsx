import React, { useEffect, useState } from 'react';
import bulkPurchaseOrderService from '../services/bulkPurchaseOrderService';
import toastService from '../services/toastService';
import { formatDateTime } from '../utils/formatUtils';
import { truncateText, getStatusVariant } from '../utils/modalUtils';
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const StatusBadgeInline = ({ status }) => {
  const variant = getStatusVariant(status);
  const colorMap = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800',
  };
  const dotColorMap = {
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    default: 'bg-gray-600',
  };
  return (
    <span className={`px-2 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${colorMap[variant] || colorMap.default}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[variant] || dotColorMap.default}`} />
      {status || 'N/A'}
    </span>
  );
};

const DetailModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-medium">Detail Upload Bulk</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          {/* File Information */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">File Information</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-gray-500">ID</div>
              <div className="col-span-2 break-all font-mono text-xs">{item.id}</div>
              <div className="text-gray-500">Filename</div>
              <div className="col-span-2">{item.filename}</div>
              <div className="text-gray-500">Path</div>
              <div className="col-span-2 text-xs text-gray-600">{item.path}</div>
              <div className="text-gray-500">Mimetype</div>
              <div className="col-span-2">{item.mimetype}</div>
              <div className="text-gray-500">Size</div>
              <div className="col-span-2">{item.size?.toLocaleString()} bytes</div>
              <div className="text-gray-500">Category</div>
              <div className="col-span-2">{item.category}</div>
              <div className="text-gray-500">Bulk ID</div>
              <div className="col-span-2 break-all font-mono text-xs">{item.bulkId}</div>
            </div>
          </div>

          {/* Status Information */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Status Information</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-gray-500">Status</div>
              <div className="col-span-2"><StatusBadgeInline status={item.status?.status_code} /></div>
              <div className="text-gray-500">Description</div>
              <div className="col-span-2">{item.status?.status_description || '-'}</div>
              {item.reason && (
                <>
                  <div className="text-gray-500">Reason</div>
                  <div className="col-span-2">
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                      {item.reason}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Purchase Order Information */}
          {item.purchaseOrder && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Purchase Order</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-500">PO Number</div>
                <div className="col-span-2 font-semibold">{item.purchaseOrder.po_number}</div>
                <div className="text-gray-500">PO Date</div>
                <div className="col-span-2">{formatDateTime(item.purchaseOrder.po_date)}</div>
                <div className="text-gray-500">Delivery Date</div>
                <div className="col-span-2">{formatDateTime(item.purchaseOrder.delivery_date)}</div>
                <div className="text-gray-500">Grand Total</div>
                <div className="col-span-2 font-semibold">Rp {item.purchaseOrder.grand_total?.toLocaleString()}</div>
                {item.purchaseOrder.company && (
                  <>
                    <div className="text-gray-500">Company</div>
                    <div className="col-span-2">{item.purchaseOrder.company.nama_perusahaan} ({item.purchaseOrder.company.kode_company})</div>
                  </>
                )}
                {item.purchaseOrder.customer && (
                  <>
                    <div className="text-gray-500">Customer</div>
                    <div className="col-span-2">{item.purchaseOrder.customer.namaCustomer} ({item.purchaseOrder.customer.kodeCustomer})</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* User Information */}
          {item.user && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Uploaded By</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-gray-500">Name</div>
                <div className="col-span-2">{item.user.firstName} {item.user.lastName}</div>
                <div className="text-gray-500">Username</div>
                <div className="col-span-2">{item.user.username}</div>
                <div className="text-gray-500">Email</div>
                <div className="col-span-2">{item.user.email}</div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Timestamps</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-gray-500">Created At</div>
              <div className="col-span-2">{formatDateTime(item.createdAt)}</div>
              <div className="text-gray-500">Updated At</div>
              <div className="col-span-2">{formatDateTime(item.updatedAt)}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tutup</button>
        </div>
      </div>
    </div>
  );
};

const BulkUploadHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retryingFiles, setRetryingFiles] = useState(new Set());
  const [showRetryMenu, setShowRetryMenu] = useState(null);

  const fetchData = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bulkPurchaseOrderService.getAll(status ? { status } : undefined);
      setItems(res?.data || []);
    } catch (e) {
      setError(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRetryMenu && !event.target.closest('.relative')) {
        setShowRetryMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showRetryMenu]);

  const openDetail = async (fileId) => {
    try {
      const res = await bulkPurchaseOrderService.getFileById(fileId);
      setSelected(res?.data || null);
      setIsModalOpen(true);
    } catch (e) {
      console.error('Failed to fetch file details:', e);
      setError(e?.response?.data?.message || 'Gagal memuat detail file');
      setSelected(null);
    }
  };

  const handleRetry = async (fileId, filename, method = 'ai') => {
    try {
      // Add to retrying set
      setRetryingFiles(prev => new Set(prev).add(fileId));
      setShowRetryMenu(null); // Close dropdown
      
      const methodLabel = method === 'ai' ? 'AI' : 'Text Extraction';
      toastService.info(`Memproses ulang file: ${filename} menggunakan ${methodLabel}`);

      const res = method === 'ai'
        ? await bulkPurchaseOrderService.retryFile(fileId)
        : await bulkPurchaseOrderService.retryFileTextExtraction(fileId);
      
      if (res?.data?.result === 'success') {
        toastService.success(`File ${filename} berhasil diproses menggunakan ${methodLabel}!`);
      } else if (res?.data?.result === 'failed') {
        toastService.warning(`File ${filename} gagal diproses menggunakan ${methodLabel}. Lihat detail untuk informasi lebih lanjut.`);
      }

      // Refresh data to show updated status
      await fetchData(filterStatus);
    } catch (e) {
      console.error('Failed to retry file:', e);
      const errorMsg = e?.response?.data?.message || 'Gagal memproses ulang file';
      
      // Handle specific error cases
      if (e?.response?.status === 400) {
        if (errorMsg.includes('Only failed files')) {
          toastService.error('Hanya file yang gagal yang bisa di-retry');
        } else if (errorMsg.includes('already has an associated purchase order')) {
          toastService.error('File sudah memiliki purchase order');
        } else {
          toastService.error(errorMsg);
        }
      } else if (e?.response?.status === 404) {
        toastService.error('File tidak ditemukan');
      } else {
        toastService.error(errorMsg);
      }
    } finally {
      // Remove from retrying set
      setRetryingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">History Upload Bulk</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="PENDING BULK PURCHASE ORDER">PENDING BULK PURCHASE ORDER</option>
                <option value="PROCESSING BULK PURCHASE ORDER">PROCESSING BULK PURCHASE ORDER</option>
                <option value="COMPLETED BULK PURCHASE ORDER">COMPLETED BULK PURCHASE ORDER</option>
                <option value="FAILED BULK PURCHASE ORDER">FAILED BULK PURCHASE ORDER</option>
              </select>
              <button onClick={() => fetchData(filterStatus)} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-800 border border-red-200 rounded">{error}</div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Memuat...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada data</td>
                  </tr>
                ) : (
                  items.map((it) => {
                    const isFailed = it.status?.status_code === 'FAILED BULK PURCHASE ORDER';
                    const isRetrying = retryingFiles.has(it.id);
                    
                    return (
                      <tr key={it.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{truncateText(it.filename, 60)}</td>
                        <td className="px-6 py-4 text-sm"><StatusBadgeInline status={it.status?.status_code} /></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(it.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(it.updatedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isFailed && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowRetryMenu(showRetryMenu === it.id ? null : it.id)}
                                  disabled={isRetrying}
                                  className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                                  title="Retry processing this file"
                                >
                                  <ArrowPathIcon className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                  {isRetrying ? 'Retrying...' : 'Retry'}
                                  {!isRetrying && <ChevronDownIcon className="w-3 h-3" />}
                                </button>
                                {showRetryMenu === it.id && !isRetrying && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                    <button
                                      onClick={() => handleRetry(it.id, it.filename, 'ai')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-start gap-2"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">Retry with AI</div>
                                        <div className="text-xs text-gray-500">Best for complex documents</div>
                                      </div>
                                    </button>
                                    <button
                                      onClick={() => handleRetry(it.id, it.filename, 'text-extraction')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-start gap-2 border-t"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">Retry with Text Extraction</div>
                                        <div className="text-xs text-gray-500">Faster, for standard formats</div>
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            <button onClick={() => openDetail(it.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Detail</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} item={selected} />
    </div>
  );
};

export default BulkUploadHistory;


