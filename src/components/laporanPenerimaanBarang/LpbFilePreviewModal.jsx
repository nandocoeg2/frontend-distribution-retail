import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

/**
 * Modal to preview actual uploaded LPB PDF/Image files.
 * Supports viewing single or multiple files with navigation and download/print.
 */
const LpbFilePreviewModal = ({
  isOpen,
  onClose,
  files = [], // Array of { url, blob, filename, contentType, lpbNumber, id }
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, files.length - 1)));
    }
  }, [isOpen, initialIndex, files.length]);

  const currentFile = files[currentIndex] || null;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  }, [files.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  }, [files.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && files.length > 1) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && files.length > 1) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, files.length, handlePrev, handleNext, onClose]);

  const handleDownloadCurrent = () => {
    if (!currentFile) return;
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.filename || `LPB_${currentFile.lpbNumber || 'file'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!currentFile) return;
    if (currentFile.contentType?.includes('pdf') || currentFile.filename?.endsWith('.pdf')) {
      const printWindow = window.open(currentFile.url, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      // Print image
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${currentFile.filename}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center;">
              <img src="${currentFile.url}" style="max-width:100%; height:auto;" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  if (!isOpen || !files || files.length === 0 || !currentFile) {
    return null;
  }

  const isPdf =
    currentFile.contentType?.includes('pdf') ||
    currentFile.filename?.toLowerCase().endsWith('.pdf');

  const isImage =
    currentFile.contentType?.includes('image') ||
    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(currentFile.filename || '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-slate-900 bg-opacity-80">
      {/* Header Bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between text-white shadow-md z-10">
        {/* Document Title Info */}
        <div className="flex items-center space-x-2 truncate max-w-md">
          <DocumentTextIcon className="h-5 w-5 text-purple-400 flex-shrink-0" />
          <div className="truncate">
            <h2 className="text-sm font-semibold truncate">
              {currentFile.lpbNumber ? `LPB: ${currentFile.lpbNumber}` : currentFile.filename}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {currentFile.filename}
            </p>
          </div>
        </div>

        {/* Navigation for Multi-document */}
        {files.length > 1 && (
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            <button
              onClick={handlePrev}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Dokumen Sebelumnya (Panah Kiri)"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <span className="text-xs font-medium text-slate-200">
              Dokumen <span className="text-purple-400 font-bold">{currentIndex + 1}</span> dari{' '}
              <span className="font-bold">{files.length}</span>
            </span>

            <button
              onClick={handleNext}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Dokumen Selanjutnya (Panah Kanan)"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 rounded transition-colors"
            title="Cetak Dokumen"
          >
            <PrinterIcon className="h-4 w-4 mr-1.5 text-slate-300" />
            Print
          </button>

          <button
            onClick={handleDownloadCurrent}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors shadow-sm"
            title="Download File LPB"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Download
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            title="Tutup (Esc)"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main File Viewer Area */}
      <div className="flex-1 w-full h-full bg-slate-950 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700">
            <iframe
              src={currentFile.url}
              className="w-full h-full border-0"
              title={`LPB Preview - ${currentFile.filename}`}
            />
          </div>
        ) : isImage ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img
              src={currentFile.url}
              alt={currentFile.filename}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
            />
          </div>
        ) : (
          <div className="text-center text-slate-300 p-8 bg-slate-900 rounded-lg border border-slate-700">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-slate-500 mb-3" />
            <p className="font-semibold text-white mb-1">{currentFile.filename}</p>
            <p className="text-xs text-slate-400 mb-4">
              Format file ({currentFile.contentType || 'unknown'}) tidak dapat ditampilkan langsung di browser.
            </p>
            <button
              onClick={handleDownloadCurrent}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LpbFilePreviewModal;
