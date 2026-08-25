import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import suratJalanService from '../../services/suratJalanService';
import { formatDate } from '../../utils/formatUtils';

const AddSuratJalanToChecklistModal = ({
  show,
  onClose,
  onAdd,
  existingSuratJalanIds = [],
  companyId = null,
}) => {
  const [suratJalanList, setSuratJalanList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDraftSuratJalan = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,
        limit: 100,
        status_code: 'DRAFT SURAT JALAN',
        checklistSuratJalanId: 'null',
      };

      if (companyId) {
        params.companyId = companyId;
      }

      const response = await suratJalanService.getSuratJalan(params);
      const items =
        response?.data?.data ||
        response?.data?.suratJalan ||
        response?.data ||
        [];

      setSuratJalanList(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to load draft surat jalan:', error);
      setSuratJalanList([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (show) {
      setSearchQuery('');
      setSelectedIds([]);
      loadDraftSuratJalan();
    } else {
      setSelectedIds([]);
      setSuratJalanList([]);
    }
  }, [show, loadDraftSuratJalan]);

  if (!show) return null;

  // Filter out existing and apply search query
  const availableList = suratJalanList.filter(
    (sj) => !existingSuratJalanIds.includes(sj.id)
  );

  const filteredList = availableList.filter((sj) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const noSj = (sj.no_surat_jalan || '').toLowerCase();
    const poNumber = (
      sj.purchaseOrder?.po_number ||
      sj.po_number ||
      sj.no_po ||
      sj.purchase_order?.po_number ||
      ''
    ).toLowerCase();
    const invoiceNumber = (
      sj.invoice?.no_invoice ||
      sj.purchaseOrder?.invoice?.no_invoice ||
      sj.no_invoice ||
      ''
    ).toLowerCase();
    const customer = (
      sj.purchaseOrder?.customer?.namaCustomer ||
      sj.purchaseOrder?.customer?.nama_customer ||
      sj.customer?.namaCustomer ||
      sj.customer?.nama_customer ||
      sj.deliver_to ||
      sj.purchaseOrder?.deliver_to ||
      ''
    ).toLowerCase();
    return (
      noSj.includes(q) ||
      poNumber.includes(q) ||
      invoiceNumber.includes(q) ||
      customer.includes(q)
    );
  });

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((sj) => sj.id));
    }
  };

  const handleConfirmAdd = () => {
    const selectedSjs = availableList.filter((sj) =>
      selectedIds.includes(sj.id)
    );
    if (onAdd && selectedSjs.length > 0) {
      onAdd(selectedSjs);
    }
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4'>
      <div className='w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden'>
        {/* Modal Header */}
        <div className='flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4'>
          <div className='flex items-center space-x-3'>
            <div className='rounded-lg bg-teal-100 p-2'>
              <DocumentPlusIcon className='h-6 w-6 text-teal-600' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-gray-900'>
                Tambah Surat Jalan / PO ke Checklist
              </h3>
              <p className='text-xs text-gray-500'>
                Pilih Surat Jalan berdasarkan Nomor PO atau Nomor Surat Jalan untuk dimasukkan ke checklist
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors'
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        {/* Search Bar */}
        <div className='p-6 border-b border-gray-100 bg-gray-50'>
          <div className='relative'>
            <MagnifyingGlassIcon className='pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Cari nomor PO, nomor surat jalan, atau nama customer...'
              className='w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'
            />
          </div>
        </div>

        {/* Content / Table */}
        <div className='max-h-96 overflow-y-auto p-6'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-teal-600'></div>
              <span className='mt-3 text-sm text-gray-500'>
                Memuat daftar Surat Jalan Draft...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='rounded-full bg-gray-100 p-4 text-gray-400'>
                <DocumentPlusIcon className='h-8 w-8' />
              </div>
              <p className='mt-3 text-sm font-medium text-gray-900'>
                Tidak ada Surat Jalan Draft yang tersedia
              </p>
              <p className='mt-1 text-xs text-gray-500'>
                {searchQuery
                  ? 'Tidak ada data yang sesuai dengan kata kunci pencarian.'
                  : 'Semua Surat Jalan draft sudah terhubung ke checklist atau belum dibuat.'}
              </p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <table className='min-w-full divide-y divide-gray-200 text-left text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th scope='col' className='w-12 px-4 py-3'>
                      <input
                        type='checkbox'
                        checked={
                          filteredList.length > 0 &&
                          selectedIds.length === filteredList.length
                        }
                        onChange={handleSelectAll}
                        className='h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer'
                      />
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      No Surat Jalan
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      No PO
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      Customer / Deliver To
                    </th>
                    <th scope='col' className='px-4 py-3 font-semibold text-gray-700'>
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {filteredList.map((sj) => {
                    const isSelected = selectedIds.includes(sj.id);
                    return (
                      <tr
                        key={sj.id}
                        onClick={() => handleToggleSelect(sj.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className='px-4 py-3' onClick={(e) => e.stopPropagation()}>
                          <input
                            type='checkbox'
                            checked={isSelected}
                            onChange={() => handleToggleSelect(sj.id)}
                            className='h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer'
                          />
                        </td>
                        <td className='px-4 py-3 font-medium text-gray-900'>
                          {sj.no_surat_jalan}
                        </td>
                        <td className='px-4 py-3 text-gray-600'>
                          {sj.purchaseOrder?.po_number || '-'}
                        </td>
                        <td className='px-4 py-3 text-gray-600'>
                          {sj.purchaseOrder?.customer?.namaCustomer ||
                            sj.deliver_to ||
                            '-'}
                        </td>
                        <td className='px-4 py-3 text-gray-500'>
                          {formatDate(sj.tanggal_surat_jalan || sj.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4'>
          <span className='text-xs font-medium text-gray-600'>
            {selectedIds.length} Surat Jalan dipilih
          </span>
          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none'
            >
              Batal
            </button>
            <button
              type='button'
              onClick={handleConfirmAdd}
              disabled={selectedIds.length === 0}
              className='flex items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <CheckCircleIcon className='h-5 w-5' />
              <span>Tambahkan ke Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSuratJalanToChecklistModal;
