import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import StockOutTable from '../components/stockMovements/StockOutTable.jsx';
import CreateStockOutModal from '../components/stockMovements/CreateStockOutModal.jsx';
import { getItems } from '../services/itemService';
import toastService from '../services/toastService';
import { exportStockOutExcel, createStockOut } from '../services/stockMovementService';

const StockOut = () => {
  const queryClient = useQueryClient();
  const tableRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Load item options for Stock Out Modal
  useEffect(() => {
    const loadItems = async () => {
      setOptionsLoading(true);
      try {
        const payload = await getItems(1, 100);
        const rawItems =
          payload?.data?.data ||
          payload?.data?.items ||
          payload?.data ||
          payload?.items ||
          [];
        const itemsArray = Array.isArray(rawItems)
          ? rawItems
          : Array.isArray(rawItems?.data)
          ? rawItems.data
          : [];
        setItemOptions(itemsArray);
      } catch (err) {
        toastService.error('Gagal memuat daftar item.');
      } finally {
        setOptionsLoading(false);
      }
    };
    loadItems();
  }, []);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const filters = tableRef.current?.getFilters?.() || {};
      const params = {};
      if (filters.tgl?.from) {
        params.startDate = new Date(filters.tgl.from).toISOString();
      }
      if (filters.tgl?.to) {
        params.endDate = new Date(filters.tgl.to).toISOString();
      }
      if (params.startDate || params.endDate) {
        params.dateFilterType = 'custom';
      }
      if (filters.namaBarang) {
        params.search = Array.isArray(filters.namaBarang) ? filters.namaBarang[0] : filters.namaBarang;
      }
      await exportStockOutExcel(params);
      toastService.success('Excel Stock Out berhasil di-export.');
    } catch (err) {
      toastService.error(err?.message || 'Gagal mengexport Excel Stock Out.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleStockOutSubmit = async (payload) => {
    try {
      await createStockOut(payload);
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      tableRef.current?.refetch?.();
      toastService.success('Stock Out berhasil dibuat.');
    } catch (err) {
      toastService.error(err?.message || 'Gagal membuat Stock Out.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-full mx-auto w-full h-full flex flex-col">
        <div className="bg-white shadow rounded-lg overflow-hidden p-3 flex flex-col flex-1 min-h-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Stock Out</h3>
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
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                <HeroIcon name='plus' className='w-4 h-4 mr-1.5' />
                Stock Out Baru
              </button>
            </div>
          </div>

          {/* TanStack Table with Server-Side Features */}
          <div className="flex-1 flex flex-col min-h-0">
            <StockOutTable
              ref={tableRef}
            />
          </div>
        </div>
      </div>

      {/* Create Stock Out Modal */}
      {showCreateModal && (
        <CreateStockOutModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleStockOutSubmit}
          itemOptions={itemOptions}
          optionsLoading={optionsLoading}
        />
      )}
    </div>
  );
};

export default StockOut;
