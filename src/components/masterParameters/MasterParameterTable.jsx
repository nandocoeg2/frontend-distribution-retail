import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useConfirmationDialog } from '../ui';

const MasterParameterTable = ({ 
  masterParameters, 
  pagination = {}, 
  onPageChange, 
  onLimitChange, 
  onDelete, 
  onViewDetail, 
  selectedParameterId, 
  searchQuery = '', 
  loading = false 
}) => {
  const [deleteId, setDeleteId] = React.useState(null);
  const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

  const parametersArray = Array.isArray(masterParameters) ? masterParameters : [];

  const handleDelete = (parameterId) => {
    setDeleteId(parameterId);
    showDialog({
      title: "Delete Master Parameter",
      message: "Are you sure you want to delete this parameter? This action cannot be undone.",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
    hideDialog();
  };

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : parametersArray.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  {searchQuery ? 'No parameters found matching your search.' : 'No parameters available.'}
                </td>
              </tr>
            ) : (
              parametersArray.map((parameter) => (
                <tr 
                  key={parameter.id} 
                  onClick={() => onViewDetail(parameter)}
                  className={`cursor-pointer transition-colors ${
                    selectedParameterId === parameter.id 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 bg-gray-100 rounded">
                    {parameter.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={parameter.value}>
                      {parameter.value}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-md truncate" title={parameter.description}>
                      {parameter.description || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(parameter.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{((pagination.currentPage || 1) - 1) * (pagination.itemsPerPage || 10) + 1}</span> to <span className="font-medium">{Math.min((pagination.currentPage || 1) * (pagination.itemsPerPage || 10), pagination.totalItems || 0)}</span> of <span className="font-medium">{pagination.totalItems || 0}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            value={pagination.itemsPerPage || 10}
            onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <nav className="flex space-x-1">
            <button
              onClick={() => onPageChange && onPageChange((pagination.currentPage || 1) - 1)}
              disabled={(pagination.currentPage || 1) === 1}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange((pagination.currentPage || 1) + 1)}
              disabled={(pagination.currentPage || 1) === (pagination.totalPages || 1)}
              className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
      
      <ConfirmationDialog 
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default MasterParameterTable;
