import React, { useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import tandaTerimaFakturService from '@/services/tandaTerimaFakturService';
import toastService from '@/services/toastService';

const UploadTTF2Modal = ({ isOpen = false, onClose = () => { }, onSuccess = () => { } }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const processingMethod = 'text-extraction';

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const invalidFiles = files.filter(file => file.type !== 'application/pdf');
      if (invalidFiles.length > 0) {
        toastService.error('Hanya file PDF yang diperbolehkan');
        e.target.value = '';
        return;
      }
      setSelectedFiles(files);
      setUploadResults([]);
      setUploadProgress({});
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toastService.error('Minimal 1 file PDF harus dipilih');
      return;
    }

    setIsUploading(true);
    const results = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'uploading', fileName: file.name }
        }));

        try {
          const result = await tandaTerimaFakturService.bulkUpload(null, file, processingMethod);

          const validation = result.data?.validation;
          const updatedCount = validation?.updatedCount || 0;
          const invalidCount = validation?.invalidFakturPajak?.length || 0;
          const totalItems = validation?.totalItems || (updatedCount + invalidCount);

          const isSuccess = updatedCount > 0 && invalidCount === 0;
          const isPartial = updatedCount > 0 && invalidCount > 0;
          const fileStatus = isSuccess ? 'SUCCESS' : isPartial ? 'PARTIAL' : 'FAILED';

          results.push({
            fileName: file.name,
            success: updatedCount > 0,
            fileStatus,
            updatedCount,
            invalidCount,
            totalItems,
            data: result
          });

          totalSuccess += updatedCount;
          totalFailed += invalidCount;

          setUploadProgress(prev => ({
            ...prev,
            [i]: {
              status: isSuccess ? 'success' : isPartial ? 'warning' : 'error',
              fileName: file.name,
              result
            }
          }));
        } catch (error) {
          results.push({
            fileName: file.name,
            success: false,
            fileStatus: 'FAILED',
            updatedCount: 0,
            invalidCount: 1,
            totalItems: 1,
            error: error.message || 'Upload gagal'
          });

          totalFailed += 1;

          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'error', fileName: file.name, error: error.message }
          }));
        }
      }

      setUploadResults(results);

      // Show summary toast based on accurate file & invoice counts
      const successFiles = results.filter(r => r.fileStatus === 'SUCCESS').length;
      const partialFiles = results.filter(r => r.fileStatus === 'PARTIAL').length;
      const failedFiles = results.filter(r => r.fileStatus === 'FAILED').length;
      const effectiveSuccessFiles = successFiles + partialFiles;

      if (totalSuccess === 0) {
        toastService.error(
          `Upload gagal: Semua file (${selectedFiles.length} file) gagal diproses. Total ${totalFailed} faktur gagal.`
        );
      } else if (failedFiles > 0 || partialFiles > 0 || totalFailed > 0) {
        toastService.warning(
          `Upload selesai: ${effectiveSuccessFiles}/${selectedFiles.length} file berhasil (${failedFiles} file gagal). Total ${totalSuccess} faktur diupdate, ${totalFailed} faktur gagal.`
        );
      } else {
        toastService.success(
          `Semua file berhasil diupload! Total ${totalSuccess} faktur pajak diupdate.`
        );
      }

      // Call onSuccess callback
      onSuccess(results);
    } catch (error) {
      console.error('Error uploading TTF documents:', error);
      toastService.error(error.message || 'Gagal mengupload dokumen TTF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setUploadProgress({});
    setIsUploading(false);
    onClose();
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setUploadProgress({});
    setIsUploading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Upload Tanda Terima Faktur (Bulk Upload)
            </h2>
            <p className='text-sm text-gray-500'>
              Upload dokumen PDF Form Tanda Penyerahan Faktur dari customer
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
            {/* File Upload */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                File PDF <span className='text-red-500'>*</span>
                <span className='text-gray-500 text-xs ml-2'>(Bisa pilih banyak file sekaligus)</span>
              </label>
              <input
                type='file'
                accept='.pdf,application/pdf'
                onChange={handleFileChange}
                disabled={isUploading}
                multiple
                className='block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
              />
              {selectedFiles.length > 0 && (
                <div className='mt-3 space-y-2'>
                  <p className='text-sm font-medium text-gray-700'>
                    {selectedFiles.length} file terpilih:
                  </p>
                  <div className='max-h-40 overflow-y-auto space-y-1'>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200'>
                        <span className='text-sm text-gray-700 truncate flex-1'>{file.name}</span>
                        {!isUploading && (
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className='ml-2 text-red-600 hover:text-red-800 text-sm font-medium'
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && Object.keys(uploadProgress).length > 0 && (
              <div className='mt-4 p-4 border rounded-lg bg-gray-50'>
                <h3 className='text-lg font-semibold mb-3'>Progress Upload</h3>
                <div className='space-y-2'>
                  {Object.entries(uploadProgress).map(([index, progress]) => (
                    <div key={index} className='flex items-center gap-3 p-2 bg-white rounded border'>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-gray-700 truncate'>{progress.fileName}</p>
                      </div>
                      <div className='flex items-center gap-2'>
                        {progress.status === 'uploading' && (
                          <div className='flex items-center gap-2'>
                            <div className='w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin'></div>
                            <span className='text-sm text-blue-600'>Uploading...</span>
                          </div>
                        )}
                        {progress.status === 'success' && (
                          <span className='text-sm text-green-600 font-medium'>✓ Selesai</span>
                        )}
                        {progress.status === 'warning' && (
                          <span className='text-sm text-amber-600 font-medium'>⚠ Sebagian</span>
                        )}
                        {progress.status === 'error' && (
                          <span className='text-sm text-red-600 font-medium'>✗ Gagal</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResults.length > 0 && (
              <div className='mt-4 p-4 border rounded-lg bg-gray-50'>
                <h3 className='text-lg font-semibold mb-3'>Hasil Upload</h3>

                {/* Summary */}
                {(() => {
                  const successFilesCount = uploadResults.filter(r => r.fileStatus === 'SUCCESS').length;
                  const partialFilesCount = uploadResults.filter(r => r.fileStatus === 'PARTIAL').length;
                  const failedFilesCount = uploadResults.filter(r => r.fileStatus === 'FAILED').length;
                  const totalUpdatedCount = uploadResults.reduce((sum, r) => sum + (r.updatedCount ?? r.data?.data?.validation?.updatedCount ?? 0), 0);
                  const totalFailedCount = uploadResults.reduce((sum, r) => sum + (r.invalidCount ?? r.data?.data?.validation?.invalidFakturPajak?.length ?? 0), 0);

                  return (
                    <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                      <p className='text-sm font-medium text-blue-900 mb-2'>
                        Upload Summary
                      </p>
                      <div className='text-sm text-blue-700 space-y-1'>
                        <p>Total File: {uploadResults.length}</p>
                        <p>
                          Berhasil: {successFilesCount}
                          {partialFilesCount > 0 ? ` (${partialFilesCount} sebagian)` : ''}
                        </p>
                        <p>Gagal: {failedFilesCount}</p>
                        <p className='mt-1 pt-1 border-t border-blue-300 font-medium'>
                          Total Faktur Diupdate: {totalUpdatedCount}
                        </p>
                        {totalFailedCount > 0 && (
                          <p className='text-red-600 font-medium'>
                            Total Faktur Gagal: {totalFailedCount}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Per File Results */}
                <div className='space-y-4'>
                  {uploadResults.map((result, idx) => {
                    const isSuccess = result.fileStatus === 'SUCCESS';
                    const isPartial = result.fileStatus === 'PARTIAL';

                    const cardBg = isSuccess
                      ? 'bg-green-50 border-green-200'
                      : isPartial
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200';

                    const badgeBg = isSuccess
                      ? 'bg-green-200 text-green-800'
                      : isPartial
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-red-200 text-red-800';

                    const badgeText = isSuccess
                      ? '✓ Berhasil'
                      : isPartial
                      ? '⚠ Sebagian'
                      : '✗ Gagal';

                    const validation = result.data?.data?.validation;

                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${cardBg}`}>
                        <div className='flex items-center justify-between mb-2'>
                          <p className='text-sm font-medium truncate flex-1'>{result.fileName}</p>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeBg}`}>
                            {badgeText}
                          </span>
                        </div>

                        {validation ? (
                          <div className='text-xs text-gray-700 space-y-1'>
                            {result.data?.data?.groupCustomer && (
                              <p className='font-semibold text-blue-700'>
                                • Group: {result.data.data.groupCustomer.nama_group}
                              </p>
                            )}
                            <p>• Total Item: {validation.totalItems || (result.updatedCount + result.invalidCount) || 0}</p>
                            <p className='text-green-700'>• Faktur Berhasil: {result.updatedCount ?? validation.updatedCount ?? 0}</p>
                            <p className={result.invalidCount > 0 ? 'text-red-700 font-medium' : ''}>
                              • Faktur Gagal: {result.invalidCount ?? validation.invalidFakturPajak?.length ?? 0}
                            </p>
                          </div>
                        ) : (
                          <p className='text-xs text-red-700'>Error: {result.error || 'Gagal memproses file'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Valid Faktur Pajak - Aggregated from all files */}
                {uploadResults.some(r => (r.data?.data?.validation?.validFakturPajak?.length || 0) > 0) && (
                  <div className='mb-4 mt-4'>
                    <h4 className='text-md font-semibold mb-2 text-green-700'>
                      ✓ Semua Faktur Pajak Berhasil ({uploadResults.reduce((sum, r) => sum + (r.data?.data?.validation?.validFakturPajak?.length || 0), 0)})
                    </h4>
                    <div className='max-h-64 overflow-y-auto'>
                      <table className='min-w-full text-sm'>
                        <thead className='bg-green-50 sticky top-0'>
                          <tr>
                            <th className='px-3 py-2 text-left text-xs font-medium text-green-900'>File</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-green-900'>No. Faktur Pajak</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-green-900'>Customer</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-green-900'>Status</th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {uploadResults.map((result, resultIdx) =>
                            result.data?.data?.validation?.validFakturPajak?.map((item, itemIdx) => (
                              <tr key={`${resultIdx}-${itemIdx}`}>
                                <td className='px-3 py-2 text-xs text-gray-600 truncate max-w-xs'>{result.fileName}</td>
                                <td className='px-3 py-2 whitespace-nowrap'>{item.noFakturPajak}</td>
                                <td className='px-3 py-2'>{item.customerName}</td>
                                <td className='px-3 py-2'>
                                  <span className='inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full'>
                                    {item.newStatus}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Detailed Invalid Faktur Pajak - Aggregated from all files */}
                {uploadResults.some(r => (r.data?.data?.validation?.invalidFakturPajak?.length || 0) > 0) && (
                  <div>
                    <h4 className='text-md font-semibold mb-2 text-red-700'>
                      ✗ Semua Faktur Pajak Gagal ({uploadResults.reduce((sum, r) => sum + (r.data?.data?.validation?.invalidFakturPajak?.length || 0), 0)})
                    </h4>
                    <div className='max-h-64 overflow-y-auto'>
                      <table className='min-w-full text-sm'>
                        <thead className='bg-red-50 sticky top-0'>
                          <tr>
                            <th className='px-3 py-2 text-left text-xs font-medium text-red-900'>File</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-red-900'>No. Faktur Pajak</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-red-900'>Alasan</th>
                            <th className='px-3 py-2 text-left text-xs font-medium text-red-900'>Status</th>
                          </tr>
                        </thead>
                        <tbody className='bg-white divide-y divide-gray-200'>
                          {uploadResults.map((result, resultIdx) =>
                            result.data?.data?.validation?.invalidFakturPajak?.map((item, itemIdx) => (
                              <tr key={`${resultIdx}-${itemIdx}`}>
                                <td className='px-3 py-2 text-xs text-gray-600 truncate max-w-xs'>{result.fileName}</td>
                                <td className='px-3 py-2 whitespace-nowrap'>{item.noFakturPajak}</td>
                                <td className='px-3 py-2'>{item.reason}</td>
                                <td className='px-3 py-2'>
                                  <span className='inline-flex px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full'>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50'>
          {uploadResults.length > 0 ? (
            <>
              <button
                onClick={handleReset}
                className='px-4 py-2 text-sm font-medium text-gray-700 transition border border-gray-300 rounded-md hover:bg-gray-100'
              >
                Upload Lagi
              </button>
              <button
                onClick={handleCloseModal}
                className='px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700'
              >
                Tutup
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCloseModal}
                className='px-4 py-2 text-sm font-medium text-gray-700 transition border border-gray-300 rounded-md hover:bg-gray-100'
                disabled={isUploading}
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin'></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className='w-5 h-5' />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadTTF2Modal;
