import React, { useState, useEffect, useCallback } from 'react';
import {
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatUtils';
import { useConfirmationDialog } from '../ui';
import Pagination from '../common/Pagination';
import { getCompanies } from '../../services/companyService';

const ItemTable = ({
  items,
  pagination,
  onPageChange,
  onLimitChange,
  onDelete,
  onViewDetail,
  selectedItemId,
  loading,
  onFilterChange,
}) => {
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({
    nama_barang: '',
    plu: '',
    item_code: '',
    companyId: '',
  });
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const { showDialog, hideDialog, ConfirmationDialog } = useConfirmationDialog();

  // Fetch companies for filter dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await getCompanies(1, 100);
        const data = response?.data?.data || response?.data || [];
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const formatDecimal = (value, fractionDigits = 2) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return '0';
    }
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    }).format(numericValue);
  };

  const resolveDimension = (item) => {
    const dimensiValue = (() => {
      if (!item) return null;
      if (item.dimensiBarang && typeof item.dimensiBarang === 'object' && !Array.isArray(item.dimensiBarang)) {
        return item.dimensiBarang;
      }
      if (Array.isArray(item.dimensiBarang) && item.dimensiBarang.length > 0) {
        return item.dimensiBarang[0];
      }
      if (item.dimensi && typeof item.dimensi === 'object') {
        return item.dimensi;
      }
      return null;
    })();

    const berat = item?.berat ?? dimensiValue?.berat ?? 0;
    const panjang = item?.panjang ?? dimensiValue?.panjang ?? 0;
    const lebar = item?.lebar ?? dimensiValue?.lebar ?? 0;
    const tinggi = item?.tinggi ?? dimensiValue?.tinggi ?? 0;

    return {
      berat: `${formatDecimal(berat)} kg`,
      formattedSize: `${formatDecimal(panjang, 0)} x ${formatDecimal(lebar, 0)} x ${formatDecimal(tinggi, 0)} cm`,
    };
  };

  const handleFilterChange = useCallback((field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    // Notify parent of filter change if callback provided
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  }, [filters, onFilterChange]);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const resetFilters = useCallback(() => {
    const emptyFilters = {
      nama_barang: '',
      plu: '',
      item_code: '',
      companyId: '',
    };
    setFilters(emptyFilters);
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  }, [onFilterChange]);

  // Filter items locally based on filters
  const filteredItems = items.filter(item => {
    if (filters.nama_barang && !item.nama_barang?.toLowerCase().includes(filters.nama_barang.toLowerCase())) {
      return false;
    }
    if (filters.plu && !item.plu?.toLowerCase().includes(filters.plu.toLowerCase())) {
      return false;
    }
    if (filters.item_code) {
      const itemCode = item.eanBarcode || item.item_code || '';
      if (!itemCode.toLowerCase().includes(filters.item_code.toLowerCase())) {
        return false;
      }
    }
    if (filters.companyId && item.companyId !== filters.companyId) {
      return false;
    }
    return true;
  });

  const handleDelete = (itemId) => {
    setDeleteId(itemId);
    showDialog({
      title: 'Hapus Item',
      message: 'Apakah Anda yakin ingin menghapus item ini?',
      type: 'danger',
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
    hideDialog();
  };

  const COLUMN_COUNT = 8;

  return (
    <div className='space-y-4'>
      {hasActiveFilters && (
        <div className='flex justify-end'>
          <button
            onClick={resetFilters}
            className='inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50'
          >
            <XMarkIcon className='h-3 w-3 mr-1' />
            Reset Filter
          </button>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-200 text-xs table-fixed'>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '60px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '50px' }} />
          </colgroup>
          <thead className='bg-gray-50'>
            <tr>
              {/* Company Code */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Company</div>
                  <select
                    value={filters.companyId}
                    onChange={(e) => handleFilterChange('companyId', e.target.value)}
                    className='w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                    disabled={loadingCompanies}
                  >
                    <option value="">{loadingCompanies ? 'Loading...' : 'All'}</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.kode_company}</option>
                    ))}
                  </select>
                </div>
              </th>
              {/* Nama Barang */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Nama Barang</div>
                  <input
                    type='text'
                    value={filters.nama_barang}
                    onChange={(e) => handleFilterChange('nama_barang', e.target.value)}
                    placeholder='Filter...'
                    className='w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>
              </th>
              {/* PLU */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>PLU</div>
                  <input
                    type='text'
                    value={filters.plu}
                    onChange={(e) => handleFilterChange('plu', e.target.value)}
                    placeholder='Filter...'
                    className='w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>
              </th>
              {/* Kode Barang */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Kode Barang</div>
                  <input
                    type='text'
                    value={filters.item_code}
                    onChange={(e) => handleFilterChange('item_code', e.target.value)}
                    placeholder='Filter...'
                    className='w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>
              </th>
              {/* Berat */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Berat</div>
                  <div className='h-5'></div>
                </div>
              </th>
              {/* Dimensi */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Dimensi</div>
                  <div className='h-5'></div>
                </div>
              </th>
              {/* Updated */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Updated</div>
                  <div className='h-5'></div>
                </div>
              </th>
              {/* Actions */}
              <th className='px-1.5 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                <div className='space-y-1'>
                  <div>Aksi</div>
                  <div className='h-5'></div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-100'>
            {loading ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className='px-2 py-3 text-center'>
                  <div className='w-6 h-6 mx-auto border-b-2 border-blue-600 rounded-full animate-spin'></div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className='px-2 py-3 text-center text-gray-500 text-xs'>
                  {hasActiveFilters ? 'No items match the filter.' : 'No items found.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const { berat, formattedSize } = resolveDimension(item);
                const companyCode = item.company?.kode_company || '-';
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => onViewDetail(item)}
                    className={`cursor-pointer transition-colors h-8 ${
                      selectedItemId === item.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-900 font-medium'>
                      {companyCode}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-900 truncate' title={item.nama_barang}>
                      {item.nama_barang}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {item.plu}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {item.eanBarcode || item.item_code || 'N/A'}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {berat}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-900'>
                      {formattedSize}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs text-gray-600'>
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className='px-1.5 py-1 whitespace-nowrap text-xs'>
                      <div className='flex space-x-1'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className='p-0.5 text-red-600 hover:text-red-900'
                          title='Delete'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />

      <ConfirmationDialog onConfirm={handleConfirmDelete} />
    </div>
  );
};

export default ItemTable;
