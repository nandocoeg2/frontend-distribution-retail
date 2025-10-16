import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatUtils';

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

const FakturPajakDetailModal = ({ isOpen, onClose, fakturPajak, isLoading }) => {
  if (!isOpen) {
    return null;
  }

  const detail = fakturPajak || {};

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Detail Faktur Pajak
            </h2>
            <p className='text-sm text-gray-500'>
              Ringkasan lengkap faktur pajak dan relasi data pendukung.
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-500 transition-colors duration-150 rounded-lg hover:bg-gray-100'
            aria-label='Tutup detail faktur pajak'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-4 space-y-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12 text-gray-500'>
              <div className='w-6 h-6 mr-3 border-b-2 border-blue-600 rounded-full animate-spin'></div>
              Memuat detail faktur pajak...
            </div>
          ) : (
            <>
              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Informasi Utama
                </h3>
                <div className='space-y-2'>
                  <InfoRow label='Nomor Faktur Pajak' value={detail.no_pajak || '-'} />
                  <InfoRow
                    label='Tanggal Invoice'
                    value={formatDate(detail.tanggal_invoice)}
                  />
                  <InfoRow
                    label='Status'
                    value={detail?.status?.status_code || '-'}
                  />
                  <InfoRow
                    label='Total Harga Jual'
                    value={formatCurrency(detail.total_harga_jual)}
                  />
                  <InfoRow
                    label='Potongan Harga'
                    value={formatCurrency(detail.potongan_harga)}
                  />
                  <InfoRow
                    label='Dasar Pengenaan Pajak (DPP)'
                    value={formatCurrency(detail.dasar_pengenaan_pajak)}
                  />
                  <InfoRow
                    label='PPN (Rp)'
                    value={formatCurrency(detail.ppn_rp)}
                  />
                  <InfoRow
                    label='PPN (%)'
                    value={
                      detail.ppn_percentage != null
                        ? `${detail.ppn_percentage}%`
                        : '-'
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Informasi Customer
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
                    label='NPWP'
                    value={detail?.customer?.npwp || '-'}
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
                  Invoice Penagihan Terkait
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nomor Invoice'
                    value={detail?.invoicePenagihan?.no_invoice || '-'}
                  />
                  <InfoRow
                    label='Tanggal Invoice'
                    value={formatDate(detail?.invoicePenagihan?.tanggal_invoice)}
                  />
                  <InfoRow
                    label='Total Invoice'
                    value={formatCurrency(detail?.invoicePenagihan?.total_price)}
                  />
                  <InfoRow
                    label='Customer Invoice'
                    value={
                      detail?.invoicePenagihan?.customer?.nama_customer || '-'
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Laporan Penerimaan Barang
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nomor LPB'
                    value={detail?.laporanPenerimaanBarang?.no_lpb || '-'}
                  />
                  <InfoRow
                    label='Tanggal Terima'
                    value={formatDate(
                      detail?.laporanPenerimaanBarang?.tanggal_terima,
                    )}
                  />
                  <InfoRow
                    label='Total Kuantitas'
                    value={
                      detail?.laporanPenerimaanBarang?.total_quantity != null
                        ? detail.laporanPenerimaanBarang.total_quantity
                        : '-'
                    }
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
                      {detail.auditTrails.map((audit) => renderAuditTrail(audit))}
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

export default FakturPajakDetailModal;
