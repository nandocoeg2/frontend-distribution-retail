import React, { useCallback, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  TandaTerimaFakturGroupedTable,
  TandaTerimaFakturGroupedDetailModal,
  PrintTandaTerimaFakturByGroupModal,
  UploadTTF2Modal,
} from '@/components/tandaTerimaFaktur';
import HeroIcon from '@/components/atoms/HeroIcon';
import { PrinterIcon } from '@heroicons/react/24/outline';

const TandaTerimaFakturGroupedPage = () => {
  const queryClient = useQueryClient();
  const [selectedGroupedItem, setSelectedGroupedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isUploadTTF2ModalOpen, setIsUploadTTF2ModalOpen] = useState(false);
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

  const handleOpenUploadModal = useCallback(() => {
    setIsUploadTTF2ModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadTTF2ModalOpen(false);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['tandaTerimaFaktur'] });
  }, [queryClient]);

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
    <div>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3 space-y-3'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-1'>
              <h3 className='text-sm font-semibold text-gray-900'>
                Tanda Terima Faktur - Ringkasan per Group Customer
              </h3>
            </div>
          </div>

          <div className='p-3 space-y-3 bg-gray-50 border border-gray-200 rounded-md'>
            <div className='space-y-3'>
              <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                <label className='block text-xs font-medium text-gray-700'>
                  Mode Filter
                </label>
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={handleOpenUploadModal}
                    className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-green-600 rounded hover:bg-green-700'
                  >
                    <HeroIcon name='arrow-up-tray' className='w-4 h-4 mr-1.5' />
                    Upload TTF 2
                  </button>
                  <button
                    onClick={handleOpenPrintModal}
                    className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700'
                  >
                    <PrinterIcon className='w-4 h-4 mr-1.5' />
                    Print TTF 1
                  </button>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => handleFilterModeChange('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semua Data
                </button>
                <button
                  onClick={() => handleFilterModeChange('single')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                    filterMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Tanggal Spesifik
                </button>
                <button
                  onClick={() => handleFilterModeChange('range')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition ${
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
                <label className='block mb-2 text-xs font-medium text-gray-700'>
                  Tanggal
                </label>
                <input
                  type='date'
                  value={tanggal || ''}
                  onChange={(e) => setTanggal(e.target.value)}
                  className='w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            )}

            {filterMode === 'range' && (
              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <label className='block mb-2 text-xs font-medium text-gray-700'>
                    Tanggal Mulai
                  </label>
                  <input
                    type='date'
                    value={tanggalStart || ''}
                    onChange={(e) => setTanggalStart(e.target.value)}
                    className='w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block mb-2 text-xs font-medium text-gray-700'>
                    Tanggal Akhir
                  </label>
                  <input
                    type='date'
                    value={tanggalEnd || ''}
                    onChange={(e) => setTanggalEnd(e.target.value)}
                    className='w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>
            )}
          </div>

          <TandaTerimaFakturGroupedTable
            onViewDetail={handleOpenDetail}
            tanggal={filterParams.tanggal}
            tanggalStart={filterParams.tanggal_start}
            tanggalEnd={filterParams.tanggal_end}
          />
        </div>
      </div>

      <TandaTerimaFakturGroupedDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        groupedItem={selectedGroupedItem}
      />

      <UploadTTF2Modal
        isOpen={isUploadTTF2ModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
      />

      <PrintTandaTerimaFakturByGroupModal
        isOpen={isPrintModalOpen}
        onClose={handleClosePrintModal}
      />
    </div>
  );
};

export default TandaTerimaFakturGroupedPage;
