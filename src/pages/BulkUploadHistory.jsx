import React, { useEffect, useState } from 'react';
import bulkPurchaseOrderService from '../services/bulkPurchaseOrderService';
import { formatDateTime } from '../utils/formatUtils';
import { truncateText, getStatusVariant } from '../utils/modalUtils';

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
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Detail Upload Bulk</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-gray-500">ID</div>
            <div className="col-span-2 break-all">{item.id}</div>
            <div className="text-gray-500">Filename</div>
            <div className="col-span-2">{item.filename}</div>
            <div className="text-gray-500">Mimetype</div>
            <div className="col-span-2">{item.mimetype}</div>
            <div className="text-gray-500">Size</div>
            <div className="col-span-2">{item.size} bytes</div>
            <div className="text-gray-500">Status</div>
            <div className="col-span-2"><StatusBadgeInline status={item.status?.status_code} /></div>
            <div className="text-gray-500">Created</div>
            <div className="col-span-2">{formatDateTime(item.createdAt)}</div>
            <div className="text-gray-500">Updated</div>
            <div className="col-span-2">{formatDateTime(item.updatedAt)}</div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
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

  const openDetail = async (id) => {
    try {
      const res = await bulkPurchaseOrderService.getStatus(id);
      setSelected(res?.data || null);
      setIsModalOpen(true);
    } catch (e) {
      setSelected(null);
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
                <option value="PENDING BULK FILE">PENDING BULK FILE</option>
                <option value="PROCESSING BULK FILE">PROCESSING BULK FILE</option>
                <option value="PROCESSED BULK FILE">PROCESSED BULK FILE</option>
                <option value="FAILED BULK FILE">FAILED BULK FILE</option>
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
                  items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{truncateText(it.filename, 60)}</td>
                      <td className="px-6 py-4 text-sm"><StatusBadgeInline status={it.status?.status_code} /></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(it.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(it.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openDetail(it.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Detail</button>
                      </td>
                    </tr>
                  ))
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


