import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StatusBadge, LoadingDots } from '../ui';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';
  if (!value) {
    return 'secondary';
  }
  if (
    value.includes('complete') ||
    value.includes('selesai') ||
    value.includes('success')
  ) {
    return 'success';
  }
  if (value.includes('process')) {
    return 'primary';
  }
  if (value.includes('fail') || value.includes('error')) {
    return 'danger';
  }
  if (value.includes('pending')) {
    return 'warning';
  }
  return 'default';
};

const LaporanPenerimaanBarangBulkModal = ({
  isOpen,
  onClose,
  onBulkUpload,
  onFetchStatus,
}) => {
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  const [statusBulkId, setStatusBulkId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles(null);
      setCustomPrompt('');
      setFileInputKey((value) => value + 1);
      setUploading(false);
      setUploadError('');
      setUploadResult(null);
      setStatusBulkId('');
      setStatusLoading(false);
      setStatusError('');
      setStatusData(null);
    }
  }, [isOpen]);

  const filesArray = useMemo(() => {
    if (!selectedFiles) {
      return [];
    }
    return Array.from(selectedFiles).filter(Boolean);
  }, [selectedFiles]);

  const lastBulkId = useMemo(() => {
    if (!uploadResult) {
      return '';
    }
    if (uploadResult.bulkId) {
      return uploadResult.bulkId;
    }
    if (uploadResult.data && uploadResult.data.bulkId) {
      return uploadResult.data.bulkId;
    }
    if (uploadResult.batchId) {
      return uploadResult.batchId;
    }
    if (uploadResult.data && uploadResult.data.batchId) {
      return uploadResult.data.batchId;
    }
    return '';
  }, [uploadResult]);

  useEffect(() => {
    if (lastBulkId) {
      setStatusBulkId((prev) => prev || lastBulkId);
    }
  }, [lastBulkId]);

  const handleFileChange = (event) => {
    const files = event?.target?.files || null;
    setSelectedFiles(files && files.length ? files : null);
    setUploadError('');
  };

  const handleBulkUpload = async () => {
    if (typeof onBulkUpload !== 'function') {
      setUploadError('Fitur upload bulk belum tersedia.');
      return;
    }

    if (filesArray.length === 0) {
      setUploadError('Silakan pilih minimal satu file untuk diunggah.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const result = await onBulkUpload({
        files: filesArray,
        prompt: customPrompt.trim() || undefined,
      });
      setUploadResult(result);
      const bulkId =
        (result && result.bulkId) ||
        (result && result.data && result.data.bulkId) ||
        (result && result.batchId) ||
        (result && result.data && result.data.batchId) ||
        '';
      if (bulkId) {
        setStatusBulkId(bulkId);
        await handleFetchStatusInternal(bulkId);
      }
      setSelectedFiles(null);
      setFileInputKey((value) => value + 1);
    } catch (error) {
      const message =
        (error && error.response && error.response.data && error.response.data.message) ||
        (error && error.message) ||
        'Gagal mengunggah file.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleFetchStatusInternal = async (overrideBulkId) => {
    if (typeof onFetchStatus !== 'function') {
      setStatusError('Fitur status bulk belum tersedia.');
      return;
    }

    const bulkId = (overrideBulkId || statusBulkId || '').trim();
    if (!bulkId) {
      setStatusError('Silakan masukkan Bulk ID terlebih dahulu.');
      return;
    }

    setStatusLoading(true);
    setStatusError('');

    try {
      const result = await onFetchStatus(bulkId);
      setStatusData(result);
      setStatusBulkId(bulkId);
    } catch (error) {
      const message =
        (error && error.response && error.response.data && error.response.data.message) ||
        (error && error.message) ||
        'Gagal mengambil status bulk.';
      setStatusError(message);
      setStatusData(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePromptChange = (event) => {
    setCustomPrompt(event?.target?.value || '');
  };

  const handleStatusInputChange = (event) => {
    setStatusBulkId(event?.target?.value || '');
  };

  const renderSelectedFiles = () => {
    if (filesArray.length === 0) {
      return null;
    }
    return (
      <ul className='mt-3 space-y-1 text-sm text-gray-700'>
        {filesArray.map((file, index) => (
          <li key={index} className='flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2'>
            <span className='truncate pr-3'>{file.name}</span>
            <span className='text-xs text-gray-500'>{(file.size / 1024).toFixed(1)} KB</span>
          </li>
        ))}
      </ul>
    );
  };

  const statusSummary = useMemo(() => {
    if (!statusData) {
      return null;
    }
    const data = statusData.data ? statusData.data : statusData;
    return {
      bulkId: data.bulkId || data.batchId || '-',
      status: data.status || '-',
      type: data.type || '-',
      totalFiles: data.totalFiles == null ? '-' : data.totalFiles,
      processedFiles: data.processedFiles == null ? '-' : data.processedFiles,
      successFiles: data.successFiles == null ? '-' : data.successFiles,
      errorFiles: data.errorFiles == null ? '-' : data.errorFiles,
      processingFiles: data.processingFiles == null ? '-' : data.processingFiles,
      pendingFiles: data.pendingFiles == null ? '-' : data.pendingFiles,
      statusBreakdown: data.statusBreakdown || null,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
      files: Array.isArray(data.files) ? data.files : [],
    };
  }, [statusData]);

  const statusBreakdownEntries = useMemo(() => {
    if (!statusSummary || !statusSummary.statusBreakdown) {
      return [];
    }
    return Object.entries(statusSummary.statusBreakdown);
  }, [statusSummary]);

  if (!isOpen) {
    return null;
  }

  const handleManualCheck = () => {
    handleFetchStatusInternal();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'>
      <div className='flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl'>
        <div className='flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5'>
          <div>
            <h3 className='text-xl font-semibold text-gray-900'>Upload Bulk Laporan Penerimaan Barang</h3>
            <p className='text-sm text-gray-600'>Unggah beberapa file sekaligus dan pantau proses konversi di background.</p>
          </div>
          <button onClick={onClose} className='rounded-lg p-2 text-gray-500 hover:bg-gray-100'>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50'>
          <section className='rounded-lg border border-dashed border-blue-300 bg-white p-5 shadow-sm'>
            <h4 className='text-sm font-semibold text-gray-900'>1. Pilih File untuk Upload</h4>
            <p className='mt-1 text-xs text-gray-600'>Format yang didukung: PDF, EDI.</p>
            <div className='mt-4 space-y-3'>
              <input
                key={fileInputKey}
                type='file'
                multiple
                accept='.pdf,.PDF,.edi,.EDI'
                onChange={handleFileChange}
                disabled={uploading}
                className='block w-full text-sm text-gray-700 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50'
              />
              <textarea
                value={customPrompt}
                onChange={handlePromptChange}
                rows={2}
                placeholder='Custom prompt (opsional)'
                disabled={uploading}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
              />
              {uploadError && (
                <p className='text-sm text-red-600'>{uploadError}</p>
              )}
              {renderSelectedFiles()}
              <div className='flex items-center justify-end gap-3'>
                <button
                  type='button'
                  onClick={handleBulkUpload}
                  disabled={uploading}
                  className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:bg-blue-300'
                >
                  {uploading ? 'Mengunggah...' : 'Upload Bulk'}
                </button>
              </div>
            </div>
          </section>

          <section className='rounded-lg border border-gray-200 bg-white p-5 shadow-sm'>
            <h4 className='text-sm font-semibold text-gray-900'>2. Cek Status Bulk</h4>
            <p className='mt-1 text-xs text-gray-600'>Masukkan Bulk ID untuk melihat progres konversi.</p>
            <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center'>
              <input
                type='text'
                value={statusBulkId}
                onChange={handleStatusInputChange}
                placeholder='Contoh: bulk_lpb_clx0d0d0d0000000000000000'
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={statusLoading}
              />
              <button
                type='button'
                onClick={handleManualCheck}
                disabled={statusLoading}
                className='inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:bg-indigo-300'
              >
                {statusLoading ? 'Memuat...' : 'Cek Status'}
              </button>
            </div>
            {statusError && (
              <p className='mt-2 text-sm text-red-600'>{statusError}</p>
            )}

            {statusLoading && !statusData && (
              <div className='mt-4 flex items-center text-sm text-gray-500'>
                <LoadingDots className='mr-2' />
                Memuat status bulk...
              </div>
            )}

            {statusSummary && (
              <div className='mt-5 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900'>Bulk ID</p>
                    <p className='text-sm text-gray-700'>{statusSummary.bulkId}</p>
                  </div>
                  <StatusBadge
                    status={statusSummary.status}
                    variant={resolveStatusVariant(statusSummary.status)}
                    size='md'
                    dot
                  />
                </div>
                <div className='grid grid-cols-2 gap-3 text-sm text-gray-700 md:grid-cols-3'>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Jenis</p>
                    <p>{statusSummary.type}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Total File</p>
                    <p>{statusSummary.totalFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Diproses</p>
                    <p>{statusSummary.processedFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Berhasil</p>
                    <p>{statusSummary.successFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Gagal</p>
                    <p>{statusSummary.errorFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Sedang Diproses</p>
                    <p>{statusSummary.processingFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Menunggu</p>
                    <p>{statusSummary.pendingFiles}</p>
                  </div>
                  <div>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Dibuat</p>
                    <p>{formatDateTime(statusSummary.createdAt)}</p>
                  </div>
                  <div className='md:col-span-3'>
                    <p className='text-xs uppercase tracking-wide text-gray-500'>Selesai</p>
                    <p>{formatDateTime(statusSummary.completedAt)}</p>
                  </div>
                </div>

                {statusBreakdownEntries.length > 0 && (
                  <div>
                    <p className='mb-2 text-sm font-semibold text-gray-900'>Ringkasan Status</p>
                    <ul className='space-y-1 text-sm text-gray-700'>
                      {statusBreakdownEntries.map(([key, value]) => (
                        <li key={key} className='flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2'>
                          <span className='pr-3 text-gray-600'>{key}</span>
                          <span className='font-medium text-gray-900'>{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className='mb-2 text-sm font-semibold text-gray-900'>Detail File</p>
                  {statusSummary.files.length === 0 ? (
                    <p className='text-sm text-gray-600'>Belum ada data file.</p>
                  ) : (
                    <ul className='space-y-2 text-sm text-gray-700'>
                      {statusSummary.files.map((file) => (
                        <li
                          key={file.id || file.filename}
                          className='rounded border border-gray-200 bg-white px-3 py-2 shadow-sm'>
                          <div className='flex flex-col gap-1 md:flex-row md:items-center md:justify-between'>
                            <div>
                              <p className='font-medium text-gray-900'>{file.filename || file.originalName || file.id}</p>
                              <p className='text-xs text-gray-500'>Dibuat: {formatDateTime(file.createdAt)}</p>
                            </div>
                            <div className='text-xs text-gray-600'>
                              LPB ID: {file.laporanPenerimaanBarangId || '-'}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className='flex justify-end border-t border-gray-200 bg-white px-6 py-4'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangBulkModal;
