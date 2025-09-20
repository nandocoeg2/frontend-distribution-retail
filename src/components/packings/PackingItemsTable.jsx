import React, { useState } from 'react';
import { StatusBadge } from '../ui';

const PackingItemsTable = ({ packingItems, onItemClick }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

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

  if (!packingItems || packingItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📦</div>
        <p>Tidak ada packing items</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Nama Barang
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Total Qty
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Jumlah Carton
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Isi per Carton
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Status Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Updated At
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Created By
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {packingItems.map((item, index) => (
            <tr 
              key={item.id}
              className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                hoveredRow === index ? 'bg-blue-50' : ''
              }`}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {index + 1}
              </td>
              <td 
                className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 border-b"
                onClick={() => onItemClick(item)}
              >
                <div className="flex items-center space-x-2">
                  <span>📦</span>
                  <span className="hover:underline">{item.nama_barang}</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.total_qty}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {item.jumlah_carton}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                {item.isi_per_carton}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-b">
                <StatusBadge 
                  status={item.status?.status_code || 'N/A'} 
                  variant={getStatusVariant(item.status?.status_code)} 
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-b">
                {formatDate(item.updatedAt)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border-b">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {item.createdBy || 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackingItemsTable;
