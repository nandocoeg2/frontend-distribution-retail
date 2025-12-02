import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import StockMovementItemsInput from './StockMovementItemsInput.jsx';
import useCompanyAutocomplete from '../../hooks/useCompanyAutocomplete';
import useCustomerSearch from '../../hooks/useCustomerSearch';

const initialFormState = {
  companyId: '', // Company that owns products
  customerId: '', // Customer who receives goods
  notes: '',
  items: [{ itemId: '', quantity: '' }],
};

const CreateStockOutModal = ({
  show,
  onClose,
  onSubmit,
  itemOptions = [],
  optionsLoading = false,
}) => {
  const [form, setForm] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Company autocomplete (company that owns products)
  const {
    options: companyOptions,
    loading: companySearchLoading,
    fetchOptions: searchCompanies,
  } = useCompanyAutocomplete({ selectedValue: form.companyId });

  // Customer autocomplete (customer who receives goods)
  const {
    searchResults: customerResults = [],
    loading: customerSearchLoading,
    searchCustomers,
  } = useCustomerSearch();

  // Format customer options for Autocomplete
  const customerOptions = customerResults.map((customer) => ({
    id: customer.id,
    label: customer.namaCustomer,
    code: customer.kodeCustomer,
  }));

  useEffect(() => {
    if (show) {
      setForm(initialFormState);
      setFormError('');
      setIsSubmitting(false);
    }
  }, [show]);

  const handleItemsChange = (items) => {
    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanyChange = (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({
      ...prev,
      companyId: value,
    }));
  };

  const handleCustomerChange = (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({
      ...prev,
      customerId: value,
    }));
  };

  const validateForm = () => {
    const companyId = form.companyId.trim();
    if (!companyId) {
      return 'Company wajib dipilih.';
    }

    const customerId = form.customerId.trim();
    if (!customerId) {
      return 'Customer wajib dipilih.';
    }

    if (!Array.isArray(form.items) || form.items.length === 0) {
      return 'Minimal tambahkan satu item.';
    }

    for (let index = 0; index < form.items.length; index += 1) {
      const item = form.items[index];
      const itemId = (item.itemId || '').trim();
      const quantity = Number(item.quantity);

      if (!itemId) {
        return `Item pada baris ${index + 1} wajib diisi.`;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return `Quantity pada baris ${index + 1} harus lebih dari 0.`;
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      companyId: form.companyId.trim(),
      customerId: form.customerId.trim(),
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        itemId: item.itemId.trim(),
        quantity: Number(item.quantity),
      })),
    };

    if (!payload.notes) {
      delete payload.notes;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message =
        err?.message || 'Gagal mencatat stock out. Coba lagi nanti.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5'>
        <div className='flex items-start justify-between border-b border-amber-100 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 px-6 py-5 text-white'>
          <div>
            <h2 className='text-xl font-semibold'>Catat Stock Out</h2>
            <p className='mt-1 text-xs text-amber-100'>
              Lengkapi informasi pengeluaran stok sebelum menyimpan perubahan.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full bg-white/10 p-2 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60'
            aria-label='Tutup modal'
          >
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6'
        >
          <section className='rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm'>
            <div className='grid gap-4 sm:grid-cols-2'>
              {/* Company Selector */}
              <div className='flex flex-col'>
                <label
                  htmlFor='companyId'
                  className='text-sm font-medium text-gray-700'
                >
                  Pilih Company
                </label>
                <Autocomplete
                  label=''
                  name='companyId'
                  options={companyOptions}
                  value={form.companyId ? String(form.companyId) : ''}
                  onChange={handleCompanyChange}
                  placeholder='Cari nama atau ID company'
                  displayKey='label'
                  valueKey='id'
                  loading={optionsLoading || companySearchLoading}
                  onSearch={async (query) => {
                    try {
                      await searchCompanies(query);
                    } catch (error) {
                      console.error('Failed to search companies:', error);
                    }
                  }}
                  showId
                  className='mt-2'
                />
                <p className='mt-2 text-xs text-gray-500'>
                  Company yang memiliki/mengelola produk.
                </p>
              </div>

              {/* Customer Selector */}
              <div className='flex flex-col'>
                <label
                  htmlFor='customerId'
                  className='text-sm font-medium text-gray-700'
                >
                  Pilih Customer
                </label>
                <Autocomplete
                  label=''
                  name='customerId'
                  options={customerOptions}
                  value={form.customerId ? String(form.customerId) : ''}
                  onChange={handleCustomerChange}
                  placeholder='Cari nama atau kode customer'
                  displayKey='label'
                  valueKey='id'
                  loading={optionsLoading || customerSearchLoading}
                  onSearch={async (query) => {
                    try {
                      await searchCustomers(query, 1, 20);
                    } catch (error) {
                      console.error('Failed to search customers:', error);
                    }
                  }}
                  showId
                  className='mt-2'
                />
                <p className='mt-2 text-xs text-gray-500'>
                  Customer yang menerima barang.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className='mt-4 flex flex-col'>
                <label
                  htmlFor='notes'
                  className='text-sm font-medium text-gray-700'
                >
                  Catatan Pengeluaran
                </label>
                <textarea
                  id='notes'
                  name='notes'
                  rows={4}
                  value={form.notes}
                  onChange={handleFieldChange}
                  placeholder='Contoh: Pengiriman ke customer untuk pesanan #123'
                  className='mt-2 block h-full w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500'
                />
                <p className='mt-2 text-xs text-gray-500'>
                  Opsional, gunakan untuk menyimpan catatan pengiriman atau info tambahan.
                </p>
              </div>
          </section>

          <StockMovementItemsInput
            items={form.items}
            onChange={handleItemsChange}
            itemCatalog={itemOptions}
            loading={optionsLoading}
          />

          {formError && (
            <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm'>
              {formError}
            </div>
          )}

          <div className='flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4'>
            <button
              type='button'
              onClick={onClose}
              className='inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
            >
              Batalkan
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex items-center justify-center rounded-xl border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStockOutModal;
