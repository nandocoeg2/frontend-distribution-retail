import React, { useState } from 'react';
import {
  DocumentTextIcon,
  XMarkIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import toastService from '../../services/toastService';
import InvoicePengirimanForm from './InvoicePengirimanForm';
import InvoicePengirimanDetailsTable from './InvoicePengirimanDetailsTable';

const InvoicePengirimanDetailCard = ({ invoice, onClose, loading = false, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await invoicePengirimanService.updateInvoicePengiriman(invoice.id, formData);
      toastService.success('Invoice pengiriman berhasil diperbarui');
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toastService.error(error.message || 'Gagal memperbarui invoice');
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className='bg-white shadow rounded-lg p-3 mt-3'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          <DocumentTextIcon className='h-4 w-4 text-indigo-600' />
          <div>
            <h2 className='text-sm font-bold text-gray-900'>Invoice Pengiriman</h2>
            <div className='flex items-center gap-1'>
              <p className='text-xs text-gray-600'>{invoice?.no_invoice || '-'}</p>
              {invoice?.no_invoice && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invoice.no_invoice);
                    toastService.success(`No Invoice ${invoice.no_invoice} disalin`);
                  }}
                  className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Salin No Invoice"
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {!isEditMode ? (
            <>
              <button onClick={handleEditClick} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700'>
                <PencilIcon className='w-3 h-3 mr-1' />Edit
              </button>
              {onClose && (
                <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded' title='Close'>
                  <XMarkIcon className='w-4 h-4 text-gray-500' />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} disabled={saving} className='px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50'>Batal</button>
              <button type='submit' form='invoice-pengiriman-form' disabled={saving} className='px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                {saving ? '...' : 'Simpan'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-4'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-xs text-gray-600'>Loading...</span>
        </div>
      ) : isEditMode ? (
        <div className='bg-gray-50 rounded p-3'>
          <InvoicePengirimanForm
            initialValues={invoice}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={saving}
            formId="invoice-pengiriman-form"
          />
        </div>
      ) : (
        <div className='overflow-hidden bg-white border border-gray-200 rounded'>
          <InvoicePengirimanDetailsTable details={invoice.invoiceDetails || []} />
        </div>
      )}
    </div>
  );
};

export default InvoicePengirimanDetailCard;
