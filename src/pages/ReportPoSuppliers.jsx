import React, { useCallback, useEffect, useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

import Card from '../components/ui/Card.jsx';
import ReportPoSuppliersTable from '../components/reportPoSuppliers/ReportPoSuppliersTable.jsx';
import ReportPoSupplierFormModal from '../components/reportPoSuppliers/ReportPoSupplierFormModal.jsx';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { reportPoSupplierService } from '../services/reportPoSupplierService.js';

const ReportPoSuppliers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: 10 });

  // Selection
  const [selected, setSelected] = useState(null);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportPoSupplierService.getAll(page, limit);
      if (!response?.success) throw new Error(response?.error?.message || 'Gagal memuat data.');
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const p = response?.data?.pagination || {};
      setData(rows);
      setPaginationInfo({
        totalItems: Number(p.totalItems ?? p.total ?? rows.length) || 0,
        totalPages: Number(p.totalPages ?? p.total_pages ?? 0) || 0,
        currentPage: Number(p.currentPage ?? p.page ?? page) || page,
        itemsPerPage: Number(p.itemsPerPage ?? p.limit ?? limit) || limit,
      });
    } catch (err) {
      setError(err.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handlers
  const handleAdd = () => { setEditData(null); setShowForm(true); };
  const handleEdit = () => { if (selected) { setEditData(selected); setShowForm(true); } };
  const handleDeleteClick = () => { if (selected) setShowDeleteConfirm(true); };

  const handleFormSubmit = async (payload) => {
    if (editData?.id) {
      await reportPoSupplierService.update(editData.id, payload);
    } else {
      await reportPoSupplierService.create(payload);
    }
    setSelected(null);
    fetchData();
  };

  const handleDeleteConfirm = async () => {
    if (!selected?.id) return;
    setDeleteLoading(true);
    try {
      await reportPoSupplierService.delete(selected.id);
      setSelected(null);
      setShowDeleteConfirm(false);
      fetchData();
    } catch (err) {
      setError(err?.message || 'Gagal menghapus data.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePageChange = useCallback((p) => { setPage(p); setSelected(null); }, []);
  const handleLimitChange = useCallback((l) => { setLimit(l); setPage(1); setSelected(null); }, []);

  const visibleCount = data.length;
  const totalItems = paginationInfo.totalItems || visibleCount;

  return (
    <Card padding='md' className='shadow-sm'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-lg font-semibold text-gray-900'>Report PO Suppliers</h1>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-500'>
            <span className='font-semibold text-gray-700'>{visibleCount}</span>/{totalItems} data
          </span>

          {/* Action buttons — show edit/delete only when a row is selected */}
          {selected && (
            <>
              <button type='button' onClick={handleEdit}
                className='inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500'>
                <PencilSquareIcon className='h-3.5 w-3.5' aria-hidden='true' /> Edit
              </button>
              <button type='button' onClick={handleDeleteClick}
                className='inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'>
                <TrashIcon className='h-3.5 w-3.5' aria-hidden='true' /> Hapus
              </button>
            </>
          )}

          <button type='button' onClick={handleAdd}
            className='inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'>
            <PlusIcon className='h-3.5 w-3.5' aria-hidden='true' /> Tambah
          </button>
        </div>
      </header>

      <div className='my-2 h-px bg-gray-200' />

      {error && (
        <div className='mt-2 flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800'>
          <span>Error: {error}</span>
          <button type='button' onClick={fetchData} className='rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'>
            Muat ulang
          </button>
        </div>
      )}

      <div className='mt-3'>
        <ReportPoSuppliersTable data={data} loading={loading} selectedId={selected?.id} onSelect={setSelected} />
        <Pagination
          pagination={{
            currentPage: paginationInfo.currentPage || page,
            totalPages: paginationInfo.totalPages || 0,
            totalItems: paginationInfo.totalItems || 0,
            itemsPerPage: paginationInfo.itemsPerPage || limit,
          }}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Add/Edit Modal */}
      <ReportPoSupplierFormModal
        show={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        onSubmit={handleFormSubmit}
        editData={editData}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title='Hapus Report PO Supplier'
        message={`Apakah Anda yakin ingin menghapus data "${selected?.nama_supplier || ''} - ${selected?.no_po || ''}"?`}
        type='danger'
        confirmText='Hapus'
        loading={deleteLoading}
      />
    </Card>
  );
};

export default ReportPoSuppliers;
