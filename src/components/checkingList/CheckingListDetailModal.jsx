import React, { useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import InfoTable from '../ui/InfoTable';
import { formatDateTime } from '../../utils/formatUtils';

const CheckingListDetailModal = ({
  isOpen,
  onClose,
  checklist,
  isLoading = false,
}) => {
  const baseInfo = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return [
      {
        label: 'Checklist ID',
        value: checklist.id || checklist.checklistId || '-',
        copyable: Boolean(checklist?.id || checklist?.checklistId),
      },
      {
        label: 'Tanggal Checklist',
        value: formatDateTime(checklist?.tanggal),
      },
      {
        label: 'Checker',
        value: checklist?.checker || '-',
      },
      {
        label: 'Driver',
        value: checklist?.driver || '-',
      },
      {
        label: 'Nomor Kendaraan',
        value: checklist?.mobil || '-',
      },
      {
        label: 'Kota Tujuan',
        value: checklist?.kota || '-',
      },
      {
        label: 'Status ID',
        value: checklist?.statusId || checklist?.status?.id || '-',
        copyable: Boolean(checklist?.statusId || checklist?.status?.id),
      },
      {
        label: 'Status Checklist',
        value:
          checklist?.status?.status_name ||
          checklist?.status?.status_code ||
          '-',
      },
      {
        label: 'Kode Status Checklist',
        value: checklist?.status?.status_code || '-',
      },
      {
        label: 'Kategori Status Checklist',
        value: checklist?.status?.category || '-',
      },
      {
        label: 'Dibuat Oleh',
        value: checklist?.createdBy || '-',
      },
      {
        label: 'Diperbarui Oleh',
        value: checklist?.updatedBy || '-',
      },
      {
        label: 'Dibuat Pada',
        value: formatDateTime(checklist?.createdAt),
      },
      {
        label: 'Terakhir Diperbarui',
        value: formatDateTime(checklist?.updatedAt),
      },
    ];
  }, [checklist]);

  const suratJalanInfo = useMemo(() => {
    const suratJalan = checklist?.suratJalan;
    if (!suratJalan) {
      return [];
    }

    return [
      {
        label: 'ID Surat Jalan',
        value: suratJalan.id || checklist.suratJalanId || '-',
        copyable: Boolean(suratJalan?.id || checklist?.suratJalanId),
      },
      {
        label: 'Nomor Surat Jalan',
        value: suratJalan.no_surat_jalan || '-',
      },
      {
        label: 'Deliver To',
        value: suratJalan.deliver_to || '-',
      },
      {
        label: 'PIC',
        value: suratJalan.PIC || '-',
      },
      {
        label: 'Alamat Tujuan',
        value: suratJalan.alamat_tujuan || '-',
      },
      {
        label: 'Status Surat Jalan',
        value:
          suratJalan?.status?.status_code ||
          suratJalan?.status?.status_name ||
          '-',
      },
      {
        label: 'Purchase Order ID',
        value: suratJalan?.purchaseOrder?.id || '-',
        copyable: Boolean(suratJalan?.purchaseOrder?.id),
      },
      {
        label: 'Nomor PO',
        value: suratJalan?.purchaseOrder?.po_number || '-',
      },
      {
        label: 'Customer ID',
        value: suratJalan?.purchaseOrder?.customer?.id || '-',
        copyable: Boolean(suratJalan?.purchaseOrder?.customer?.id),
      },
      {
        label: 'Nama Customer',
        value:
          suratJalan?.purchaseOrder?.customer?.nama_customer ||
          suratJalan?.customer?.nama_customer ||
          '-',
      },
      {
        label: 'Kode Customer',
        value:
          suratJalan?.purchaseOrder?.customer?.kode_customer ||
          suratJalan?.customer?.kode_customer ||
          '-',
      },
      {
        label: 'Supplier ID',
        value:
          suratJalan?.purchaseOrder?.supplier?.id ||
          suratJalan?.supplier?.id ||
          '-',
        copyable: Boolean(
          suratJalan?.purchaseOrder?.supplier?.id ||
            suratJalan?.supplier?.id
        ),
      },
      {
        label: 'Nama Supplier',
        value:
          suratJalan?.purchaseOrder?.supplier?.nama_supplier ||
          suratJalan?.supplier?.nama_supplier ||
          '-',
      },
      {
        label: 'Kode Supplier',
        value:
          suratJalan?.purchaseOrder?.supplier?.code ||
          suratJalan?.supplier?.code ||
          '-',
      },
      {
        label: 'Invoice ID',
        value: suratJalan?.invoice?.id || '-',
        copyable: Boolean(suratJalan?.invoice?.id),
      },
      {
        label: 'Nomor Invoice',
        value: suratJalan?.invoice?.no_invoice || '-',
      },
      {
        label: 'Total Invoice',
        value: suratJalan?.invoice?.total_price || '-',
      },
    ];
  }, [checklist]);

  const auditTrailEntries = useMemo(() => {
    if (!Array.isArray(checklist?.auditTrails)) {
      return [];
    }

    return checklist.auditTrails.map((trail) => ({
      id: trail?.id || `${trail?.action}-${trail?.timestamp}`,
      action: trail?.action || '-',
      timestamp: formatDateTime(trail?.timestamp),
      userId: trail?.userId || '-',
    }));
  }, [checklist]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Detail Checklist Surat Jalan
            </h2>
            <p className='text-sm text-gray-500'>
              Ringkasan informasi checklist beserta data surat jalan terkait.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            aria-label='Tutup detail checklist'
          >
            <XMarkIcon className='h-6 w-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-6'>
          {isLoading ? (
            <div className='flex h-48 items-center justify-center text-sm text-gray-500'>
              <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
              <span className='ml-3'>Memuat detail checklist...</span>
            </div>
          ) : !checklist ? (
            <div className='flex h-48 items-center justify-center text-sm text-gray-500'>
              Data checklist tidak ditemukan.
            </div>
          ) : (
            <div className='space-y-8'>
              <section>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Informasi Checklist
                </h3>
                <InfoTable data={baseInfo} />
              </section>

              {suratJalanInfo.length > 0 && (
                <section>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                    Data Surat Jalan
                  </h3>
                  <InfoTable data={suratJalanInfo} />
                </section>
              )}

              {auditTrailEntries.length > 0 && (
                <section>
                  <h3 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                    Audit Trail
                  </h3>
                  <div className='mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4'>
                    {auditTrailEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className='rounded-md border border-gray-200 bg-white p-3 shadow-sm'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          {entry.action}
                        </p>
                        <p className='mt-1 text-xs text-gray-500'>
                          {entry.timestamp}
                        </p>
                        <p className='mt-1 text-xs text-gray-400'>
                          User ID: {entry.userId}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckingListDetailModal;
