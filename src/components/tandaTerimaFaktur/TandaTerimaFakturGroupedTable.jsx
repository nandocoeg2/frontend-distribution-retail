import React, { useMemo } from 'react';
import { useTandaTerimaFakturGrouped } from '@/hooks/useTandaTerimaFakturGrouped';
import useTermOfPayments from '@/hooks/useTermOfPayments';
import HeroIcon from '@/components/atoms/HeroIcon';

const TandaTerimaFakturGroupedTable = ({
  onViewDetail = null,
  tanggal = null,
  tanggalStart = null,
  tanggalEnd = null,
}) => {
  const params = {
    ...(tanggal && { tanggal }),
    ...(tanggalStart && { tanggal_start: tanggalStart }),
    ...(tanggalEnd && { tanggal_end: tanggalEnd }),
  };

  const { data, isLoading, isError, error } =
    useTandaTerimaFakturGrouped(params);

  // Fetch all term of payments to get TOP codes
  const { results: termOfPayments = [], pagination: topPagination } =
    useTermOfPayments() || {};

  const groupedData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  // Get all unique TOP codes from API response, sorted by API order
  const allTopCodes = useMemo(() => {
    const tops = new Set();
    groupedData.forEach((group) => {
      group.topGroups?.forEach((topGroup) => {
        if (topGroup.termOfPayment?.kode_top) {
          tops.add(topGroup.termOfPayment.kode_top);
        }
      });
    });
    return Array.from(tops).sort();
  }, [groupedData]);

  // Helper function to convert index to column letter
  const getColumnLetter = (index) => {
    const baseCharCode = 69; // ASCII code for 'E'
    return String.fromCharCode(baseCharCode + index);
  };

  const getCountForTop = (topGroups, kodeTop) => {
    const found = topGroups?.find(
      (tg) => tg.termOfPayment?.kode_top === kodeTop
    );
    return found?.count || 0;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='w-12 h-12 mx-auto mb-4 border-4 border-gray-300 rounded-full border-t-blue-600 animate-spin'></div>
          <p className='text-gray-500'>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
        <p className='text-red-800'>
          Error: {error?.message || 'Gagal memuat data'}
        </p>
      </div>
    );
  }

  if (!groupedData || groupedData.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500'>
        <p>Tidak ada data tersedia</p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full bg-white border border-gray-200 text-xs table-fixed'>
        <thead>
          <tr className='border-b border-gray-200 bg-gray-50'>
            <th
              rowSpan={2}
              className='px-2 py-1.5 text-xs font-medium text-left text-gray-500 uppercase tracking-wider border-r border-gray-200'
            >
              Tanggal
            </th>
            <th
              rowSpan={2}
              className='px-2 py-1.5 text-xs font-medium text-left text-gray-500 uppercase tracking-wider border-r border-gray-200'
            >
              Group Customer
            </th>
            <th
              colSpan={allTopCodes.length}
              className='px-2 py-1.5 text-xs font-medium text-center text-gray-500 uppercase tracking-wider border-r border-gray-200'
            >
              Term of Payment
            </th>
            <th
              rowSpan={2}
              className='px-2 py-1.5 text-xs font-medium text-center text-gray-500 uppercase tracking-wider'
            >
              Action
            </th>
          </tr>
          {/* Column Letters Header Row */}
          {allTopCodes.length > 0 && (
            <tr className='border-b border-gray-200 bg-gray-100'>
              {allTopCodes.map((code, index) => (
                <th
                  key={`letter-${code}`}
                  className='px-2 py-1 text-xs font-medium text-center text-gray-500 border-r border-gray-200 last:border-r-0'
                >
                  {getColumnLetter(index)}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody className='divide-y divide-gray-100'>
          {groupedData.map((item, idx) => (
            <tr
              key={`${item.tanggal}-${item.groupCustomer?.id || idx}`}
              className='hover:bg-gray-50 h-8'
            >
              <td className='px-2 py-1 text-xs text-gray-900 border-r border-gray-100'>
                {new Date(item.tanggal).toLocaleDateString('id-ID')}
              </td>
              <td className='px-2 py-1 text-xs text-gray-900 border-r border-gray-100 truncate' title={item.groupCustomer?.nama_group || '-'}>
                {item.groupCustomer?.nama_group || '-'}
              </td>
              {allTopCodes.map((code) => (
                <td
                  key={`${item.tanggal}-${item.groupCustomer?.id}-${code}`}
                  className='px-2 py-1 text-xs text-center text-gray-700 border-r border-gray-100 last:border-r-0'
                >
                  {getCountForTop(item.topGroups, code)}
                </td>
              ))}
              <td className='px-2 py-1 text-center'>
                <div className='flex items-center justify-center gap-1'>
                  <button
                    onClick={() => onViewDetail && onViewDetail(item)}
                    className='inline-flex items-center px-2 py-0.5 text-xs font-medium text-blue-600 hover:text-blue-800'
                  >
                    <HeroIcon name='eye' className='w-3.5 h-3.5 mr-0.5' />
                    view
                  </button>
                  <button className='inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-800'>
                    <HeroIcon name='arrow-down-tray' className='w-3.5 h-3.5 mr-0.5' />
                    download
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TandaTerimaFakturGroupedTable;
