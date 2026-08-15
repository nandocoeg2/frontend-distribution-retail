import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../common/StatusBadge';

const formatNumber = (num) =>
  new Intl.NumberFormat('id-ID').format(num || 0);

const statusTabs = [
  { key: 'all', label: 'Semua Status' },
  { key: 'normalStock', label: 'Normal', color: 'text-green-700 bg-green-50 border-green-200' },
  { key: 'lowStock', label: 'Low Stock', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'zeroStock', label: 'Habis', color: 'text-red-700 bg-red-50 border-red-200' },
];

const StockStatusModal = ({
  show,
  onClose,
  initialStatusKey = 'all',
  stockStatus = {},
}) => {
  const [activeTab, setActiveTab] = useState(initialStatusKey);
  const [searchQuery, setSearchQuery] = useState('');

  const items = stockStatus.items || [];

  useEffect(() => {
    if (show) {
      setActiveTab(initialStatusKey || 'all');
      setSearchQuery('');
    }
  }, [show, initialStatusKey]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  // Status counts
  const counts = useMemo(() => {
    const normal = stockStatus.normalStock || 0;
    const low = stockStatus.lowStock || 0;
    const zero = stockStatus.zeroStock || 0;
    return {
      all: items.length || normal + low + zero,
      normalStock: normal,
      lowStock: low,
      zeroStock: zero,
    };
  }, [stockStatus, items]);

  // Filtered items
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      const matchStatus =
        activeTab === 'all' || item.statusKey === activeTab;

      const plu = item.plu || '';
      const name = item.name || '';
      const query = searchQuery.toLowerCase().trim();

      const matchSearch =
        !query ||
        plu.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query);

      return matchStatus && matchSearch;
    });
  }, [items, activeTab, searchQuery]);

  if (!show) return null;

  const getStatusBadgeVariant = (statusKey) => {
    switch (statusKey) {
      case 'normalStock':
        return 'success';
      case 'lowStock':
        return 'warning';
      case 'zeroStock':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='flex flex-col w-full max-w-4xl h-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 shrink-0'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-xl text-blue-600'>
              <CubeIcon className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Detail Status Distribusi Stok
              </h2>
              <p className='text-xs text-gray-500'>
                Daftar ketersediaan dan status stok seluruh item
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-700'
            aria-label='Tutup'
          >
            <XMarkIcon className='w-5 h-5' />
          </button>
        </div>

        {/* Status Tab Navigation */}
        <div className='flex border-b border-gray-200 bg-gray-50/70 px-6 gap-2 shrink-0'>
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] ?? 0;

            return (
              <button
                key={tab.key}
                type='button'
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className='p-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0'>
          <div className='relative w-full sm:w-80'>
            <MagnifyingGlassIcon className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Cari PLU atau nama item...'
              className='w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition'
            />
          </div>
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery('')}
              className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1'
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className='flex-1 overflow-y-auto p-4 bg-gray-50/30'>
          {filteredList.length > 0 ? (
            <div className='overflow-x-auto rounded-lg border border-gray-300 shadow-sm bg-white'>
              <table className='w-full text-left text-xs border-collapse'>
                <thead className='bg-gray-100 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'>
                  <tr>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-3 py-2 w-14 text-center border-r border-b border-gray-300 font-bold z-10'
                    >
                      NO
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-32 border-r border-b border-gray-300 font-bold z-10'
                    >
                      PLU
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold z-10'
                    >
                      NAMA ITEM
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-28 border-r border-b border-gray-300 font-bold text-right z-10'
                    >
                      STOK (KARTON)
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-28 border-r border-b border-gray-300 font-bold text-right z-10'
                    >
                      STOK (PCS)
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-24 border-r border-b border-gray-300 font-bold text-right z-10'
                    >
                      MIN. STOK
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-28 text-center border-b border-gray-300 font-bold z-10'
                    >
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white font-sans'>
                  {filteredList.map((item, index) => {
                    const rowNumber = index + 1;
                    return (
                      <tr
                        key={item.id || item.plu || index}
                        className='hover:bg-blue-50/60 even:bg-gray-50/40 transition-colors'
                      >
                        <td className='px-3 py-2 text-center text-xs font-mono text-gray-500 border-r border-gray-200'>
                          {rowNumber}
                        </td>
                        <td className='px-4 py-2 font-mono text-xs font-semibold text-gray-800 border-r border-gray-200'>
                          {item.plu || '-'}
                        </td>
                        <td className='px-4 py-2 text-xs font-semibold text-gray-900 border-r border-gray-200'>
                          {item.name || '-'}
                        </td>
                        <td className='px-4 py-2 text-right font-medium text-gray-800 border-r border-gray-200'>
                          {formatNumber(item.stockCartons)}
                        </td>
                        <td className='px-4 py-2 text-right font-semibold text-gray-900 border-r border-gray-200'>
                          {formatNumber(item.stockPieces)}
                        </td>
                        <td className='px-4 py-2 text-right text-gray-600 border-r border-gray-200'>
                          {formatNumber(item.minimumStock)}
                        </td>
                        <td className='px-4 py-2 text-center'>
                          <StatusBadge
                            status={item.statusLabel || 'Normal'}
                            variant={getStatusBadgeVariant(item.statusKey)}
                            size='sm'
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-44 text-center text-gray-400'>
              <CubeIcon className='w-10 h-10 stroke-1 mb-2 text-gray-300' />
              <p className='text-xs font-semibold text-gray-600'>
                Tidak ada item ditemukan
              </p>
              <p className='text-[11px] text-gray-400 mt-0.5'>
                {searchQuery
                  ? 'Coba sesuaikan kata kunci pencarian Anda'
                  : 'Belum ada item pada kategori ini'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 shrink-0'>
          <div className='text-xs text-gray-500'>
            Total{' '}
            <span className='font-semibold text-gray-700'>
              {filteredList.length}
            </span>{' '}
            item
          </div>

          <button
            type='button'
            onClick={onClose}
            className='px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-sm'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockStatusModal;
