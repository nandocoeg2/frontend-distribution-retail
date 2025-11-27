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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-xs table-fixed">
          <colgroup>
            <col style={{ width: '150px' }} />
            <col style={{ width: '200px' }} />
            <col style={{ width: '250px' }} />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-2 py-1 text-center">
                  <div className="w-6 h-6 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : parametersArray.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-2 py-1 text-center text-gray-500 text-xs">
                  {searchQuery ? 'No parameters found matching your search.' : 'No parameters available.'}
                </td>
              </tr>
            ) : (
              parametersArray.map((parameter) => (
                <tr 
                  key={parameter.id} 
                  onClick={() => onViewDetail(parameter)}
                  className={`cursor-pointer transition-colors h-8 ${
                    selectedParameterId === parameter.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900">
                    {parameter.key}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate" title={parameter.value}>
                    {parameter.value}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-600 truncate" title={parameter.description}>
                    {parameter.description || '—'}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(parameter.id);
                        }}
                        className="p-0.5 text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-700">
          Showing <span className="font-medium">{((pagination.currentPage || 1) - 1) * (pagination.itemsPerPage || 10) + 1}</span> to <span className="font-medium">{Math.min((pagination.currentPage || 1) * (pagination.itemsPerPage || 10), pagination.totalItems || 0)}</span> of <span className="font-medium">{pagination.totalItems || 0}</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pagination.itemsPerPage || 10}
            onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <nav className="flex space-x-1">
            <button
              onClick={() => onPageChange && onPageChange((pagination.currentPage || 1) - 1)}
              disabled={(pagination.currentPage || 1) === 1}
              className="px-2 py-0.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange && onPageChange((pagination.currentPage || 1) + 1)}
              disabled={(pagination.currentPage || 1) === (pagination.totalPages || 1)}
              className="px-2 py-0.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
      
      <ConfirmationDialog 
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MasterParameterTable;
