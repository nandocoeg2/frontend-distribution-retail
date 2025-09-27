import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  StatusBadge,
  LoadingDots,
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
} from '../ui';

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

const formatFileSize = (bytes) => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) {
    return '-';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const size = value / 1024 ** index;
  const formatted = size >= 10 || index === 0 ? size.toFixed(0) : size.toFixed(1);
  return formatted + ' ' + units[index];
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
  onFetchBulkFiles,
}) => {
  const [activeTab, setActiveTab] = useState('upload');

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

  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkFilesLoading, setBulkFilesLoading] = useState(false);
  const [bulkFilesError, setBulkFilesError] = useState('');
  const [bulkFilesStatusFilter, setBulkFilesStatusFilter] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveTab('upload');
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

    setBulkFiles([]);
    setBulkFilesLoading(false);
    setBulkFilesError('');
    setBulkFilesStatusFilter('');
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
    const candidates = [
      uploadResult ? uploadResult.bulkId : '',
      uploadResult && uploadResult.data ? uploadResult.data.bulkId : '',
      uploadResult ? uploadResult.batchId : '',
      uploadResult && uploadResult.data ? uploadResult.data.batchId : '',
    ];
    return candidates.find((value) => typeof value === 'string' && value) || '';
  }, [uploadResult]);

  useEffect(() => {
    if (lastBulkId) {
      setStatusBulkId((prev) => prev || lastBulkId);
    }
  }, [lastBulkId]);

  const handleFileChange = (event) => {
    setUploadError('');
    const files = event?.target?.files || null;
    if (!files || files.length === 0) {
      setSelectedFiles(null);
      return;
    }

    const valid = Array.from(files).every((file) => {
      const name = file?.name?.toLowerCase() || '';
      return name.endsWith('.pdf') || name.endsWith('.edi');
    });

    if (!valid) {
      setUploadError('Format file tidak didukung. Gunakan PDF atau EDI.');
      setSelectedFiles(null);
      setFileInputKey((value) => value + 1);
      return;
    }

    setSelectedFiles(files);
  };

  const handleBulkUpload = async () => {
    if (typeof onBulkUpload !== 'function') {
      setUploadError('Fitur upload bulk belum tersedia.');
      return;
    }

    if (!filesArray.length) {
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
      const bulkIdCandidates = [
        result ? result.bulkId : '',
        result && result.data ? result.data.bulkId : '',
        result ? result.batchId : '',
        result && result.data ? result.data.batchId : '',
      ];
      const bulkId = bulkIdCandidates.find((value) => typeof value === 'string' && value) || '';
      if (bulkId) {
        setStatusBulkId(bulkId);
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

  const handleFetchStatusInternal = useCallback(
    async (overrideBulkId) => {
      if (typeof onFetchStatus !== 'function') {
        setStatusError('Fitur status bulk belum tersedia.');
        return;
      }

      const bulkIdValue = (overrideBulkId || statusBulkId || '').trim();
      if (!bulkIdValue) {
        setStatusError('Silakan masukkan Bulk ID terlebih dahulu.');
        return;
      }

      setStatusLoading(true);
      setStatusError('');

      try {
        const result = await onFetchStatus(bulkIdValue);
        setStatusData(result);
        setStatusBulkId(bulkIdValue);
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
    },
    [onFetchStatus, statusBulkId]
  );

  const handleBulkFilesRefresh = useCallback(async () => {
    if (typeof onFetchBulkFiles !== 'function') {
      setBulkFilesError('Fitur daftar bulk belum tersedia.');
      setBulkFiles([]);
      return;
    }

    setBulkFilesLoading(true);
    setBulkFilesError('');

    try {
      const params = bulkFilesStatusFilter ? { status: bulkFilesStatusFilter } : undefined;
      const result = await onFetchBulkFiles(params);
      const data = result && typeof result === 'object' && 'data' in result ? result.data : result;
      setBulkFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        (error && error.response && error.response.data && error.response.data.message) ||
        (error && error.message) ||
        'Gagal memuat daftar bulk files.';
      setBulkFilesError(message);
      setBulkFiles([]);
    } finally {
      setBulkFilesLoading(false);
    }
  }, [onFetchBulkFiles, bulkFilesStatusFilter]);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setUploadError('');
      setStatusError('');
      if (tabId === 'files') {
        handleBulkFilesRefresh();
      }
    },
    [handleBulkFilesRefresh]
  );

  useEffect(() => {
    if (isOpen && activeTab === 'files') {
      handleBulkFilesRefresh();
    }
  }, [isOpen, activeTab, handleBulkFilesRefresh]);

  const filesList = useMemo(() => {
    return filesArray.map((file, index) => (
      <li
        key={(file && file.name ? file.name : 'file') + '-' + index}
        className='flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700'
      >
        <span className='truncate pr-3'>{file.name}</span>
        <span className='text-xs text-gray-500'>{formatFileSize(file.size)}</span>
      </li>
    ));
  }, [filesArray]);

  const statusSummary = useMemo(() => {
    if (!statusData) {
      return null;
    }
    const data = statusData && typeof statusData === 'object' && 'data' in statusData ? statusData.data : statusData;
    return {
      bulkId: data && data.bulkId ? data.bulkId : data && data.batchId ? data.batchId : '-',
      status: data && data.status ? data.status : '-',
      type: data && data.type ? data.type : '-',
      totalFiles: data && data.totalFiles !== undefined ? data.totalFiles : '-',
      processedFiles: data && data.processedFiles !== undefined ? data.processedFiles : '-',
      successFiles: data && data.successFiles !== undefined ? data.successFiles : '-',
      errorFiles: data && data.errorFiles !== undefined ? data.errorFiles : '-',
      processingFiles: data && data.processingFiles !== undefined ? data.processingFiles : '-',
      pendingFiles: data && data.pendingFiles !== undefined ? data.pendingFiles : '-',
      statusBreakdown: data && data.statusBreakdown ? data.statusBreakdown : null,
      createdAt: data ? data.createdAt : undefined,
      completedAt: data ? data.completedAt : undefined,
      files: data && Array.isArray(data.files) ? data.files : [],
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
      <div className='flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl'>
        <div className='flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5'>
          <div>
            <h3 className='text-xl font-semibold text-gray-900'>Bulk Laporan Penerimaan Barang</h3>
            <p className='text-sm text-gray-600'>Unggah file dan pantau progres konversi LPB.</p>
          </div>
          <button onClick={onClose} className='rounded-lg p-2 text-gray-500 hover:bg-gray-100'>
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <TabContainer
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant='underline'
          className='px-6 pt-4'
        >
          <Tab id='upload' label='Upload Bulk LPB' />
          <Tab id='files' label='Daftar Bulk Files' />
          <Tab id='status' label='Cek Status by Bulk ID' />
        </TabContainer>

        <div className='flex-1 overflow-y-auto px-6 py-6 bg-gray-50'>
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='upload'>
              <section className='rounded-lg border border-dashed border-blue-300 bg-white p-5 shadow-sm'>
                <h4 className='text-sm font-semibold text-gray-900'>Upload File Laporan</h4>
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
                    onChange={(event) => setCustomPrompt(event?.target?.value || '')}
                    rows={2}
                    placeholder='Custom prompt (opsional)'
                    disabled={uploading}
                    className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                  />
                  {uploadError && (
                    <p className='text-sm text-red-600'>{uploadError}</p>
                  )}
                  {filesArray.length > 0 && (
                    <ul className='space-y-1 text-sm text-gray-700'>{filesList}</ul>
                  )}
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
            </TabPanel>

            <TabPanel tabId='files'>
              <section className='space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm'>
                {typeof onFetchBulkFiles !== 'function' ? (
                  <p className='text-sm text-gray-600'>Fitur daftar bulk files belum tersedia.</p>
                ) : (
                  <>
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div>
                        <h4 className='text-sm font-semibold text-gray-900'>Daftar Bulk Files</h4>
                        <p className='text-xs text-gray-500'>Gunakan filter status untuk memantau progres konversi.</p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <select
                          value={bulkFilesStatusFilter}
                          onChange={(event) => setBulkFilesStatusFilter(event.target.value)}
                          className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          disabled={bulkFilesLoading}
                        >
                          <option value=''>Semua Status</option>
                          <option value='PENDING BULK LAPORAN PENERIMAAN BARANG'>PENDING BULK LAPORAN PENERIMAAN BARANG</option>
                          <option value='PROCESSING BULK LAPORAN PENERIMAAN BARANG'>PROCESSING BULK LAPORAN PENERIMAAN BARANG</option>
                          <option value='COMPLETED BULK LAPORAN PENERIMAAN BARANG'>COMPLETED BULK LAPORAN PENERIMAAN BARANG</option>
                          <option value='FAILED BULK LAPORAN PENERIMAAN BARANG'>FAILED BULK LAPORAN PENERIMAAN BARANG</option>
                        </select>
                        <button
                          type='button'
                          onClick={handleBulkFilesRefresh}
                          disabled={bulkFilesLoading}
                          className='rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {bulkFilesError && (
                      <p className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{bulkFilesError}</p>
                    )}

                    <div className='overflow-x-auto'>
                      <table className='min-w-full divide-y divide-gray-200 text-sm'>
                        <thead className='bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500'>
                          <tr>
                            <th className='px-4 py-3 text-left'>Filename</th>
                            <th className='px-4 py-3 text-left'>Status</th>
                            <th className='px-4 py-3 text-left'>Size</th>
                            <th className='px-4 py-3 text-left'>Created</th>
                            <th className='px-4 py-3 text-left'>Updated</th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200 bg-white'>
                          {bulkFilesLoading ? (
                            <tr>
                              <td colSpan={5} className='px-4 py-6 text-center text-sm text-gray-500'>
                                <div className='flex items-center justify-center gap-2'>
                                  <LoadingDots />
                                  Memuat data bulk files...
                                </div>
                              </td>
                            </tr>
                          ) : bulkFiles.length === 0 ? (
                            <tr>
                              <td colSpan={5} className='px-4 py-6 text-center text-sm text-gray-500'>Belum ada data bulk files.</td>
                            </tr>
                          ) : (
                            bulkFiles.map((file) => (
                              <tr key={(file && file.id) || file.filename || file.path || Math.random()} className='hover:bg-gray-50'>
                                <td className='px-4 py-3 text-gray-900'>{file.filename || file.originalName || '-'}</td>
                                <td className='px-4 py-3'>
                                  <StatusBadge
                                    status={file.status && file.status.status_code ? file.status.status_code : file.status}
                                    variant={resolveStatusVariant(file.status && file.status.status_code ? file.status.status_code : file.status)}
                                    size='sm'
                                    dot
                                  />
                                </td>
                                <td className='px-4 py-3 text-gray-700'>{formatFileSize(file.size)}</td>
                                <td className='px-4 py-3 text-gray-500'>{formatDateTime(file.createdAt)}</td>
                                <td className='px-4 py-3 text-gray-500'>{formatDateTime(file.updatedAt)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </TabPanel>

            <TabPanel tabId='status'>
              <section className='rounded-lg border border-gray-200 bg-white p-5 shadow-sm'>
                <h4 className='text-sm font-semibold text-gray-900'>Cek Status Bulk</h4>
                <p className='mt-1 text-xs text-gray-600'>Masukkan Bulk ID untuk melihat progres konversi.</p>
                <div className='mt-4 flex flex-col gap-3 md:flex-row md:items-center'>
                  <input
                    type='text'
                    value={statusBulkId}
                    onChange={(event) => setStatusBulkId(event?.target?.value || '')}
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
                {statusError && <p className='mt-2 text-sm text-red-600'>{statusError}</p>}

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
                            <li
                              key={key}
                              className='flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2'
                            >
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
                              key={(file && file.id) || file.filename || file.originalName || Math.random()}
                              className='rounded border border-gray-200 bg-white px-3 py-2 shadow-sm'
                            >
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
            </TabPanel>
          </TabContent>
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
