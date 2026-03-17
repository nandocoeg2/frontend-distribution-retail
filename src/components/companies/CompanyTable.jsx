import React from 'react';
import {
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';

const CompanyTable = ({ companies, pagination = {}, onPageChange, onLimitChange, onDelete, onViewDetail, selectedCompanyId, searchQuery = '', loading = false }) => {
  const [deleteId, setDeleteId] = React.useState(null);
  const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

  // Ensure companies is always an array
  const companiesArray = Array.isArray(companies) ? companies : [];
  

  const handleDelete = (companyId) => {
    setDeleteId(companyId);
    showDialog({
      title: "Hapus Perusahaan",
      message: "Apakah Anda yakin ingin menghapus perusahaan ini?",
      type: "danger",
      confirmText: "Hapus",
      cancelText: "Batal"
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
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 text-xs table-fixed">
          <colgroup>
            <col style={{ width: '180px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '200px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '60px' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Rekening</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-2 py-1 text-center">
                  <div className="w-6 h-6 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : companiesArray.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-2 py-1 text-center text-gray-500 text-xs">
                  {searchQuery ? 'No companies found matching your search.' : 'No companies available.'}
                </td>
              </tr>
            ) : (
              companiesArray.map((company) => (
                <tr 
                  key={company.id} 
                  onClick={() => onViewDetail(company)}
                  className={`cursor-pointer transition-colors h-8 ${
                    selectedCompanyId === company.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate" title={company.nama_perusahaan}>{company.nama_perusahaan}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">{company.no_rekening || '-'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">{company.bank || '-'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate" title={company.email || '-'}>{company.email || '-'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 truncate" title={company.alamat || '-'}>{company.alamat || '-'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">{company.telp || '-'}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-xs">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(company.id);
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
      
      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
      
      <ConfirmationDialog 
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CompanyTable;
