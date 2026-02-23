import React, { useState, useCallback, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * GenerateInvoicePenagihanDialog Component
 * Custom confirmation dialog for generating Invoice Penagihan with a date picker.
 * User must fill in the date before the generate button becomes clickable.
 * The single date applies to all 3 documents: Invoice Penagihan, Kwitansi, and Faktur Pajak.
 */
const GenerateInvoicePenagihanDialog = ({
    show,
    onClose,
    onConfirm,
    invoiceCount = 0,
    loading = false,
}) => {
    const [tanggalDokumen, setTanggalDokumen] = useState('');

    // Reset date when dialog opens/closes
    useEffect(() => {
        if (!show) {
            setTanggalDokumen('');
        }
    }, [show]);

    const isFormValid = tanggalDokumen !== '';

    const handleConfirm = useCallback(() => {
        if (!loading && isFormValid) {
            onConfirm(tanggalDokumen);
        }
    }, [loading, isFormValid, onConfirm, tanggalDokumen]);

    const handleCancel = useCallback(() => {
        if (!loading) {
            onClose();
        }
    }, [loading, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center p-6 border-b border-gray-200">
                    <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-yellow-600">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Generate Invoice Penagihan
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {invoiceCount > 0
                            ? `Apakah Anda yakin ingin membuat Invoice Penagihan untuk ${invoiceCount} invoice terpilih?`
                            : 'Apakah Anda yakin ingin membuat Invoice Penagihan?'}
                    </p>

                    {/* Date Input */}
                    <div className="mt-4">
                        <label
                            htmlFor="tanggal_dokumen"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Tanggal Dokumen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="tanggal_dokumen"
                            value={tanggalDokumen}
                            onChange={(e) => setTanggalDokumen(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Tanggal ini akan digunakan untuk Invoice Penagihan, Kwitansi, dan
                            Faktur Pajak.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 pb-6">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !isFormValid}
                        title={
                            !isFormValid ? 'Silakan isi tanggal dokumen terlebih dahulu' : ''
                        }
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Memproses...
                            </div>
                        ) : (
                            'Ya, Generate'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateInvoicePenagihanDialog;
