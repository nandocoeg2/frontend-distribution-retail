import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Autocomplete from '../common/Autocomplete';
import StockMovementItemsInput from './StockMovementItemsInput.jsx';
import useCompanyAutocomplete from '../../hooks/useCompanyAutocomplete';
import useCustomerSearch from '../../hooks/useCustomerSearch';

const initialFormState = {
  companyId: '',
  customerId: '',
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

  const {
    options: companyOptions,
    loading: companySearchLoading,
    fetchOptions: searchCompanies,
  } = useCompanyAutocomplete({ selectedValue: form.companyId });

  const {
    searchResults: customerResults = [],
    loading: customerSearchLoading,
    searchCustomers,
  } = useCustomerSearch();

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
    setForm((prev) => ({ ...prev, items }));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    const sanitized = value.replace(/^\s+/, '').slice(0, 255);
    setForm((prev) => ({ ...prev, [name]: sanitized }));
  };

  const handleCompanyChange = (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, companyId: value }));
  };

  const handleCustomerChange = (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, customerId: value }));
  };

  const validateForm = () => {
    if (!form.companyId.trim()) return 'Company wajib dipilih.';
    if (!form.customerId.trim()) return 'Customer wajib dipilih.';
    if (!Array.isArray(form.items) || form.items.length === 0)
      return 'Minimal tambahkan satu item.';

    for (let i = 0; i < form.items.length; i += 1) {
      const item = form.items[i];
      if (!(item.itemId || '').trim()) return `Item baris ${i + 1} wajib diisi.`;
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0)
        return `Quantity baris ${i + 1} harus lebih dari 0.`;
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) { setFormError(validationError); return; }

    const payload = {
      companyId: form.companyId.trim(),
      customerId: form.customerId.trim(),
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        itemId: item.itemId.trim(),
        quantity: Number(item.quantity),
      })),
    };
    if (!payload.notes) delete payload.notes;

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setFormError(err?.message || 'Gagal mencatat stock out. Coba lagi nanti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 bg-amber-600 px-5 py-3 text-white'>
          <h2 className='text-base font-semibold'>Stock Out</h2>
          <button
            type='button'
            onClick={onClose}
            className='rounded p-1 hover:bg-white/20 focus:outline-none'
            aria-label='Tutup modal'
          >
            <XMarkIcon className='h-5 w-5' aria-hidden='true' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='max-h-[85vh] overflow-y-auto'>
          {/* Fields */}
          <div className='border-b border-gray-100 px-5 py-4'>
            <div className='grid gap-3 sm:grid-cols-3'>
              <div>
                <label htmlFor='companyId' className='block text-xs font-medium text-gray-600 mb-1'>Company</label>
                <Autocomplete
                  label='' name='companyId' options={companyOptions}
                  value={form.companyId ? String(form.companyId) : ''}
                  onChange={handleCompanyChange} placeholder='Cari company...'
                  displayKey='label' valueKey='id'
                  loading={optionsLoading || companySearchLoading}
                  onSearch={async (q) => { try { await searchCompanies(q); } catch (e) { console.error(e); } }}
                  showId
                />
              </div>
              <div>
                <label htmlFor='customerId' className='block text-xs font-medium text-gray-600 mb-1'>Customer</label>
                <Autocomplete
                  label='' name='customerId' options={customerOptions}
                  value={form.customerId ? String(form.customerId) : ''}
                  onChange={handleCustomerChange} placeholder='Cari customer...'
                  displayKey='label' valueKey='id'
                  loading={optionsLoading || customerSearchLoading}
                  onSearch={async (q) => { try { await searchCustomers(q, 1, 20); } catch (e) { console.error(e); } }}
                  showId
                />
              </div>
              <div>
                <label htmlFor='notes' className='block text-xs font-medium text-gray-600 mb-1'>Catatan</label>
                <input
                  id='notes' name='notes' type='text' maxLength={255}
                  value={form.notes} onChange={handleFieldChange}
                  placeholder='Opsional'
                  className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500'
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className='px-5 py-4'>
            <StockMovementItemsInput
              items={form.items} onChange={handleItemsChange}
              itemCatalog={itemOptions} loading={optionsLoading}
            />
          </div>

          {/* Error */}
          {formError && (
            <div className='mx-5 mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
              {formError}
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3'>
            <button type='button' onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500'>
              Batal
            </button>
            <button type='submit' disabled={isSubmitting}
              className='rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50'>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStockOutModal;
