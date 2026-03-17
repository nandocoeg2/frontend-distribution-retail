import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';

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
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200 text-xs table-fixed">
            <colgroup>
              <col style={{ width: '150px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '250px' }} />
              <col style={{ width: '60px' }} />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Key</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Value</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : parametersArray.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-xs text-gray-500">
                    {searchQuery ? 'No parameters found matching your search.' : 'No parameters available.'}
                  </td>
                </tr>
              ) : (
                parametersArray.map((parameter) => (
                  <tr
                    key={parameter.id}
                    onClick={() => onViewDetail(parameter)}
                    className={`cursor-pointer transition-colors ${selectedParameterId === parameter.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                      {parameter.key}
                    </td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate" title={parameter.value}>
                      {parameter.value}
                    </td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-600 truncate" title={parameter.description}>
                      {parameter.description || '—'}
                    </td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(parameter.id);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          compact
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>

      <ConfirmationDialog
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MasterParameterTable;
