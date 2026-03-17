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
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200 text-xs table-fixed">
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
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Company Name</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">No. Rekening</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Bank</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Address</th>
                <th className="px-2.5 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-2.5 py-1.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : companiesArray.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-xs text-gray-500">
                    {searchQuery ? 'No companies found matching your search.' : 'No companies available.'}
                  </td>
                </tr>
              ) : (
                companiesArray.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => onViewDetail(company)}
                    className={`cursor-pointer transition-colors ${
                      selectedCompanyId === company.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate" title={company.nama_perusahaan}>{company.nama_perusahaan}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900">{company.no_rekening || '-'}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900">{company.bank || '-'}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate" title={company.email || '-'}>{company.email || '-'}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900 truncate" title={company.alamat || '-'}>{company.alamat || '-'}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-xs text-gray-900">{company.telp || '-'}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
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

export default CompanyTable;
