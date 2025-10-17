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
        label: 'Surat Jalan ID',
        value: checklist?.suratJalanId || '-',
        copyable: Boolean(checklist?.suratJalanId),
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
    const suratJalanData = Array.isArray(checklist?.suratJalan)
      ? checklist.suratJalan
      : checklist?.suratJalan
        ? [checklist.suratJalan]
        : [];

    if (suratJalanData.length === 0) {
      return [];
    }

    const primarySuratJalan = suratJalanData[0];
    const additionalSuratJalanCount =
      suratJalanData.length > 1 ? suratJalanData.length - 1 : 0;

    const info = [
      {
        label: 'ID Surat Jalan',
        value: primarySuratJalan.id || checklist.suratJalanId || '-',
        copyable: Boolean(primarySuratJalan?.id || checklist?.suratJalanId),
      },
      {
        label: 'Nomor Surat Jalan',
        value: primarySuratJalan.no_surat_jalan || '-',
      },
      {
        label: 'Deliver To',
        value: primarySuratJalan.deliver_to || '-',
      },
      {
        label: 'PIC',
        value: primarySuratJalan.PIC || '-',
      },
      {
        label: 'Alamat Tujuan',
        value: primarySuratJalan.alamat_tujuan || '-',
      },
      {
        label: 'Status Surat Jalan',
        value:
          primarySuratJalan?.status?.status_code ||
          primarySuratJalan?.status?.status_name ||
          '-',
      },
      {
        label: 'Purchase Order ID',
        value: primarySuratJalan?.purchaseOrder?.id || '-',
        copyable: Boolean(primarySuratJalan?.purchaseOrder?.id),
      },
      {
        label: 'Nomor PO',
        value: primarySuratJalan?.purchaseOrder?.po_number || '-',
      },
      {
        label: 'Customer ID',
        value: primarySuratJalan?.purchaseOrder?.customer?.id || '-',
        copyable: Boolean(primarySuratJalan?.purchaseOrder?.customer?.id),
      },
      {
        label: 'Nama Customer',
        value:
          primarySuratJalan?.purchaseOrder?.customer?.nama_customer ||
          primarySuratJalan?.customer?.nama_customer ||
          '-',
      },
      {
        label: 'Kode Customer',
        value:
          primarySuratJalan?.purchaseOrder?.customer?.kode_customer ||
          primarySuratJalan?.customer?.kode_customer ||
          '-',
      },
      {
        label: 'Supplier ID',
        value:
          primarySuratJalan?.purchaseOrder?.supplier?.id ||
          primarySuratJalan?.supplier?.id ||
          '-',
        copyable: Boolean(
          primarySuratJalan?.purchaseOrder?.supplier?.id ||
            primarySuratJalan?.supplier?.id
        ),
      },
      {
        label: 'Nama Supplier',
        value:
          primarySuratJalan?.purchaseOrder?.supplier?.nama_supplier ||
          primarySuratJalan?.supplier?.nama_supplier ||
          '-',
      },
      {
        label: 'Kode Supplier',
        value:
          primarySuratJalan?.purchaseOrder?.supplier?.code ||
          primarySuratJalan?.supplier?.code ||
          '-',
      },
      {
        label: 'Invoice ID',
        value: primarySuratJalan?.invoice?.id || '-',
        copyable: Boolean(primarySuratJalan?.invoice?.id),
      },
      {
        label: 'Nomor Invoice',
        value: primarySuratJalan?.invoice?.no_invoice || '-',
      },
      {
        label: 'Total Invoice',
        value: primarySuratJalan?.invoice?.total_price || '-',
      },
    ];

    if (additionalSuratJalanCount > 0) {
      info.push({
        label: 'Surat Jalan Lainnya',
        value: `${additionalSuratJalanCount} dokumen terkait lainnya`,
      });
    }

    return info;
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
