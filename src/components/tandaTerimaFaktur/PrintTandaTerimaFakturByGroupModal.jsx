import React, { useState, useCallback } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Autocomplete from '@/components/common/Autocomplete';
import groupCustomerService from '@/services/groupCustomerService';
import termOfPaymentService from '@/services/termOfPaymentService';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';
import customerService from '@/services/customerService';
import toastService from '@/services/toastService';

const PrintTandaTerimaFakturByGroupModal = ({ isOpen = false, onClose = () => { } }) => {
  const [groupCustomerId, setGroupCustomerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [termOfPaymentId, setTermOfPaymentId] = useState('');
  const [dateMode, setDateMode] = useState('all');
  const [tanggal, setTanggal] = useState('');
  const [tanggalStart, setTanggalStart] = useState('');
  const [tanggalEnd, setTanggalEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Autocomplete options state
  const [groupCustomerOptions, setGroupCustomerOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [termOfPaymentOptions, setTermOfPaymentOptions] = useState([]);
  const [searchingGroupCustomer, setSearchingGroupCustomer] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [searchingTermOfPayment, setSearchingTermOfPayment] = useState(false);

  // Search group customers
  const handleSearchGroupCustomer = useCallback(async (query) => {
    if (!query) return;
    setSearchingGroupCustomer(true);
    try {
      const response = await groupCustomerService.search(query);
      if (response?.data?.data) {
        setGroupCustomerOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error searching group customers:', error);
    } finally {
      setSearchingGroupCustomer(false);
    }
  }, []);

  // Search customers
  const handleSearchCustomer = useCallback(
    async (query) => {
      if (!query || !groupCustomerId) return;
      setSearchingCustomer(true);
      try {
        const response = await customerService.searchCustomers(query, 1, 20);
        if (response?.data?.data) {
          // Client-side filter if backend doesn't support query param for group in search
          // But our backend now supports groupCustomerId in getAll/search
          // However, searchCustomers endpoint might need update to pass groupCustomerId?
          // Let's use getAllCustomers with options instead for safer filtering
          // Or just rely on search if we assume we updated search to handle it
          // Wait, searchCustomers in frontend service calls /customers/search/:query
          // And backend controller uses params.q or query.q
          // And service.searchCustomers uses OR filters.
          // It doesn't seem to support groupCustomerId in searchCustomersSchema properly?
          // Let's check backend schema again. searchCustomerSchema has query object with q and pagination.
          // It DOES NOT have groupCustomerId.
          // getAllCustomersSchema DOES have groupCustomerId.
          // So we should use getAllCustomers for "searching" with filter

          const response = await customerService.getAllCustomers(1, 20, {
            groupCustomerId,
            q: query // Accessing getAllCustomers which calls /customers with params
            // Wait, frontend getAllCustomers params: page, limit, options
            // options can have groupCustomerId
            // But does it support 'q' or 'search'?
            // Backend getAllCustomersSchema does NOT have 'q' or 'search'. 
            // It has companyId, hasPurchaseOrder etc. 
            // Backend searchCustomersSchema has 'q'.

            // So I can't easily search AND filter by group with current backend implementation of searchCustomers.
            // But wait, I updated getAllCustomers in backend service to support groupCustomerId.
            // I did NOT update searchCustomers to support groupCustomerId.

            // So for now, to ensure I get customers for the group, I should use getAllCustomers
            // But getAllCustomers doesn't do name search.

            // Let's check frontend service again.
            // search: (query, page = 1, limit = 10) -> /customers/search/:query
            // getAllCustomers: (page, limit, options) -> /customers

            // The backend getAllCustomers service method does NOT perform name search.

            // Issue: I can't search by name within a group easily with current backend.
            // I should probably just fetch all customers for the group (pagination might be an issue but usually groups don't have thaaat many consumers?)
            // Or I should request to update searchCustomers too? 

            // For this task, "populate option customernya berdasarkan group customer yang dipilih".
            // It implies listing them. Autocomplete usually implies searching.
            // If I just load initial options based on group, that covers "populate". 
            // If user types, it searches. If searching uses generic search, it might return customers from other groups?
            // Yes.

            // So correct approach:
            // 1. When group is selected, fetch customers for that group (using getAllCustomers with groupCustomerId).
            // 2. Set these as options.
            // 3. If user searches... ideally front-end filtering if list is small, or we need backend support.
            // Given I didn't update searchCustomers endpoint, I should probably stick to fetching by group.

            // Let's implement handleFocusCustomer to fetch by group.
          });
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setSearchingCustomer(false);
      }
    },
    [groupCustomerId]
  );

  // Search term of payments
  const handleSearchTermOfPayment = useCallback(async (query) => {
    if (!query) return;
    setSearchingTermOfPayment(true);
    try {
      const response = await termOfPaymentService.searchTermOfPayments(query);
      if (response?.data?.data) {
        setTermOfPaymentOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error searching term of payments:', error);
    } finally {
      setSearchingTermOfPayment(false);
    }
  }, []);

  // Load initial data on focus
  const handleFocusGroupCustomer = useCallback(async () => {
    if (groupCustomerOptions.length === 0) {
      try {
        const response = await groupCustomerService.getAllGroupCustomers(1, 20);
        if (response?.data?.data) {
          setGroupCustomerOptions(response.data.data);
        }
      } catch (error) {
        console.error('Error loading group customers:', error);
      }
    }
  }, [groupCustomerOptions.length]);

  const handleFocusCustomer = useCallback(async () => {
    if (!groupCustomerId) return;

    // Always refresh when focusing if we have a group allowed
    // Or just if empty? Let's reload to be safe or if options are empty
    setSearchingCustomer(true);
    try {
      // Use getAllCustomers with groupCustomerId filter
      const response = await customerService.getAllCustomers(1, 100, {
        groupCustomerId,
      });
      if (response?.data?.data) {
        setCustomerOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setSearchingCustomer(false);
    }
  }, [groupCustomerId]);

  // Reset customer when group changes
  React.useEffect(() => {
    setCustomerId('');
    setCustomerOptions([]);
    // Optionally fetch immediately
    if (groupCustomerId) {
      handleFocusCustomer();
    }
  }, [groupCustomerId, handleFocusCustomer]);

  const handleFocusTermOfPayment = useCallback(async () => {
    if (termOfPaymentOptions.length === 0) {
      try {
        const response = await termOfPaymentService.getAllTermOfPayments(1, 20);
        if (response?.data?.data) {
          setTermOfPaymentOptions(response.data.data);
        }
      } catch (error) {
        console.error('Error loading term of payments:', error);
      }
    }
  }, [termOfPaymentOptions.length]);

  const handleDateModeChange = useCallback((mode) => {
    setDateMode(mode);
    if (mode === 'all') {
      setTanggal('');
      setTanggalStart('');
      setTanggalEnd('');
    } else if (mode === 'single') {
      setTanggalStart('');
      setTanggalEnd('');
    } else if (mode === 'range') {
      setTanggal('');
    }
  }, []);

  const handlePrint = async () => {
    if (!groupCustomerId || !termOfPaymentId || !customerId) {
      toastService.error('Group Customer, Customer, dan Term of Payment harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        groupCustomerId,
        termOfPaymentId,
        customerId,
      };

      // Add date filters based on mode
      if (dateMode === 'single' && tanggal) {
        params.tanggal = tanggal;
      } else if (dateMode === 'range') {
        if (tanggalStart) params.tanggal_start = tanggalStart;
        if (tanggalEnd) params.tanggal_end = tanggalEnd;
      }

      const html = await tandaTerimaFakturService.exportByGroup(params);

      // Open HTML in new window and trigger print
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);

      toastService.success('Berhasil membuka dokumen untuk dicetak');

      // Close modal after successful print
      onClose();
    } catch (error) {
      console.error('Error printing tanda terima faktur:', error);
      toastService.error(error.message || 'Gagal mencetak tanda terima faktur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setGroupCustomerId('');
    setCustomerId('');
    setTermOfPaymentId('');
    setDateMode('all');
    setTanggal('');
    setTanggalStart('');
    setTanggalEnd('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Print Tanda Terima Faktur By Group dan TOP
            </h2>
            <p className='text-sm text-gray-500'>
              Isi parameter untuk mencetak tanda terima faktur
            </p>
          </div>
          <button
            type='button'
            onClick={handleCloseModal}
            className='p-2 text-gray-500 transition rounded-lg hover:text-gray-700 hover:bg-gray-100'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 px-6 py-4 overflow-y-auto'>
          <div className='space-y-4'>
            {/* Group Customer */}
            <Autocomplete
              label='Group Customer'
              placeholder='Cari group customer...'
              options={groupCustomerOptions}
              value={groupCustomerId}
              onChange={(e) => setGroupCustomerId(e.target.value)}
              displayKey='nama_group'
              valueKey='id'
              required
              onSearch={handleSearchGroupCustomer}
              onFocus={handleFocusGroupCustomer}
              loading={searchingGroupCustomer}
              showId={true}
            />

            {/* Customer */}
            <Autocomplete
              label='Customer'
              placeholder={groupCustomerId ? 'Pilih customer...' : 'Pilih group customer terlebih dahulu'}
              options={customerOptions}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              displayKey='namaCustomer'
              valueKey='id'
              required
              onFocus={handleFocusCustomer}
              loading={searchingCustomer}
              showId={true}
              disabled={!groupCustomerId}
            />

            {/* Term of Payment */}
            <Autocomplete
              label='Term of Payment'
              placeholder='Cari term of payment...'
              options={termOfPaymentOptions}
              value={termOfPaymentId}
              onChange={(e) => setTermOfPaymentId(e.target.value)}
              displayKey='kode_top'
              valueKey='id'
              required
              onSearch={handleSearchTermOfPayment}
              onFocus={handleFocusTermOfPayment}
              loading={searchingTermOfPayment}
              showId={true}
            />

            {/* Date Filter Mode */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Mode Filter Tanggal
              </label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => handleDateModeChange('all')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${dateMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Semua
                </button>
                <button
                  type='button'
                  onClick={() => handleDateModeChange('single')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${dateMode === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Tanggal Spesifik
                </button>
                <button
                  type='button'
                  onClick={() => handleDateModeChange('range')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${dateMode === 'range'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Range Tanggal
                </button>
              </div>
            </div>

            {/* Date Inputs */}
            {dateMode === 'single' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tanggal
                </label>
                <input
                  type='date'
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}

            {dateMode === 'range' && (
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tanggal Mulai
                  </label>
                  <input
                    type='date'
                    value={tanggalStart}
                    onChange={(e) => setTanggalStart(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tanggal Akhir
                  </label>
                  <input
                    type='date'
                    value={tanggalEnd}
                    onChange={(e) => setTanggalEnd(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50'>
          <button
            onClick={handleCloseModal}
            className='px-4 py-2 text-sm font-medium text-gray-700 transition border border-gray-300 rounded-md hover:bg-gray-100'
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
            disabled={isLoading || !groupCustomerId || !termOfPaymentId || !customerId}
          >
            {isLoading ? (
              <>
                <div className='w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin'></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <PrinterIcon className='w-5 h-5' />
                <span>Print</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintTandaTerimaFakturByGroupModal;
