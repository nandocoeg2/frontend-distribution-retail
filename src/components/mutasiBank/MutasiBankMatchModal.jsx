import React, { useMemo, useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  LinkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

const SUGGESTION_LABELS = {
  invoice_pengiriman: 'Invoice Pengiriman',
  invoice_penagihan: 'Invoice Penagihan',
  tanda_terima_faktur: 'Tanda Terima Faktur',
  ttf: 'Tanda Terima Faktur',
  shipment_invoice: 'Invoice Pengiriman',
  billing_invoice: 'Invoice Penagihan',
};

const toCamelCase = (value = '') =>
  value.replace(/[_-](\w)/g, (_, letter) => letter.toUpperCase());

const toSnakeCase = (value = '') =>
  value
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');

const getNestedValue = (source, path) => {
  if (!source || !path) {
    return undefined;
  }

  const segments = path.split('.');
  let current = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
      continue;
    }

    const camelSegment = toCamelCase(segment);
    if (Object.prototype.hasOwnProperty.call(current, camelSegment)) {
      current = current[camelSegment];
      continue;
    }

    const snakeSegment = toSnakeCase(segment);
    if (Object.prototype.hasOwnProperty.call(current, snakeSegment)) {
      current = current[snakeSegment];
      continue;
    }

    return undefined;
  }

  return current;
};

const getFirstValue = (source, paths = []) => {
  if (!source || !Array.isArray(paths)) {
    return undefined;
  }

  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const resolveSuggestionId = (suggestion) => {
  return (
    suggestion?.id ??
    suggestion?.invoiceId ??
    suggestion?.documentId ??
    suggestion?.uuid ??
    suggestion?._id ??
    null
  );
};

const resolveSuggestionLabel = (suggestion) => {
  return (
    getFirstValue(suggestion, [
      'number',
      'document_number',
      'invoice_number',
      'kode',
      'nomor',
      'reference',
    ]) || resolveSuggestionId(suggestion) || 'Dokumen'
  );
};

const resolveSuggestionDate = (suggestion) => {
  return (
    getFirstValue(suggestion, [
      'tanggal',
      'tanggal_dokumen',
      'document_date',
      'invoice_date',
      'date',
      'created_at',
    ]) || null
  );
};

const resolveSuggestionAmount = (suggestion) => {
  return (
    Number(
      getFirstValue(suggestion, [
        'total',
        'amount',
        'nominal',
        'grand_total',
        'total_amount',
      ]) || 0
    ) || 0
  );
};

const normalizeSuggestions = (rawSuggestions) => {
  if (!rawSuggestions) {
    return [];
  }

  const baseData =
    typeof rawSuggestions === 'object' && rawSuggestions.data
      ? rawSuggestions.data
      : rawSuggestions;

  const groupsMap = new Map();

  const addToGroup = (type, item) => {
    if (!type) {
      return;
    }

    const normalizedType = type.toLowerCase();
    if (!groupsMap.has(normalizedType)) {
      groupsMap.set(normalizedType, []);
    }

    groupsMap.get(normalizedType).push(item);
  };

  if (Array.isArray(baseData)) {
    baseData.forEach((item) => {
      const type =
        item?.type ||
        item?.documentType ||
        item?.document_type ||
        item?.category ||
        'lainnya';
      addToGroup(type, item);
    });
  } else if (typeof baseData === 'object' && baseData !== null) {
    Object.entries(baseData).forEach(([type, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => addToGroup(type, item));
      } else if (items) {
        addToGroup(type, items);
      }
    });
  }

  const result = Array.from(groupsMap.entries()).map(([type, items]) => ({
    type,
    label: SUGGESTION_LABELS[type] || type.replace(/[_-]/g, ' ').toUpperCase(),
    items,
  }));

  return result.sort((first, second) => first.label.localeCompare(second.label));
};

