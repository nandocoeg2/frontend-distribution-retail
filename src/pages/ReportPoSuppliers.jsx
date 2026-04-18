import React, { useCallback, useEffect, useState } from 'react';

import Card from '../components/ui/Card.jsx';
import ReportPoSuppliersTable from '../components/reportPoSuppliers/ReportPoSuppliersTable.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { reportPoSupplierService } from '../services/reportPoSupplierService.js';

const ReportPoSuppliers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({ totalItems: 0, totalPages: 0, currentPage: 1, itemsPerPage: 10 });



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

  const handlePageChange = useCallback((p) => { setPage(p); }, []);
  const handleLimitChange = useCallback((l) => { setLimit(l); setPage(1); }, []);

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
        <ReportPoSuppliersTable data={data} loading={loading} />
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
    </Card>
  );
};

export default ReportPoSuppliers;
