import React from 'react';
import { EyeIcon, PencilIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/solid';
import { StatusBadge } from '../ui/Badge';
import { resolveStatusVariant } from '../../utils/modalUtils';

const PackingTable = ({ 
  packings, 
  onViewById, 
  onEdit, 
  onDelete, 
  deleteLoading = false,
  selectedPackings = [],
  onSelectPacking,
  onSelectAllPackings,
  onProcessSelected,
  isProcessing = false,
  hasSelectedPackings = false
}) => {
  const resolveStatusVariant = (status) => {
    const value = typeof status === 'string' ? status.toLowerCase() : '';

    if (!value) {
      return 'secondary';
    }

    // Complete = Hijau
    if (value.includes('delivered') || value.includes('complete')) {
      return 'success';
    }

    // Failed = Merah
    if (value.includes('cancelled') || value.includes('failed') || value.includes('error')) {
      return 'danger';
    }

    // Processed = Biru (Shipped/Packed considered as processed)
    if (value.includes('shipped') || value.includes('packed')) {
      return 'primary';
    }

    // Processing/In Progress = Kuning
    if (value.includes('processing') || value.includes('in progress')) {
      return 'warning';
    }

    // Pending/Draft = Netral/Abu-abu
    if (value.includes('pending') || value.includes('draft')) {
      return 'secondary';
    }

    return 'default';
  };

  const processingStatusVariants = ['processing packing', 'processing packing order'];

  const normalizeStatusValue = (value) => {
    if (!value) {
      return '';
    }

    return value.toString().trim().toLowerCase().replace(/_/g, ' ');
  };

  const isProcessingStatus = (packing) => {
    if (!packing?.status) {
      return false;
    }

    const normalizedName = normalizeStatusValue(packing.status.status_name);
    const normalizedCode = normalizeStatusValue(packing.status.status_code);

    return processingStatusVariants.includes(normalizedName) || processingStatusVariants.includes(normalizedCode);
  };

  const isAllSelected = packings.length > 0 && selectedPackings.length === packings.length;
  const isIndeterminate = selectedPackings.length > 0 && selectedPackings.length < packings.length;

  return (
    <div className="space-y-4">
      {/* Process Button */}
      {hasSelectedPackings && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedPackings.length} packing dipilih
            </span>
          </div>
          <button
            onClick={onProcessSelected}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlayIcon className="h-4 w-4" />
            <span>{isProcessing ? 'Memproses...' : 'Proses Packing'}</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={onSelectAllPackings}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Packing</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.isArray(packings) && packings.length > 0 ? packings.map((packing) => {
            const isProcessing = isProcessingStatus(packing);

            return (
              <tr
                key={packing.id}
                className={selectedPackings.includes(packing.id) ? 'bg-blue-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedPackings.includes(packing.id)}
                    onChange={() => onSelectPacking(packing.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
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
                  <StatusBadge
                    status={packing.status?.status_name || 'Unknown'}
                    variant={resolveStatusVariant(packing.status?.status_name)}
                    size='sm'
                    dot
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {packing.packingItems?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onViewById(packing.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => !isProcessing && onEdit(packing)}
                      className={`p-1 ${isProcessing ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`}
                      title={isProcessing ? 'Packing sedang diproses dan tidak dapat diedit.' : 'Edit'}
                      disabled={isProcessing}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(packing.id)}
                      disabled={deleteLoading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                {Array.isArray(packings) ? 'Tidak ada data packing' : 'Loading...'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default PackingTable;


