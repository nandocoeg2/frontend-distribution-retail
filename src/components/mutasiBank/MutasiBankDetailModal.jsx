import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';

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

    const lowerSegment = segment.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(current, lowerSegment)) {
      current = current[lowerSegment];
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

const statusVariant = (status) => {
  const value = typeof status === 'string' ? status.toUpperCase() : '';

  if (value.includes('VALID')) {
    return 'success';
  }

  if (value.includes('INVALID')) {
    return 'danger';
  }

  if (value.includes('PENDING') || value.includes('UNMATCH')) {
    return 'warning';
  }

  return 'info';
};

const MutasiBankDetailModal = ({
  open,
  onClose,
  mutation,
  loading = false,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowRaw(false);
    }
  }, [open]);

  const detail = useMemo(() => {
    if (!open || !mutation) {
      return null;
    }

    if (mutation?.data) {
      return mutation.data;
    }

    return mutation;
  }, [mutation, open]);

  const transactionDate = getFirstValue(detail, [
    'transaction_date',
    'transactionDate',
    'tanggal_transaksi',
  ]);
  const mutationType =
    getFirstValue(detail, ['mutation_type', 'mutationType']) || '-';
  const mutationStatus =
    getFirstValue(detail, [
      'validation_status',
      'validationStatus',
      'status',
    ]) || '-';
  const mutationAmount =
    getFirstValue(detail, ['amount', 'nominal', 'total_amount']) || 0;
  const mutationNotes = getFirstValue(detail, ['notes', 'catatan']) || '';
  const bankCode =
    getFirstValue(detail, ['bank_code', 'bankCode']) || 'Tidak diketahui';
  const referenceNumber =
    getFirstValue(detail, [
      'reference_number',
      'referenceNumber',
      'nomor_referensi',
    ]) || '-';
  const batchNumber =
    getFirstValue(detail, ['batch_number', 'batchNumber']) || '-';
  const accountNumber =
    getFirstValue(detail, [
      'account_number',
      'accountNumber',
      'bank_account',
      'bankAccount',
    ]) || '-';

  const matchedDocument = useMemo(() => {
    if (!detail) {
      return null;
    }

    const matched = getFirstValue(detail, [
      'matched_document',
      'matchedDocument',
      'document',
      'matched',
    ]);

    if (!matched) {
      return null;
    }

    return {
      type:
        getFirstValue(matched, ['type', 'document_type', 'documentType']) ||
        'Dokumen',
      number:
        getFirstValue(matched, [
          'number',
          'document_number',
          'invoice_number',
        ]) || '-',
      amount: getFirstValue(matched, ['amount', 'total']) || null,
      status:
        getFirstValue(matched, ['status', 'payment_status', 'status_name']) ||
        '-',
      additional: matched,
    };
  }, [detail]);

  const auditTrail = useMemo(() => {
    const audit =
      getFirstValue(detail, ['audit_logs', 'auditLogs', 'history']) || [];
    if (Array.isArray(audit)) {
      return audit;
    }

    return [];
  }, [detail]);

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4'>
      <div className='w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Detail Mutasi Bank
            </h2>
            <p className='text-sm text-gray-500'>
              Periksa informasi lengkap mutasi dan histori pencocokan.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md p-2 hover:bg-gray-100'
            aria-label='Tutup'
          >
            <XMarkIcon className='h-5 w-5 text-gray-500' />
          </button>
        </div>

        <div className='max-h-[75vh] overflow-y-auto px-6 py-5 space-y-6'>
          {loading ? (
            <div className='flex items-center justify-center py-10 text-gray-500'>
              <div className='mr-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
              Memuat detail mutasi bank...
            </div>
          ) : (
            <>
              <section>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs uppercase text-gray-500'>
                      Tanggal Transaksi
                    </p>
                    <p className='mt-1 text-base font-semibold text-gray-900'>
                      {transactionDate ? formatDate(transactionDate) : '-'}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs uppercase text-gray-500'>
                      Nominal
                    </p>
                    <p className='mt-1 text-base font-semibold text-gray-900'>
                      {formatCurrency(Number(mutationAmount) || 0)}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs uppercase text-gray-500'>
                      Jenis Mutasi
                    </p>
                    <p className='mt-1 text-base font-semibold text-gray-900'>
                      {mutationType}
                    </p>
                  </div>
                  <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    <p className='text-xs uppercase text-gray-500'>
                      Status Validasi
                    </p>
                    <div className='mt-1'>
                      <StatusBadge
                        status={mutationStatus}
                        variant={statusVariant(mutationStatus)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='rounded-lg border border-gray-200 p-4'>
                  <h3 className='text-sm font-semibold text-gray-800'>
                    Informasi Rekening
                  </h3>
                  <dl className='mt-3 space-y-2 text-sm text-gray-600'>
                    <div className='flex justify-between'>
                      <dt className='text-gray-500'>Kode Bank</dt>
                      <dd className='font-medium text-gray-800'>{bankCode}</dd>
                    </div>
                    <div className='flex justify-between'>
                      <dt className='text-gray-500'>Nomor Rekening</dt>
                      <dd className='font-medium text-gray-800'>
                        {accountNumber}
                      </dd>
                    </div>
                    <div className='flex justify-between'>
                      <dt className='text-gray-500'>Nomor Referensi</dt>
                      <dd className='font-medium text-gray-800'>
                        {referenceNumber}
                      </dd>
                    </div>
                    <div className='flex justify-between'>
                      <dt className='text-gray-500'>Nomor Batch</dt>
                      <dd className='font-medium text-gray-800'>
                        {batchNumber}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className='rounded-lg border border-gray-200 p-4'>
                  <h3 className='text-sm font-semibold text-gray-800'>
                    Catatan
                  </h3>
                  <p className='mt-3 text-sm text-gray-600'>
                    {mutationNotes || 'Tidak ada catatan tambahan.'}
                  </p>
                </div>
              </section>

              <section className='rounded-lg border border-gray-200 p-4'>
                <h3 className='text-sm font-semibold text-gray-800'>
                  Dokumen Terkait
                </h3>
                {matchedDocument ? (
                  <div className='mt-3 grid gap-3 text-sm text-gray-600'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Jenis Dokumen</span>
                      <span className='font-semibold text-gray-800'>
                        {matchedDocument.type}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Nomor Dokumen</span>
                      <span className='font-semibold text-gray-800'>
                        {matchedDocument.number}
                      </span>
                    </div>
                    {matchedDocument.amount ? (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Nominal Dokumen</span>
                        <span className='font-semibold text-gray-800'>
                          {formatCurrency(Number(matchedDocument.amount) || 0)}
                        </span>
                      </div>
                    ) : null}
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Status</span>
                      <StatusBadge
                        status={matchedDocument.status}
                        variant={statusVariant(matchedDocument.status)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className='mt-3 text-sm text-gray-500'>
                    Mutasi belum terhubung dengan dokumen apa pun.
                  </p>
                )}
              </section>

              {auditTrail.length > 0 ? (
                <section className='rounded-lg border border-gray-200 p-4'>
                  <h3 className='text-sm font-semibold text-gray-800'>
                    Riwayat Aktivitas
                  </h3>
                  <ul className='mt-4 space-y-3'>
                    {auditTrail.map((entry, index) => {
                      const actor =
                        getFirstValue(entry, ['user', 'actor', 'performedBy']) ||
                        'Sistem';
                      const action =
                        getFirstValue(entry, ['action', 'event']) || 'Perubahan';
                      const timestamp =
                        getFirstValue(entry, ['timestamp', 'created_at']) || null;
                      const detailMessage =
                        getFirstValue(entry, ['message', 'notes', 'detail']) ||
                        '';

                      return (
                        <li
                          key={`${action}-${index}`}
                          className='flex items-start space-x-3 rounded-md border border-gray-100 bg-gray-50 p-3'
                        >
                          <ClockIcon className='h-5 w-5 text-gray-400' />
                          <div className='flex-1 text-sm text-gray-700'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <span className='font-semibold text-gray-900'>
                                {action}
                              </span>
                              <span className='text-xs text-gray-500'>
                                oleh {actor}
                              </span>
                              {timestamp ? (
                                <span className='text-xs text-gray-400'>
                                  {formatDateTime(timestamp)}
                                </span>
                              ) : null}
                            </div>
                            {detailMessage ? (
                              <p className='mt-1 text-gray-600'>{detailMessage}</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              <section className='rounded-lg border border-gray-200 p-4'>
                <button
                  type='button'
                  onClick={() => setShowRaw((prev) => !prev)}
                  className='text-sm font-medium text-blue-600 hover:text-blue-800'
                >
                  {showRaw ? 'Sembunyikan detail teknis' : 'Tampilkan detail teknis'}
                </button>
                {showRaw ? (
                  <pre className='mt-3 max-h-64 overflow-y-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100'>
                    {JSON.stringify(mutation, null, 2)}
                  </pre>
                ) : null}
              </section>
            </>
          )}
        </div>

        <div className='flex items-center justify-end border-t border-gray-200 px-6 py-4'>
          <button
            type='button'
            onClick={onClose}
            className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default MutasiBankDetailModal;
