import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import Card from '../components/ui/Card.jsx';
import ReportPoSuppliersTable from '../components/reportPoSuppliers/ReportPoSuppliersTable.jsx';
import { reportPoSupplierService } from '../services/reportPoSupplierService.js';
import toastService from '../services/toastService';

const ReportPoSuppliers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportPoSupplierService.getAll(1, 9999);
      if (!response?.success) throw new Error(response?.error?.message || 'Gagal memuat data.');
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setData(rows);
    } catch (err) {
      setError(err.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      await reportPoSupplierService.exportExcel();
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err?.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  const visibleCount = data.length;
  const totalItems = visibleCount;

  return (
    <div className='h-full flex flex-col'>
      <Card padding='md' className='shadow-sm flex-1 flex flex-col min-h-0'>
        <header className='flex items-center justify-between flex-shrink-0'>
          <div>
            <h1 className='text-lg font-semibold text-gray-900'>Report PO Suppliers</h1>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-gray-500'>
              <span className='font-semibold text-gray-700'>{visibleCount}</span>/{totalItems} data
            </span>
            <button
              type='button'
              onClick={handleExportExcel}
              disabled={exportLoading}
              className='inline-flex items-center justify-center rounded bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors'
            >
              {exportLoading ? (
                <>
                  <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className='mr-1.5 h-4 w-4' aria-hidden='true' />
                  Export Excel
                </>
              )}
            </button>
          </div>
        </header>

        <div className='my-2 h-px bg-gray-200 flex-shrink-0' />

        {error && (
          <div className='mt-2 flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex-shrink-0'>
            <span>Error: {error}</span>
            <button type='button' onClick={fetchData} className='rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'>
              Muat ulang
            </button>
          </div>
        )}

        <div className='mt-3 flex-1 flex flex-col min-h-0'>
          <ReportPoSuppliersTable data={data} loading={loading} />
        </div>
      </Card>
    </div>
  );
};

export default ReportPoSuppliers;
