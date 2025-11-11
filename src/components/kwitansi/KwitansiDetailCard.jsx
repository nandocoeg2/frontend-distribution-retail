import React from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { InfoTable, StatusBadge } from '../ui';

const renderAuditTrail = (audit) => {
  if (!audit) {
    return null;
  }

  return (
    <div
      key={audit.id}
      className='p-3 mb-3 border border-gray-200 rounded-lg bg-gray-50'
    >
      <div className='flex items-center justify-between mb-2'>
        <span className='text-sm font-semibold text-gray-800'>
          {audit.action || 'PERUBAHAN'}
        </span>
        <span className='text-xs text-gray-500'>
          {formatDateTime(audit.timestamp)}
        </span>
      </div>
      <div className='text-xs text-gray-500 mb-2'>
        {audit.userId ? `Oleh: ${audit.userId}` : 'User tidak diketahui'}
      </div>
      {audit.changes && (
        <div className='overflow-auto text-xs text-gray-600 bg-white rounded border border-gray-200 p-2'>
          <pre className='whitespace-pre-wrap break-words'>
            {JSON.stringify(audit.changes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('paid')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('failed') || value.includes('overdue')) {
    return 'danger';
  }

  if (value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('pending')) {
    return 'secondary';
  }

  return 'default';
};

const KwitansiDetailCard = ({ 
  kwitansi, 
  onClose, 
  loading = false,
  onExport,
  exportLoading,
}) => {
  if (!kwitansi) return null;

  const detail = kwitansi || {};
  const statusCode = detail?.status?.status_code;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Detail Kwitansi
          </h2>
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            {detail.no_kwitansi || 'No kwitansi available'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onExport && (
            <button
              onClick={() => onExport(detail)}
              disabled={loading || exportLoading || !detail?.id}
              className="inline-flex items-center px-3 py-2 border border-indigo-600 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Print Kwitansi"
            >
              {exportLoading ? (
                <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1'></span>
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              )}
              Print
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading kwitansi details...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Informasi Utama */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Informasi Utama</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Nomor Kwitansi', value: detail.no_kwitansi || '-', copyable: true },
                { label: 'Tanggal Kwitansi', value: formatDate(detail.tanggal) },
                { label: 'Nama Penerima', value: detail.kepada || '-' },
                { label: 'Grand Total', value: formatCurrency(detail.grand_total) },
                {
                  label: 'Status',
                  component: statusCode ? (
                    <StatusBadge
                      status={statusCode}
                      variant={resolveStatusVariant(statusCode)}
                      dot
                    />
                  ) : <span>-</span>,
                },
              ]}
            />
          </div>

          {/* Term of Payment */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Term of Payment</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Term of Payment', value: detail?.termOfPayment?.name || '-' },
                { 
                  label: 'Jumlah Hari', 
                  value: detail?.termOfPayment?.days != null 
                    ? `${detail.termOfPayment.days} hari` 
                    : '-' 
                },
                { label: 'Deskripsi', value: detail?.termOfPayment?.description || '-' },
              ]}
            />
          </div>

          {/* Invoice Penagihan Terkait */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Invoice Penagihan Terkait</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Nomor Invoice', value: detail?.invoicePenagihan?.no_invoice || '-', copyable: true },
                { label: 'Tanggal Invoice', value: formatDate(detail?.invoicePenagihan?.tanggal_invoice) },
                { label: 'Total Invoice', value: formatCurrency(detail?.invoicePenagihan?.total_price) },
                { label: 'Customer', value: detail?.invoicePenagihan?.customer?.nama_customer || '-' },
                { label: 'Kode Customer', value: detail?.invoicePenagihan?.customer?.kode_customer || '-' },
              ]}
            />
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
            </div>
            <InfoTable
              data={[
                { label: 'Dibuat Oleh', value: detail.createdBy || '-' },
                { label: 'Tanggal Dibuat', value: formatDateTime(detail.createdAt) },
                { label: 'Diperbarui Oleh', value: detail.updatedBy || '-' },
                { label: 'Tanggal Diperbarui', value: formatDateTime(detail.updatedAt) },
              ]}
            />
          </div>

          {/* Audit Trails */}
          {Array.isArray(detail.auditTrails) && detail.auditTrails.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Riwayat Perubahan</h3>
              </div>
              <div className='space-y-2'>
                {detail.auditTrails.map((audit) => renderAuditTrail(audit))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KwitansiDetailCard;
