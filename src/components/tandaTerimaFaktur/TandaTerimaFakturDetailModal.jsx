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
  const totalLaporan = Array.isArray(detail.laporanPenerimaanBarang)
    ? detail.laporanPenerimaanBarang.length
    : 0;
  const totalInvoice = Array.isArray(detail.invoicePenagihan)
    ? detail.invoicePenagihan.length
    : 0;
  const totalFakturPajak = Array.isArray(detail.invoicePenagihan)
    ? detail.invoicePenagihan.reduce((count, invoice) => {
        const faktur = invoice?.fakturPajak || invoice?.faktur_pajak;
        return faktur?.id ? count + 1 : count;
      }, 0)
    : 0;
  const groupCustomer =
    detail?.groupCustomer || detail?.customer?.groupCustomer || null;
  const customer = detail?.customer || null;
  const hasLaporan = totalLaporan > 0;
  const hasInvoice = totalInvoice > 0;

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
                  <InfoRow label='ID TTF' value={detail.id || '-'} />
                  <InfoRow
                    label='Kode Supplier'
                    value={detail.code_supplier || '-'}
                  />
                  <InfoRow
                    label='Tanggal'
                    value={
                      detail.tanggal ? formatDate(detail.tanggal) : '-'
                    }
                  />
                  <InfoRow
                    label='Grand Total'
                    value={
                      detail.grand_total != null
                        ? formatCurrency(detail.grand_total)
                        : '-'
                    }
                  />
                  <InfoRow
                    label='Status ID'
                    value={
                      detail.statusId ||
                      detail?.status?.id ||
                      detail?.status_id ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Status Code'
                    value={
                      detail?.status?.status_code ||
                      detail.status_code ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Status'
                    value={
                      detail?.status?.status_name ||
                      detail.status_name ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Term of Payment ID'
                    value={
                      detail.termOfPaymentId ||
                      detail?.termOfPayment?.id ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Group Customer ID'
                    value={
                      detail.groupCustomerId ||
                      groupCustomer?.id ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Company ID'
                    value={detail.companyId || detail?.company?.id || '-'}
                  />
                  <InfoRow label='Total LPB' value={totalLaporan} />
                  <InfoRow
                    label='Total Invoice Penagihan'
                    value={totalInvoice}
                  />
                  <InfoRow
                    label='Total Faktur Pajak'
                    value={totalFakturPajak}
                  />
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Term of Payment
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Kode TOP'
                    value={
                      detail?.termOfPayment?.kode_top ||
                      detail?.termOfPayment?.kodeTop ||
                      detail?.termOfPayment?.name ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Jumlah Hari'
                    value={
                      detail?.termOfPayment?.batas_hari != null
                        ? `${detail.termOfPayment.batas_hari} hari`
                        : detail?.termOfPayment?.days != null
                          ? `${detail.termOfPayment.days} hari`
                          : '-'
                    }
                  />
                  {(detail?.termOfPayment?.description ||
                    detail?.termOfPayment?.keterangan) && (
                    <InfoRow
                      label='Deskripsi'
                      value={
                        detail?.termOfPayment?.description ||
                        detail?.termOfPayment?.keterangan
                      }
                    />
                  )}
                </div>
              </section>

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Group Customer
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nama Group'
                    value={
                      groupCustomer?.nama_group ||
                      groupCustomer?.namaGroup ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Kode Group'
                    value={
                      groupCustomer?.kode_group ||
                      groupCustomer?.kodeGroup ||
                      '-'
                    }
                  />
                  {(groupCustomer?.alamat || groupCustomer?.address) && (
                    <InfoRow
                      label='Alamat'
                      value={groupCustomer?.alamat || groupCustomer?.address}
                    />
                  )}
                  {groupCustomer?.npwp && (
                    <InfoRow
                      label='NPWP'
                      value={groupCustomer?.npwp}
                    />
                  )}
                </div>
              </section>

              {customer && (
                <section>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                    Customer
                  </h3>
                  <div className='space-y-2'>
                    <InfoRow
                      label='Nama Customer'
                      value={
                        customer?.namaCustomer ||
                        customer?.nama_customer ||
                        '-'
                      }
                    />
                    <InfoRow
                      label='Kode Customer'
                      value={
                        customer?.kodeCustomer ||
                        customer?.kode_customer ||
                        '-'
                      }
                    />
                    {customer?.alamat && (
                      <InfoRow label='Alamat' value={customer.alamat} />
                    )}
                    {(customer?.kecamatan?.nama_kecamatan ||
                      customer?.kecamatan?.namaKecamatan) && (
                      <InfoRow
                        label='Kecamatan'
                        value={
                          customer?.kecamatan?.nama_kecamatan ||
                          customer?.kecamatan?.namaKecamatan
                        }
                      />
                    )}
                    {(customer?.kabupaten?.nama_kabupaten ||
                      customer?.kabupaten?.namaKabupaten) && (
                      <InfoRow
                        label='Kabupaten'
                        value={
                          customer?.kabupaten?.nama_kabupaten ||
                          customer?.kabupaten?.namaKabupaten
                        }
                      />
                    )}
                    {(customer?.provinsi?.nama_provinsi ||
                      customer?.provinsi?.namaProvinsi) && (
                      <InfoRow
                        label='Provinsi'
                        value={
                          customer?.provinsi?.nama_provinsi ||
                          customer?.provinsi?.namaProvinsi
                        }
                      />
                    )}
                  </div>
                </section>
              )}

              <section>
                <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                  Company
                </h3>
                <div className='space-y-2'>
                  <InfoRow
                    label='Nama Perusahaan'
                    value={
                      detail?.company?.nama_perusahaan ||
                      detail?.company?.namaPerusahaan ||
                      detail?.company?.company_name ||
                      '-'
                    }
                  />
                  <InfoRow
                    label='Kode Perusahaan'
                    value={
                      detail?.company?.kode_company ||
                      detail?.company?.kodeCompany ||
                      detail?.company?.company_code ||
                      '-'
                    }
                  />
                  {(detail?.company?.alamat || detail?.company?.address) && (
                    <InfoRow
                      label='Alamat'
                      value={detail?.company?.alamat || detail?.company?.address}
                    />
                  )}
                  {(detail?.company?.telepon || detail?.company?.phone) && (
                    <InfoRow
                      label='Telepon'
                      value={detail?.company?.telepon || detail?.company?.phone}
                    />
                  )}
                </div>
              </section>

              {hasLaporan && (
                <section>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                    Laporan Penerimaan Barang
                  </h3>
                  <div className='space-y-3'>
                    {detail.laporanPenerimaanBarang.map((laporan, index) => (
                      <div
                        key={laporan.id || `laporan-${index}`}
                        className='p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2'
                      >
                        <InfoRow
                          label='ID Laporan'
                          value={laporan.id || '-'}
                        />
                        {(laporan.purchaseOrderId ||
                          laporan.purchase_order_id) && (
                          <InfoRow
                            label='Purchase Order ID'
                            value={
                              laporan.purchaseOrderId ||
                              laporan.purchase_order_id
                            }
                          />
                        )}
                        {laporan.statusId && (
                          <InfoRow
                            label='Status ID'
                            value={laporan.statusId}
                          />
                        )}
                        {laporan.status_id && !laporan.statusId && (
                          <InfoRow
                            label='Status ID'
                            value={laporan.status_id}
                          />
                        )}
                        {laporan.createdAt && (
                          <InfoRow
                            label='Dibuat Pada'
                            value={formatDateTime(laporan.createdAt)}
                          />
                        )}
                        {laporan.created_at && !laporan.createdAt && (
                          <InfoRow
                            label='Dibuat Pada'
                            value={formatDateTime(laporan.created_at)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {hasInvoice && (
                <section>
                  <h3 className='mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                    Invoice Penagihan
                  </h3>
                  <div className='space-y-3'>
                    {detail.invoicePenagihan.map((invoice, index) => {
                      const faktur =
                        invoice?.fakturPajak || invoice?.faktur_pajak;
                      return (
                        <div
                          key={invoice.id || `invoice-${index}`}
                          className='p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2'
                        >
                          <InfoRow
                            label='ID Invoice'
                            value={invoice.id || '-'}
                          />
                          <InfoRow
                            label='No Invoice Penagihan'
                            value={
                              invoice.no_invoice_penagihan ||
                              invoice.noInvoicePenagihan ||
                              '-'
                            }
                          />
                          {(invoice.purchaseOrderId ||
                            invoice.purchase_order_id) && (
                            <InfoRow
                              label='Purchase Order ID'
                              value={
                                invoice.purchaseOrderId ||
                                invoice.purchase_order_id
                              }
                            />
                          )}
                          {invoice.statusId && (
                            <InfoRow
                              label='Status ID'
                              value={invoice.statusId}
                            />
                          )}
                          {invoice.status_id && !invoice.statusId && (
                            <InfoRow
                              label='Status ID'
                              value={invoice.status_id}
                            />
                          )}
                          {invoice.createdAt && (
                            <InfoRow
                              label='Dibuat Pada'
                              value={formatDateTime(invoice.createdAt)}
                            />
                          )}
                          {invoice.created_at && !invoice.createdAt && (
                            <InfoRow
                              label='Dibuat Pada'
                              value={formatDateTime(invoice.created_at)}
                            />
                          )}
                          {faktur && (
                            <>
                              <InfoRow
                                label='ID Faktur Pajak'
                                value={faktur.id || '-'}
                              />
                              <InfoRow
                                label='No Faktur Pajak'
                                value={
                                  faktur.no_pajak ||
                                  faktur.noPajak ||
                                  '-'
                                }
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
