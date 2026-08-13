import React, { useState, useRef } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import fakturPajakService from '@/services/fakturPajakService';
import toastService from '@/services/toastService';

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '-';
  const num = Number(bytes);
  if (!Number.isFinite(num) || num === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const FakturPajakBulkUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setError(null);
    setResults(null);

    // Validate that all files are PDFs
    const allPdfs = files.every(file => file.name.toLowerCase().endsWith('.pdf'));
    if (!allPdfs) {
      setError('Hanya file PDF (.pdf) yang diperbolehkan.');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFiles(files);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Pilih minimal satu file PDF untuk diunggah.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fakturPajakService.uploadBulkFakturPajakTextExtraction({
        files: selectedFiles
      });

      const data = response?.data || response;
      setResults(data);
      
      // Determine overall notification type
      const successCount = data?.successFiles || 0;
      const errorCount = data?.errorFiles || 0;
      
      if (errorCount === 0) {
        toastService.success(`Berhasil memproses ${successCount} file Faktur Pajak.`);
        if (onSuccess) onSuccess();
      } else if (successCount > 0) {
        toastService.warning(`Berhasil memproses ${successCount} file, tetapi ${errorCount} file gagal.`);
        if (onSuccess) onSuccess();
      } else {
        toastService.error(`Semua ${errorCount} file gagal diproses.`);
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Gagal memproses upload bulk.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedFiles([]);
    setResults(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Faktur Pajak</h2>
            <p className="text-xs text-gray-500 mt-1">Unggah beberapa file e-Faktur PDF sekaligus. Nomor invoice akan dicocokkan otomatis menggunakan data Referensi.</p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 text-gray-500 transition-colors duration-150 rounded-lg hover:bg-gray-100"
            aria-label="Tutup bulk upload"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Drag & Drop Area */}
          {!results && (
            <div
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition hover:border-blue-500 hover:bg-blue-50/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                multiple
                className="hidden"
                disabled={loading}
              />
              <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Pilih atau Seret file PDF (.pdf) di sini</p>
              <p className="text-xs text-gray-500 mt-1">Mendukung beberapa file sekaligus</p>
            </div>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && !results && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Terpilih ({selectedFiles.length})</h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 text-sm">
                    <div className="flex items-center gap-2 overflow-hidden mr-4">
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="truncate font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 font-medium text-xs disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.totalFiles || 0}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Total File</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-700">{results.successFiles || 0}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Berhasil Dicocokkan</div>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-700">{results.errorFiles || 0}</div>
                  <div className="text-xs text-red-600 font-medium mt-1">Gagal Dicocokkan</div>
                </div>
              </div>

              {results.failedFiles && results.failedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Kegagalan</h3>
                  <div className="border border-red-100 bg-red-50/30 rounded-lg divide-y divide-red-100 max-h-[250px] overflow-y-auto">
                    {results.failedFiles.map((fail, idx) => (
                      <div key={idx} className="p-3 text-xs flex gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <div className="font-semibold text-gray-800 truncate">{fail.filename}</div>
                          <div className="text-red-600 mt-0.5">{fail.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.successFiles > 0 && results.errorFiles === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Semua file berhasil diproses dan dicocokkan!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {results ? 'Tutup' : 'Batal'}
          </button>
          {!results && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || selectedFiles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                'Upload & Proses'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FakturPajakBulkUploadModal;
