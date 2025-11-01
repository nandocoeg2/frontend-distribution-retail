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
    <div className='overflow-x-auto border-2 border-gray-300 rounded-lg shadow-sm'>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='border-b-2 border-gray-300 bg-gray-50'>
            <th
              rowSpan={2}
              className='px-4 py-3 text-sm font-semibold text-left text-gray-900 border-r border-gray-300'
            >
              Tanggal
            </th>
            <th
              rowSpan={2}
              className='px-4 py-3 text-sm font-semibold text-left text-gray-900 border-r border-gray-300'
            >
              Group Customer
            </th>
            <th
              colSpan={allTopCodes.length}
              className='px-4 py-3 text-sm font-semibold text-center text-gray-900 border-r border-gray-300'
            >
              Term of Payment
            </th>
            <th
              rowSpan={2}
              className='px-4 py-3 text-sm font-semibold text-center text-gray-900'
            >
              Action
            </th>
          </tr>
          {/* Column Letters Header Row */}
          {allTopCodes.length > 0 && (
            <tr className='border-b-2 border-gray-300 bg-gray-100'>
              {allTopCodes.map((code, index) => (
                <th
                  key={`letter-${code}`}
                  className='px-4 py-2 text-sm font-semibold text-center text-gray-900 border-r border-gray-300 last:border-r-0'
                >
                  {getColumnLetter(index)}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {groupedData.map((item, idx) => (
            <tr
              key={`${item.tanggal}-${item.groupCustomer?.id || idx}`}
              className='border-b border-gray-300 hover:bg-gray-50 transition'
            >
              <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-300'>
                {new Date(item.tanggal).toLocaleDateString('id-ID')}
              </td>
              <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-300'>
                {item.groupCustomer?.nama_group || '-'}
              </td>
              {allTopCodes.map((code) => (
                <td
                  key={`${item.tanggal}-${item.groupCustomer?.id}-${code}`}
                  className='px-4 py-3 text-sm text-center text-gray-700 border-r border-gray-300 last:border-r-0'
                >
                  {getCountForTop(item.topGroups, code)}
                </td>
              ))}
              <td className='px-4 py-3 text-center'>
                <div className='flex items-center justify-center gap-2'>
                  <button
                    onClick={() => onViewDetail && onViewDetail(item)}
                    className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition'
                  >
                    <HeroIcon name='eye' className='w-4 h-4 mr-1' />
                    view detail
                  </button>
                  <button className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition'>
                    <HeroIcon name='arrow-down-tray' className='w-4 h-4 mr-1' />
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