const MutasiBankMatchModal = ({
  open,
  onClose,
  suggestions,
  loading = false,
  onMatch,
  onRefresh,
  isMatching = false,
}) => {
  const [manualType, setManualType] = useState('invoice_penagihan');
  const [manualDocumentId, setManualDocumentId] = useState('');

  useEffect(() => {
    if (open) {
      setManualType('invoice_penagihan');
      setManualDocumentId('');
    }
  }, [open]);

  const suggestionGroups = useMemo(
    () => (open ? normalizeSuggestions(suggestions) : []),
    [suggestions, open]
  );

  if (!open) {
    return null;
  }

  const handleMatch = (type, documentId) => {
    if (!type || !documentId) {
      return;
    }
    onMatch?.({ type, invoiceId: documentId });
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    if (!manualDocumentId) {
      return;
    }
    onMatch?.({ type: manualType, invoiceId: manualDocumentId });
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Pencocokan Mutasi Bank
            </h2>
            <p className='text-sm text-gray-500'>
              Pilih dokumen yang ingin dihubungkan atau masukkan secara manual.
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              type='button'
              onClick={onRefresh}
              className='rounded-md p-2 text-blue-600 hover:bg-blue-50'
              aria-label='Segarkan saran'
              disabled={loading}
            >
              <ArrowPathIcon className='h-5 w-5' />
            </button>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md p-2 hover:bg-gray-100'
              aria-label='Tutup'
              disabled={isMatching}
            >
              <XMarkIcon className='h-5 w-5 text-gray-500' />
            </button>
          </div>
        </div>

        <div className='max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6'>
          {loading ? (
            <div className='flex items-center justify-center py-10 text-gray-500'>
              <div className='mr-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
              Memuat saran dokumen...
            </div>
          ) : (
            <>
              {suggestionGroups.length > 0 ? (
                suggestionGroups.map((group) => (
                  <section key={group.type} className='space-y-3'>
                    <h3 className='text-sm font-semibold text-gray-800'>
                      {group.label}
                    </h3>
                    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                      {group.items.map((item) => {
                        const documentId = resolveSuggestionId(item);
                        const label = resolveSuggestionLabel(item);
                        const date = resolveSuggestionDate(item);
                        const amount = resolveSuggestionAmount(item);

                        return (
                          <div
                            key={`${group.type}-${documentId}`}
                            className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
                          >
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='text-sm font-semibold text-gray-900'>
                                  {label}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  ID: {documentId}
                                </p>
                              </div>
                              {date ? (
                                <span className='text-xs text-gray-400'>
                                  {formatDate(date)}
                                </span>
                              ) : null}
                            </div>
                            {amount ? (
                              <p className='mt-2 text-sm font-medium text-gray-700'>
                                {formatCurrency(amount)}
                              </p>
                            ) : null}
                            <button
                              type='button'
                              onClick={() => handleMatch(group.type, documentId)}
                              disabled={isMatching}
                              className='mt-4 inline-flex items-center rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-60'
                            >
                              <LinkIcon className='mr-2 h-4 w-4' />
                              Hubungkan
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                  Tidak ditemukan saran dokumen otomatis. Anda dapat memasukkan
                  dokumen secara manual di bawah ini.
                </div>
              )}

              <section className='rounded-lg border border-gray-200 p-4'>
                <h3 className='text-sm font-semibold text-gray-800'>
                  Hubungkan Manual
                </h3>
                <form
                  onSubmit={handleManualSubmit}
                  className='mt-3 grid grid-cols-1 gap-4 md:grid-cols-2'
                >
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Jenis Dokumen
                    </label>
                    <select
                      value={manualType}
                      onChange={(event) => setManualType(event.target.value)}
                      className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isMatching}
                    >
                      <option value='invoice_penagihan'>
                        Invoice Penagihan
                      </option>
                      <option value='invoice_pengiriman'>
                        Invoice Pengiriman
                      </option>
                      <option value='tanda_terima_faktur'>
                        Tanda Terima Faktur
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      ID Dokumen
                    </label>
                    <input
                      type='text'
                      value={manualDocumentId}
                      onChange={(event) => setManualDocumentId(event.target.value)}
                      placeholder='Masukkan ID dokumen'
                      className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      disabled={isMatching}
                    />
                  </div>

                  <div className='md:col-span-2 flex justify-end'>
                    <button
                      type='submit'
                      disabled={!manualDocumentId || isMatching}
                      className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300'
                    >
                      <DocumentTextIcon className='mr-2 h-4 w-4' />
                      Hubungkan Dokumen
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>

        <div className='flex items-center justify-end border-t border-gray-200 px-6 py-4'>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300'
            disabled={isMatching}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default MutasiBankMatchModal;
