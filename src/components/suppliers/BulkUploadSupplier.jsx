import React, { useState, useRef } from 'react';
import supplierService from '../../services/supplierService';
import toastService from '../../services/toastService';

const BulkUploadSupplier = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const pollingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await supplierService.downloadBulkTemplate();
      toastService.success('Template berhasil didownload');
    } catch (error) {
      toastService.error(error.message || 'Gagal download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        toastService.error('Format file tidak valid. Hanya file Excel (.xlsx, .xls) yang diperbolehkan');
        return;
      }
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const pollUploadStatus = async (bulkId) => {
    try {
      const response = await supplierService.getBulkUploadStatus(bulkId);
      if (response.success && response.data) {
        const fileData = response.data.files?.[0];

        // Get status string from response.data.status or fileData.status.status_code
        let statusStr = response.data.status;
        if (!statusStr && fileData?.status) {
          statusStr = typeof fileData.status === 'object'
            ? (fileData.status.status_code || fileData.status.name)
            : fileData.status;
        }

        setUploadStatus({
          bulkId: response.data.bulkId,
          status: statusStr,
          filename: fileData?.filename,
          reason: fileData?.reason || null,
          statistics: {
            totalFiles: response.data.totalFiles,
            createdCount: response.data.rowStatistics?.createdCount || 0,
            updatedCount: response.data.rowStatistics?.updatedCount || 0,
            errorCount: response.data.rowStatistics?.errorCount || 0,
          }
        });

        // Stop polling if completed or failed
        const isCompleted = statusStr?.includes?.('COMPLETED');
        const isFailed = statusStr?.includes?.('FAILED');

        if (isCompleted || isFailed) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          if (isCompleted) {
            toastService.success('Bulk upload berhasil diproses!');
            if (onSuccess) {
              onSuccess();
            }
          } else if (isFailed) {
            toastService.error('Bulk upload gagal diproses');
          }
        }
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toastService.error('Silakan pilih file terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      const response = await supplierService.uploadBulkSupplier(selectedFile);

      if (response.success && response.data) {
        toastService.success(response.data.message || 'File berhasil diupload dan sedang diproses');
        setUploadStatus({
          bulkId: response.data.bulkId,
          totalFiles: response.data.totalFiles,
          status: 'PROCESSING BULK SUPPLIER'
        });

        // Start polling for status
        const interval = setInterval(() => {
          pollUploadStatus(response.data.bulkId);
        }, 3000); // Poll every 3 seconds

        pollingIntervalRef.current = interval;

        // Initial poll
        pollUploadStatus(response.data.bulkId);
      }
    } catch (error) {
      toastService.error(error.message || 'Gagal upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600 bg-gray-50';
    const statusStr = typeof status === 'string' ? status : String(status);
    if (statusStr.includes('COMPLETED')) return 'text-green-600 bg-green-50';
    if (statusStr.includes('FAILED')) return 'text-red-600 bg-red-50';
    if (statusStr.includes('PROCESSING')) return 'text-blue-600 bg-blue-50';
    if (statusStr.includes('PENDING')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    const statusStr = typeof status === 'string' ? status : String(status);
    if (statusStr.includes('COMPLETED')) return 'Selesai';
    if (statusStr.includes('FAILED')) return 'Gagal';
    if (statusStr.includes('PROCESSING')) return 'Sedang Diproses';
    if (statusStr.includes('PENDING')) return 'Menunggu';
    return statusStr;
  };

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Download Template Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">Langkah 1: Download Template</h3>
            <p className="mt-1 text-sm text-blue-700">
              Download template Excel terlebih dahulu, isi data supplier sesuai format yang tersedia.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingTemplate ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mendownload...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-900">Langkah 2: Upload File</h3>
            <p className="mt-1 text-sm text-green-700">
              Pilih file Excel yang sudah diisi untuk diupload.
            </p>

            <div className="mt-3 space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-300">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      {uploadStatus && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Status Upload</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Filename:</span>
              <span className="text-sm font-medium text-gray-900">{uploadStatus.filename}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(uploadStatus.status)}`}>
                {getStatusText(uploadStatus.status)}
              </span>
            </div>
            {uploadStatus.statistics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Files:</span>
                  <span className="text-sm font-medium text-gray-900">{uploadStatus.statistics.totalFiles || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Baru:</span>
                  <span className="text-sm font-medium text-green-600">{uploadStatus.statistics.createdCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Diupdate:</span>
                  <span className="text-sm font-medium text-blue-600">{uploadStatus.statistics.updatedCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gagal:</span>
                  <span className="text-sm font-medium text-red-600">{uploadStatus.statistics.errorCount || 0}</span>
                </div>
              </>
            )}
            {uploadStatus.reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm font-medium text-red-800">Alasan Gagal:</span>
                <p className="text-sm text-red-700 mt-1">{uploadStatus.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default BulkUploadSupplier;
