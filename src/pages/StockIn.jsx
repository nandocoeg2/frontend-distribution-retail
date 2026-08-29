import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import StockInTable from '../components/stockMovements/StockInTable.jsx';
import CreateStockInModal from '../components/stockMovements/CreateStockInModal.jsx';
import { useConfirmationDialog } from '../components/ui/ConfirmationDialog.jsx';
import toastService from '../services/toastService';
import { exportStockInExcel, deleteStockIn } from '../services/stockMovementService';

const StockIn = () => {
  const queryClient = useQueryClient();
  const tableRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMovement, setEditMovement] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const {
    showDialog,
    hideDialog,
    setLoading: setDialogLoading,
    ConfirmationDialog: ConfirmationDialogComponent,
  } = useConfirmationDialog();

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const filters = tableRef.current?.getFilters?.() || {};
      const params = {};
      if (filters.createdAt?.from) {
        params.startDate = new Date(filters.createdAt.from).toISOString();
      }
      if (filters.createdAt?.to) {
        params.endDate = new Date(filters.createdAt.to).toISOString();
      }
      if (params.startDate || params.endDate) {
        params.dateFilterType = 'custom';
      }
      if (filters.nama_barang) {
        params.search = Array.isArray(filters.nama_barang) ? filters.nama_barang[0] : filters.nama_barang;
      }
      await exportStockInExcel(params);
      toastService.success('Excel Stock In berhasil di-export.');
    } catch (err) {
      toastService.error(err?.message || 'Gagal mengexport Excel Stock In.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditMovement(null);
    queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
    tableRef.current?.refetch?.();
  };

  const handleDelete = useCallback(
    (row) => {
      const movementId = row?.movementId || row?.id || row?.source?.id;
      const suratJalan = row?.no_surat_jalan && row.no_surat_jalan !== '-' ? ` (No. SJ: ${row.no_surat_jalan})` : '';
      const barang = row?.nama_barang && row.nama_barang !== '-' ? ` barang "${row.nama_barang}"` : '';

      if (!movementId) {
        toastService.error('ID Stock In tidak ditemukan.');
        return;
      }

      setDeletingId(movementId);
      showDialog({
        title: 'Hapus Stock In',
        message: `Apakah Anda yakin ingin menghapus data Stock In${suratJalan}${barang ? ` untuk${barang}` : ''}? Tindakan ini akan mengembalikan stok barang terkait.`,
        type: 'danger',
        confirmText: 'Hapus',
        cancelText: 'Batal',
      });
    },
    [showDialog]
  );

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setDialogLoading(true);
    try {
      await deleteStockIn(deletingId);
      toastService.success('Stock In berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      tableRef.current?.refetch?.();
      hideDialog();
    } catch (err) {
      toastService.error(err?.message || 'Gagal menghapus data Stock In.');
    } finally {
      setDialogLoading(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-full mx-auto w-full h-full flex flex-col">
        <div className="bg-white shadow rounded-lg overflow-hidden p-3 flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Stock In</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <HeroIcon name='plus' className='w-4 h-4 mr-1.5' />
                Stock In Baru
              </button>
            </div>
          </div>

          {/* TanStack Table with Server-Side Features */}
          <div className="flex-1 flex flex-col min-h-0">
            <StockInTable
              ref={tableRef}
              onEdit={(movement) => setEditMovement(movement)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* Create Stock In Modal */}
      {showCreateModal && (
        <CreateStockInModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
            tableRef.current?.refetch?.();
            toastService.success('Stock In berhasil dibuat.');
          }}
        />
      )}

      {/* Edit Stock In Modal */}
      {Boolean(editMovement) && (
        <CreateStockInModal
          editMovement={editMovement}
          onClose={() => setEditMovement(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialogComponent onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default StockIn;
