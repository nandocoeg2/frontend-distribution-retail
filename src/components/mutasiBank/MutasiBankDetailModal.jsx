import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, DocumentIcon, UserIcon, DocumentTextIcon, BuildingLibraryIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { StatusBadge } from '../ui/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatUtils';
import ActivityTimeline from '../common/ActivityTimeline';

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

  const transactionDate = detail?.tanggal_transaksi;
  const mutationType = detail?.mutation_type || '-';
  const mutationStatus = detail?.validation_status || '-';
  const mutationAmount = detail?.jumlah || 0;
  const mutationNotes = detail?.keterangan || '';
  const bankCode = detail?.bank_code || '-';
  const referenceNumber = detail?.nomor_referensi || '-';
  const batchNumber = detail?.batch_number || '-';
  const accountNumber = detail?.accountNumber || detail?.account_number || '-';
  const cabang = detail?.cabang || '-';
  const saldo = detail?.saldo || 0;

  const customer = detail?.customer;
  const fileUploaded = detail?.fileUploaded;

  const matchedDocument = useMemo(() => {
    if (!detail) return null;

    if (detail.invoicePenagihan) {
      return {
        type: 'Invoice Penagihan',
        number: detail.invoicePenagihan.id || detail.invoicePenagihan.nomor_invoice || '-',
        amount: detail.invoicePenagihan.grandTotal || null,
        status: detail.invoicePenagihan.status?.name || detail.invoicePenagihan.status || '-',
        additional: detail.invoicePenagihan,
      };
    }

    if (detail.invoicePengiriman) {
      return {
        type: 'Invoice Pengiriman',
        number: detail.invoicePengiriman.id || detail.invoicePengiriman.nomor_invoice || '-',
        amount: detail.invoicePengiriman.grandTotal || null,
        status: detail.invoicePengiriman.status?.name || detail.invoicePengiriman.status || '-',
        additional: detail.invoicePengiriman,
      };
    }

    if (detail.tandaTerimaFaktur) {
      return {
        type: 'Tanda Terima Faktur',
        number: detail.tandaTerimaFaktur.id || detail.tandaTerimaFaktur.nomor_ttf || '-',
        amount: detail.tandaTerimaFaktur.totalAmount || null,
        status: detail.tandaTerimaFaktur.status?.name || detail.tandaTerimaFaktur.status || '-',
        additional: detail.tandaTerimaFaktur,
      };
    }

    return null;
  }, [detail]);

  const auditTrails = useMemo(() => {
    const audit = detail?.auditTrails || [];
    if (Array.isArray(audit)) {
      return audit;
    }
    return [];
  }, [detail]);

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-6'>
      <div className='w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-3 bg-white sticky top-0 z-10'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
              <BanknotesIcon className='w-5 h-5 text-blue-600' />
              Detail Transaksi Mutasi Bank
            </h2>
          </div>
          <div className='flex items-center gap-3'>
            <StatusBadge
              status={mutationStatus}
              variant={statusVariant(mutationStatus)}
            />
            <button
              type='button'
              onClick={onClose}
              className='rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors'
              aria-label='Tutup'
            >
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='overflow-y-auto px-6 py-4 space-y-4 bg-gray-50/30 flex-1'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
              <div className='mb-3 h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600'></div>
              <p className='text-sm font-medium'>Memuat detail mutasi bank...</p>
            </div>
          ) : (
            <>
              {/* Top Cards - Key Info */}
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-sm'>
                  <p className='text-xs font-medium text-gray-500'>Nominal Transaksi</p>
                  <p className='mt-1 text-lg font-bold text-gray-900'>
                    {formatCurrency(Number(mutationAmount) || 0)}
                  </p>
                </div>

                <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-sm'>
                  <p className='text-xs font-medium text-gray-500'>Tanggal Transaksi</p>
                  <p className='mt-1 text-lg font-bold text-gray-900'>
                    {transactionDate ? formatDate(transactionDate) : '-'}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                {/* Left Column - Details */}
                <div className='lg:col-span-2 space-y-4'>
                  {/* Notes / Description */}
                  <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                    <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center gap-2'>
                      <DocumentTextIcon className='w-4 h-4 text-gray-500' />
                      <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Keterangan Transaksi</h3>
                    </div>
                    <div className='p-3'>
                      <p className='text-sm text-gray-800 leading-relaxed font-mono bg-gray-50 p-2.5 rounded border border-gray-100'>
                        {mutationNotes || 'Tidak ada keterangan.'}
                      </p>
                    </div>
                  </div>

                  {/* Reference Information */}
                  <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                    <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center gap-2'>
                      <BuildingLibraryIcon className='w-4 h-4 text-gray-500' />
                      <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Informasi Referensi Bank</h3>
                    </div>
                    <div className='p-0'>
                      <table className='w-full text-xs text-left'>
                        <tbody className='divide-y divide-gray-100'>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Kode Bank</th>
                            <td className='px-4 py-2 text-gray-900'>{bankCode}</td>
                          </tr>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Cabang</th>
                            <td className='px-4 py-2 text-gray-900'>{cabang}</td>
                          </tr>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Nomor Rekening</th>
                            <td className='px-4 py-2 text-gray-900'>{accountNumber}</td>
                          </tr>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Nomor Referensi</th>
                            <td className='px-4 py-2 text-gray-900 font-mono'>{referenceNumber}</td>
                          </tr>
                          <tr className='hover:bg-gray-50 transition-colors'>
                            <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Batch Upload</th>
                            <td className='px-4 py-2 text-gray-900 font-mono'>{batchNumber}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Customer Information (if available) */}
                  {customer && (
                    <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                      <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center gap-2'>
                        <UserIcon className='w-4 h-4 text-gray-500' />
                        <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Informasi Pelanggan</h3>
                      </div>
                      <div className='p-0'>
                        <table className='w-full text-xs text-left'>
                          <tbody className='divide-y divide-gray-100'>
                            <tr className='hover:bg-gray-50 transition-colors'>
                              <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Nama Customer</th>
                              <td className='px-4 py-2 font-semibold text-blue-700'>{customer.namaCustomer}</td>
                            </tr>
                            <tr className='hover:bg-gray-50 transition-colors'>
                              <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Kode Customer</th>
                              <td className='px-4 py-2 text-gray-900'>{customer.kodeCustomer}</td>
                            </tr>
                            <tr className='hover:bg-gray-50 transition-colors'>
                              <th className='px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50/30'>Wilayah</th>
                              <td className='px-4 py-2 text-gray-900'>{customer.region || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column - Sidebar */}
                <div className='space-y-4'>
                  {/* Connected Document */}
                  <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                    <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center gap-2'>
                      <DocumentIcon className='w-4 h-4 text-gray-500' />
                      <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Dokumen Terhubung</h3>
                    </div>
                    <div className='p-3'>
                      {matchedDocument ? (
                        <div className='p-3 rounded bg-blue-50 border border-blue-100'>
                          <span className='text-xs font-semibold text-blue-900'>{matchedDocument.type}</span>
                          <div className='text-lg font-bold text-blue-950 my-0.5 leading-tight'>
                            {matchedDocument.number}
                          </div>
                          <div className='mt-2 flex items-center justify-between'>
                            <span className='text-xs font-medium text-blue-800'>
                              {matchedDocument.amount ? formatCurrency(Number(matchedDocument.amount)) : '-'}
                            </span>
                            <StatusBadge
                              status={matchedDocument.status}
                              variant={statusVariant(matchedDocument.status)}
                              size='xs'
                            />
                          </div>
                        </div>
                      ) : (
                        <div className='text-center py-4'>
                          <p className='text-xs font-medium text-gray-900 mb-0.5'>Belum Ada Dokumen</p>
                          <p className='text-[10px] text-gray-500'>Belum terhubung dengan dokumen penagihan.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Source */}
                  {fileUploaded && (
                    <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                      <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 flex items-center gap-2'>
                        <DocumentTextIcon className='w-4 h-4 text-gray-500' />
                        <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Sumber File</h3>
                      </div>
                      <div className='p-3'>
                        <p className='text-xs font-medium text-gray-900 truncate' title={fileUploaded.filename}>
                          {fileUploaded.filename}
                        </p>
                        <p className='text-[10px] text-gray-500 mt-0.5'>
                          Upload: {formatDateTime(fileUploaded.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* System Info */}
                  <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                    <div className='border-b border-gray-100 bg-gray-50/50 px-4 py-2.5'>
                      <h3 className='text-xs font-semibold text-gray-800 uppercase tracking-wide'>Informasi Sistem</h3>
                    </div>
                    <div className='p-0'>
                      <table className='w-full text-[11px] text-left'>
                        <tbody className='divide-y divide-gray-100'>
                          <tr className='hover:bg-gray-50'>
                            <th className='px-4 py-1.5 font-medium text-gray-500 bg-gray-50/30'>ID Record</th>
                            <td className='px-4 py-1.5 text-gray-900 font-mono truncate max-w-[120px]' title={detail.id}>{detail.id}</td>
                          </tr>
                          <tr className='hover:bg-gray-50'>
                            <th className='px-4 py-1.5 font-medium text-gray-500 bg-gray-50/30'>Baris File</th>
                            <td className='px-4 py-1.5 text-gray-900'>{detail.row_number || '-'}</td>
                          </tr>
                          <tr className='hover:bg-gray-50'>
                            <th className='px-4 py-1.5 font-medium text-gray-500 bg-gray-50/30'>Dibuat</th>
                            <td className='px-4 py-1.5 text-gray-900'>{formatDateTime(detail.createdAt)}</td>
                          </tr>
                          <tr className='hover:bg-gray-50'>
                            <th className='px-4 py-1.5 font-medium text-gray-500 bg-gray-50/30'>Diupdate</th>
                            <td className='px-4 py-1.5 text-gray-900'>{formatDateTime(detail.updatedAt)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className='rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mt-4'>
                <div className='px-4 py-4'>
                  <ActivityTimeline
                    auditTrails={auditTrails}
                    title='Riwayat Aktivitas Mutasi'
                    emptyMessage='Belum ada riwayat aktivitas.'
                    showCount={true}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end gap-2 sticky bottom-0 z-10'>
          {/* <button
            type='button'
            onClick={() => setShowRaw((prev) => !prev)}
            className='inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
          >
            {showRaw ? 'Sembunyikan Raw JSON' : 'Lihat Raw JSON'}
          </button> */}
          <button
            type='button'
            onClick={onClose}
            className='inline-flex items-center justify-center rounded border border-transparent bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition-colors'
          >
            Tutup
          </button>
        </div>

        {/* Raw JSON View overlay */}
        {showRaw && !loading && (
          <div className='absolute inset-0 z-20 bg-gray-900/95 flex flex-col'>
            <div className='flex items-center justify-between border-b border-gray-700 px-8 py-4'>
              <h3 className='text-lg font-medium text-white'>Raw JSON Response</h3>
              <button
                type='button'
                onClick={() => setShowRaw(false)}
                className='text-gray-400 hover:text-white transition-colors'
              >
                <XMarkIcon className='w-6 h-6' />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto p-8'>
              <pre className='text-xs text-green-400 font-mono'>
                {JSON.stringify(mutation, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutasiBankDetailModal;
