import React from 'react';
import { EyeIcon } from '@heroicons/react/24/solid';

const PackingTable = ({ packings, onViewById }) => {
  const getStatusBadge = (statusName) => {
    const statusMap = {
      'Pending Packing': 'bg-yellow-100 text-yellow-800',
      'Packed': 'bg-green-100 text-green-800',
      'Shipped': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-purple-100 text-purple-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return statusMap[statusName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Packing</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {packings.map((packing) => (
            <tr key={packing.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {packing.packing_number || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {packing.purchaseOrder?.po_number || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(packing.tanggal_packing).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getStatusBadge(packing.status?.status_name)
                  }`}
                >
                  {packing.status?.status_name || 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {packing.packingItems?.length || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onViewById(packing.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackingTable;

