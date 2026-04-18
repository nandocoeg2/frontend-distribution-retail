import React, { useCallback, useEffect, useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

import Card from '../components/ui/Card.jsx';
import Pagination from '../components/common/Pagination.jsx';
import SupplierItemPriceFormModal from '../components/supplierItemPrices/SupplierItemPriceFormModal.jsx';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx';
import { supplierItemPriceService } from '../services/supplierItemPriceService.js';
import { formatCurrency } from '@/utils/formatUtils';
import toastService from '../services/toastService';

const SupplierItemPrices = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: 10 });

  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierItemPriceService.getAll(page, limit);
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

  const handleAdd = () => { setEditData(null); setShowForm(true); };
  const handleEdit = () => { if (selected) { setEditData(selected); setShowForm(true); } };
  const handleDeleteClick = () => { if (selected) setShowDeleteConfirm(true); };

  const handleFormSubmit = async (payload) => {
    if (editData?.id) {
      await supplierItemPriceService.update(editData.id, payload);
      toastService.success('Harga berhasil diperbarui.');
    } else {
      await supplierItemPriceService.create(payload);
      toastService.success('Harga berhasil ditambahkan.');
    }
    setSelected(null);
    fetchData();
  };

  const handleDeleteConfirm = async () => {
    if (!selected?.id) return;
    setDeleteLoading(true);
    try {
      await supplierItemPriceService.delete(selected.id);
      toastService.success('Harga berhasil dihapus.');
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
          <h1 className='text-lg font-semibold text-gray-900'>Harga Item Supplier</h1>
          <p className='text-xs text-gray-500'>Harga item per supplier — digunakan otomatis saat Stock In</p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-gray-500'>
            <span className='font-semibold text-gray-700'>{visibleCount}</span>/{totalItems} data
          </span>

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

      <div className='mt-3 overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 text-xs'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='border border-gray-200 px-3 py-2 text-center w-10'></th>
              <th className='border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>Supplier</th>
              <th className='border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>Kode</th>
              <th className='border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>Item (PLU)</th>
              <th className='border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>Nama Barang</th>
              <th className='border border-gray-200 px-3 py-2 text-right font-semibold text-gray-600'>Harga/PCS</th>
              <th className='border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>Spesifikasi</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {loading ? (
              <tr>
                <td colSpan={7} className='px-3 py-4 text-center text-xs text-gray-500'>
                  <div className='flex items-center justify-center gap-1'>
                    <div className='h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' />
                    <span>Memuat...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className='px-3 py-4 text-center text-xs text-gray-500'>Belum ada data harga.</td>
              </tr>
            ) : (
              data.map((row) => {
                const sel = selected?.id === row.id;
                return (
                  <tr key={row.id} className={sel ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                    <td className='border border-gray-200 px-3 py-1.5 text-center'>
                      <input type='checkbox' checked={sel}
                        onChange={() => setSelected(sel ? null : row)}
                        className='h-3.5 w-3.5 cursor-pointer accent-indigo-600' />
                    </td>
                    <td className='border border-gray-200 px-3 py-1.5'>{row.supplier?.name || '-'}</td>
                    <td className='border border-gray-200 px-3 py-1.5'>{row.supplier?.code || '-'}</td>
                    <td className='border border-gray-200 px-3 py-1.5'>{row.item?.plu || '-'}</td>
                    <td className='border border-gray-200 px-3 py-1.5'>{row.item?.nama_barang || '-'}</td>
                    <td className='border border-gray-200 px-3 py-1.5 text-right'>{formatCurrency(row.harga_pcs)}</td>
                    <td className='border border-gray-200 px-3 py-1.5'>{row.spesifikasi || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

      <SupplierItemPriceFormModal
        show={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        onSubmit={handleFormSubmit}
        editData={editData}
      />

      <ConfirmationDialog
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title='Hapus Harga Item Supplier'
        message={`Apakah Anda yakin ingin menghapus harga "${selected?.supplier?.name || ''} - ${selected?.item?.nama_barang || ''}"?`}
        type='danger'
        confirmText='Hapus'
        loading={deleteLoading}
      />
    </Card>
  );
};

export default SupplierItemPrices;
