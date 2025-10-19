import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';
import { exportTandaTerimaFakturToPDF } from './PrintTandaTerimaFaktur';

const InfoRow = ({ label, value }) => (
  <div className='flex justify-between py-2 border-b border-gray-100'>
    <span className='text-sm text-gray-500'>{label}</span>
    <span className='text-sm font-medium text-gray-900 text-right break-words max-w-[60%]'>
      {value ?? '-'}
    </span>
  </div>
);

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

const TandaTerimaFakturDetailModal = ({
  isOpen,
  onClose,
  tandaTerimaFaktur,
  isLoading,
}) => {
  if (!isOpen) {
    return null;
  }

  const detail = tandaTerimaFaktur || {};
  const handleExportPdf = () => {
    if (isLoading || !detail) {
      return;
    }
    exportTandaTerimaFakturToPDF(detail);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Detail Tanda Terima Faktur
            </h2>
            <p className='text-sm text-gray-500'>
              Ringkasan lengkap dokumen serah terima faktur.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleExportPdf}
              disabled={isLoading || !tandaTerimaFaktur}
              className='flex items-center px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 16v6m0 0l-3-3m3 3l3-3M6 10V5a2 2 0 012-2h8a2 2 0 012 2v5m1 0H5'
                />
              </svg>
              Export PDF
            </button>
            <button
              onClick={onClose}
              className='p-2 text-gray-500 transition-colors duration-150 rounded-lg hover:bg-gray-100'
              aria-label='Tutup detail tanda terima faktur'
            >
              <XMarkIcon className='w-6 h-6' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12 text-gray-500'>
              <div className='w-6 h-6 mr-3 border-b-2 border-blue-600 rounded-full animate-spin'></div>
              Memuat detail tanda terima faktur...
            </div>
          ) : (
            <>
              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Informasi Utama
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Kode Supplier'
                    value={detail.code_supplier || '-'}
                  />
                  <InfoRow
                    label='Tanggal'
                    value={formatDate(detail.tanggal)}
                  />
                  <InfoRow
                    label='Grand Total'
                    value={formatCurrency(detail.grand_total)}
                  />
                  <InfoRow
                    label='Status'
                    value={detail?.status?.status_code || '-'}
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Term of Payment
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Term of Payment'
                    value={detail?.termOfPayment?.name || '-'}
                  />
                  <InfoRow
                    label='Jumlah Hari'
                    value={
                      detail?.termOfPayment?.days != null
                        ? `${detail.termOfPayment.days} hari`
                        : '-'
                    }
                  />
                  <InfoRow
                    label='Deskripsi'
                    value={detail?.termOfPayment?.description || '-'}
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Customer
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nama Customer'
                    value={detail?.customer?.nama_customer || '-'}
                  />
                  <InfoRow
                    label='Kode Customer'
                    value={detail?.customer?.kode_customer || '-'}
                  />
                  <InfoRow
                    label='Alamat'
                    value={detail?.customer?.alamat || '-'}
                  />
                  <InfoRow
                    label='Kecamatan'
                    value={detail?.customer?.kecamatan?.nama_kecamatan || '-'}
                  />
                  <InfoRow
                    label='Kabupaten'
                    value={detail?.customer?.kabupaten?.nama_kabupaten || '-'}
                  />
                  <InfoRow
                    label='Provinsi'
                    value={detail?.customer?.provinsi?.nama_provinsi || '-'}
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Company
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nama Perusahaan'
                    value={detail?.company?.company_name || '-'}
                  />
                  <InfoRow
                    label='Kode Perusahaan'
                    value={detail?.company?.company_code || '-'}
                  />
                  <InfoRow
                    label='Alamat'
                    value={detail?.company?.address || '-'}
                  />
                  <InfoRow
                    label='Telepon'
                    value={detail?.company?.phone || '-'}
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Metadata
                </h3>
                <div className='space-y-2'>
                  <InfoRow label='Dibuat Oleh' value={detail.createdBy || '-'} />
                  <InfoRow
                    label='Diperbarui Oleh'
                    value={detail.updatedBy || '-'}
                  />
                  <InfoRow
                    label='Tanggal Dibuat'
                    value={formatDateTime(detail.createdAt)}
                  />
                  <InfoRow
                    label='Tanggal Diperbarui'
                    value={formatDateTime(detail.updatedAt)}
                  />
                </div>
              </section>

              {Array.isArray(detail.auditTrails) &&
                detail.auditTrails.length > 0 && (
                  <section>
                    <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                      Riwayat Perubahan
                    </h3>
                    <div className='space-y-2'>
                      {detail.auditTrails.map((audit) =>
                        renderAuditTrail(audit)
                      )}
                    </div>
                  </section>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TandaTerimaFakturDetailModal;
