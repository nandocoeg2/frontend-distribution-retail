import React, { useCallback, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  TandaTerimaFakturGroupedTable,
  TandaTerimaFakturGroupedDetailModal,
  PrintTandaTerimaFakturByGroupModal,
} from '@/components/tandaTerimaFaktur';
import HeroIcon from '@/components/atoms/HeroIcon';
import { PrinterIcon } from '@heroicons/react/24/outline';

const TandaTerimaFakturGroupedPage = () => {
  const [selectedGroupedItem, setSelectedGroupedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [tanggal, setTanggal] = useState(null);
  const [tanggalStart, setTanggalStart] = useState(null);
  const [tanggalEnd, setTanggalEnd] = useState(null);
  const [filterMode, setFilterMode] = useState('all');

  const handleOpenDetail = useCallback((item) => {
    setSelectedGroupedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedGroupedItem(null);
  }, []);

  const handleOpenPrintModal = useCallback(() => {
    setIsPrintModalOpen(true);
  }, []);

  const handleClosePrintModal = useCallback(() => {
    setIsPrintModalOpen(false);
  }, []);

  const handleFilterModeChange = useCallback((mode) => {
    setFilterMode(mode);
    if (mode === 'all') {
      setTanggal(null);
      setTanggalStart(null);
      setTanggalEnd(null);
    } else if (mode === 'single') {
      setTanggalStart(null);
      setTanggalEnd(null);
    } else if (mode === 'range') {
      setTanggal(null);
    }
  }, []);

  const filterParams = useMemo(() => {
    if (filterMode === 'single' && tanggal) {
      return { tanggal };
    }
    if (filterMode === 'range' && (tanggalStart || tanggalEnd)) {
      return {
        ...(tanggalStart && { tanggal_start: tanggalStart }),
        ...(tanggalEnd && { tanggal_end: tanggalEnd }),
      };
    }
    return {};
  }, [filterMode, tanggal, tanggalStart, tanggalEnd]);

  return (
    <div className='p-6'>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-4 py-5 sm:p-6'>
          {/* Header */}
          <div className='flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between'>
            <div className='space-y-1'>
              <h3 className='text-lg font-medium text-gray-900'>
                Tanda Terima Faktur - Ringkasan per Group Customer
              </h3>
              <p className='text-sm text-gray-500'>
                Lihat ringkasan TTF yang dikelompokkan berdasarkan group
                customer dan term of payment.
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <div className='mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200'>
            <div className='mb-4'>
              <div className='flex items-center justify-between mb-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Mode Filter
                </label>
                <button
                  onClick={handleOpenPrintModal}
                  className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition'
                >
                  <PrinterIcon className='w-5 h-5' />
                  Print By Group & TOP
                </button>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => handleFilterModeChange('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semua Data
                </button>
                <button
                  onClick={() => handleFilterModeChange('single')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    filterMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Tanggal Spesifik
                </button>
                <button
                  onClick={() => handleFilterModeChange('range')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    filterMode === 'range'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Range Tanggal
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            {filterMode === 'single' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tanggal
                </label>
                <input
                  type='date'
                  value={tanggal || ''}
                  onChange={(e) => setTanggal(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            )}

            {filterMode === 'range' && (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tanggal Mulai
                  </label>
                  <input
                    type='date'
                    value={tanggalStart || ''}
                    onChange={(e) => setTanggalStart(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tanggal Akhir
                  </label>
                  <input
                    type='date'
                    value={tanggalEnd || ''}
                    onChange={(e) => setTanggalEnd(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <TandaTerimaFakturGroupedTable
            onViewDetail={handleOpenDetail}
            tanggal={filterParams.tanggal}
            tanggalStart={filterParams.tanggal_start}
            tanggalEnd={filterParams.tanggal_end}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <TandaTerimaFakturGroupedDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        groupedItem={selectedGroupedItem}
      />

      {/* Print Modal */}
      <PrintTandaTerimaFakturByGroupModal
        isOpen={isPrintModalOpen}
        onClose={handleClosePrintModal}
      />
    </div>
  );
};

export default TandaTerimaFakturGroupedPage;
