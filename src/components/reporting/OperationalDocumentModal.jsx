import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge.jsx';
import { formatDate } from '../../utils/formatUtils';

const documentConfig = {
  purchaseOrders: {
    label: 'Purchase Order',
    icon: DocumentTextIcon,
    accentColor: 'text-blue-600',
    activeTabClass: 'border-blue-500 text-blue-600 bg-blue-50/50',
    numberKey: 'documentNumber',
  },
  packing: {
    label: 'Packing',
    icon: ClipboardDocumentListIcon,
    accentColor: 'text-green-600',
    activeTabClass: 'border-green-500 text-green-600 bg-green-50/50',
    numberKey: 'documentNumber',
  },
  suratJalan: {
    label: 'Surat Jalan',
    icon: TruckIcon,
    accentColor: 'text-purple-600',
    activeTabClass: 'border-purple-500 text-purple-600 bg-purple-50/50',
    numberKey: 'documentNumber',
  },
};

const getStatusVariant = (statusCode = '') => {
  const normalized = statusCode.toUpperCase();

  if (
    normalized.includes('DELIVERED') ||
    normalized.includes('PAID') ||
    normalized.includes('COMPLETE')
  ) {
    return 'success';
  }

  if (normalized.includes('PENDING') || normalized.includes('WAITING')) {
    return 'warning';
  }

  if (normalized.includes('DRAFT')) {
    return 'secondary';
  }

  if (normalized.includes('CANCEL') || normalized.includes('REJECT')) {
    return 'danger';
  }

  if (
    normalized.includes('ON') ||
    normalized.includes('PROCESS') ||
    normalized.includes('SHIPPING') ||
    normalized.includes('DELIVERY') ||
    normalized.includes('READY')
  ) {
    return 'info';
  }

  return 'primary';
};

const OperationalDocumentModal = ({
  show,
  onClose,
  initialTab = 'purchaseOrders',
  initialStatusFilter = '',
  documentsData = {},
  totals = {},
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (show) {
      setActiveTab(initialTab || 'purchaseOrders');
      setStatusFilter(initialStatusFilter || '');
      setSearchQuery('');
    }
  }, [show, initialTab, initialStatusFilter]);

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

  const rawList = documentsData[activeTab] || [];

  // Available unique status names for the active tab
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    rawList.forEach((item) => {
      if (item.statusName) statuses.add(item.statusName);
    });
    return Array.from(statuses);
  }, [rawList]);

  // Filtered documents (renders all matching documents directly)
  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      const matchStatus =
        !statusFilter ||
        item.statusName?.toLowerCase() === statusFilter.toLowerCase() ||
        item.statusCode?.toLowerCase() === statusFilter.toLowerCase();

      const docNum = item.documentNumber || '';
      const poNum = item.poNumber || '';
      const deliverTo = item.deliverTo || '';
      const query = searchQuery.toLowerCase().trim();

      const matchSearch =
        !query ||
        docNum.toLowerCase().includes(query) ||
        poNum.toLowerCase().includes(query) ||
        deliverTo.toLowerCase().includes(query);

      return matchStatus && matchSearch;
    });
  }, [rawList, statusFilter, searchQuery]);

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='flex flex-col w-full max-w-4xl h-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 shrink-0'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-xl text-blue-600'>
              <DocumentTextIcon className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                Detail Dokumen Operasional
              </h2>
              <p className='text-xs text-gray-500'>
                Daftar dokumen operasional pada periode yang dipilih
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

        {/* Tab Navigation */}
        <div className='flex border-b border-gray-200 bg-gray-50/70 px-6 gap-2 shrink-0'>
          {Object.entries(documentConfig).map(([key, config]) => {
            const Icon = config.icon;
            const count = totals[key] ?? documentsData[key]?.length ?? 0;
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type='button'
                onClick={() => {
                  setActiveTab(key);
                  setStatusFilter('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  isActive
                    ? `${config.activeTabClass} border-blue-600 text-blue-700 bg-white`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <Icon className='w-4 h-4' />
                <span>{config.label}</span>
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

        {/* Filters & Search */}
        <div className='p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0'>
          <div className='relative w-full sm:w-72'>
            <MagnifyingGlassIcon className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder='Cari nomor dokumen...'
              className='w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition'
            />
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
            <FunnelIcon className='w-4 h-4 text-gray-400 shrink-0' />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            >
              <option value=''>Semua Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {(statusFilter || searchQuery) && (
              <button
                type='button'
                onClick={() => {
                  setStatusFilter('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className='text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1'
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className='flex-1 overflow-y-auto p-4 bg-gray-50/30'>
          {paginatedList.length > 0 ? (
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
                      className='sticky top-0 bg-gray-100 px-4 py-2 border-r border-b border-gray-300 font-bold z-10'
                    >
                      DOKUMEN
                    </th>
                    <th
                      scope='col'
                      className='sticky top-0 bg-gray-100 px-4 py-2 w-44 text-center border-b border-gray-300 font-bold z-10'
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
                        key={item.id || item.documentNumber || index}
                        className='hover:bg-blue-50/60 even:bg-gray-50/40 transition-colors'
                      >
                        <td className='px-3 py-2 text-center text-xs font-mono text-gray-500 border-r border-gray-200'>
                          {rowNumber}
                        </td>
                        <td className='px-4 py-2.5 text-xs border-r border-gray-200'>
                          <div className='font-semibold text-gray-900'>
                            {activeTab === 'packing'
                              ? item.poNumber || item.documentNumber || '-'
                              : item.documentNumber || '-'}
                          </div>
                          {(item.poNumber && activeTab === 'suratJalan' || item.deliverTo) && (
                            <div className='text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1.5 items-center'>
                              {activeTab === 'suratJalan' && item.poNumber && (
                                <span className='inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium'>
                                  PO: {item.poNumber}
                                </span>
                              )}
                              {item.deliverTo && (
                                <span className='text-gray-500 text-[11px] font-normal'>
                                  ({item.deliverTo})
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className='px-4 py-2 text-center'>
                          <StatusBadge
                            status={
                              item.statusName || item.statusCode || 'UNKNOWN'
                            }
                            variant={getStatusVariant(
                              item.statusCode || item.statusName
                            )}
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
              <DocumentTextIcon className='w-10 h-10 stroke-1 mb-2 text-gray-300' />
              <p className='text-xs font-semibold text-gray-600'>
                Tidak ada dokumen ditemukan
              </p>
              <p className='text-[11px] text-gray-400 mt-0.5'>
                {statusFilter || searchQuery
                  ? 'Coba sesuaikan kata kunci pencarian atau filter status Anda'
                  : 'Belum ada dokumen pada periode ini'}
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
            dokumen
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

export default OperationalDocumentModal;
