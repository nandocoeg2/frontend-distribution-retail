import React, { useState, useEffect, useMemo } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import InfoTable from '../ui/InfoTable';
import ActivityTimeline from '../common/ActivityTimeline';
import { formatDateTime } from '../../utils/formatUtils';
import { resolveStatusVariant } from '../../utils/modalUtils';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  StatusBadge,
  LoadingDots,
} from '../ui';

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) {
    return '-';
  }

  const value = Number(bytes);
  if (Number.isNaN(value) || value === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  const size = value / 1024 ** Math.max(index, 0);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const renderFileList = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    return <span className='text-sm text-gray-500'>Tidak ada lampiran</span>;
  }

  return (
    <ul className='space-y-3'>
      {files.map((file) => {
        const key = file?.id || file?.filename || file;
        return (
          <li
            key={key}
            className='flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white shadow-sm'
          >
            <div>
              <p className='text-sm font-medium text-gray-900'>
                {file?.originalName || file?.filename || key}
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                {(file?.mimeType || file?.mimetype || 'Tipe tidak dikenal')} •{' '}
                {formatFileSize(file?.size)}
              </p>
              {file?.createdAt && (
                <p className='text-[11px] text-gray-400 mt-0.5'>
                  Diunggah: {formatDateTime(file.createdAt)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const LaporanPenerimaanBarangDetailCard = ({
  report,
  onClose,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (report) {
      setActiveTab('overview');
    }
  }, [report]);

  const statusLabel = useMemo(() => {
    return (
      report?.status?.status_name ||
      report?.status?.status_code ||
      report?.statusId ||
      '-'
    );
  }, [report]);

  const statusVariant = useMemo(
    () => resolveStatusVariant(statusLabel),
    [statusLabel]
  );

  const overviewDetails = useMemo(() => {
    return [
      {
        label: 'Nomor Purchase Order',
        value:
          report?.purchaseOrder?.po_number || report?.purchaseOrderId || '-',
        copyable: Boolean(report?.purchaseOrderId),
      },
      {
        label: 'Tanggal Purchase Order',
        value: formatDateTime(
          report?.tanggal_po || report?.purchaseOrder?.tanggal_po
        ),
      },
      {
        label: 'Customer',
        value: report?.customer?.namaCustomer || report?.customerId || '-',
        copyable: Boolean(report?.customerId),
      },
      {
        label: 'Alamat Customer',
        value: report?.customer?.alamat || '-',
      },
      {
        label: 'Termin Pembayaran',
        value: report?.termOfPayment?.nama_top || report?.termin_bayar || '-',
      },
      {
        label: 'Status',
        component: (
          <StatusBadge
            status={statusLabel || 'Tidak ada status'}
            variant={statusVariant}
            size='sm'
            dot
          />
        ),
      },
      {
        label: 'Lampiran',
        component: loading ? (
          <div className='flex items-center text-sm text-gray-500'>
            <LoadingDots size='sm' className='mr-2' />
            Memuat lampiran...
          </div>
        ) : (
          renderFileList(report?.files)
        ),
      },
    ];
  }, [report, statusLabel, statusVariant, loading]);

  const metadataDetails = useMemo(() => {
    return [
      {
        label: 'ID Laporan',
        value: report?.id || '-',
        copyable: Boolean(report?.id),
      },
      {
        label: 'Dibuat Oleh',
        value: report?.createdBy || '-',
        copyable: Boolean(report?.createdBy),
      },
      {
        label: 'Dibuat Pada',
        value: formatDateTime(report?.createdAt),
      },
      {
        label: 'Diperbarui Oleh',
        value: report?.updatedBy || '-',
        copyable: Boolean(report?.updatedBy),
      },
      {
        label: 'Diperbarui Pada',
        value: formatDateTime(report?.updatedAt),
      },
    ];
  }, [report]);

  const auditTrails = useMemo(() => {
    if (!Array.isArray(report?.auditTrails)) {
      return [];
    }
    return report.auditTrails;
  }, [report]);

  const fileCount = Array.isArray(report?.files) ? report.files.length : 0;
  const auditTrailCount = auditTrails.length;
  const purchaseOrderNumber =
    report?.purchaseOrder?.po_number || report?.purchaseOrderId || 'Tidak ada PO';

  if (!report) return null;

  return (
    <div className='bg-white shadow-md rounded-lg p-6 mt-6'>
      {/* Header */}
      <div className='flex justify-between items-start mb-6'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>
            Detail Laporan Penerimaan Barang
          </h2>
          <p className='text-sm text-gray-600 flex items-center gap-2 mt-1'>
            <TagIcon className='h-4 w-4 text-gray-400' />
            Purchase Order: {loading ? 'Memuat...' : purchaseOrderNumber}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            Lampiran: {loading ? '...' : fileCount} • Audit Trail:{' '}
            {loading ? '...' : auditTrailCount}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <StatusBadge status={statusLabel || '-'} variant={statusVariant} />
          {onClose && (
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              title='Close'
            >
              <XMarkIcon className='w-5 h-5 text-gray-500' />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-sm text-gray-600'>
            Loading laporan detail...
          </span>
        </div>
      ) : (
        <div>
          {/* Tab Navigation */}
          <TabContainer
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant='underline'
            className='mb-6'
          >
            <Tab
              id='overview'
              label='Overview'
              icon={<DocumentTextIcon className='w-4 h-4' />}
            />
            <Tab
              id='timeline'
              label='Timeline'
              icon={<ClockIcon className='w-4 h-4' />}
              badge={auditTrailCount}
            />
          </TabContainer>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-6'>
                {/* Informasi Utama */}
                <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                  <div className='flex items-center mb-4'>
                    <DocumentTextIcon className='h-5 w-5 text-gray-500 mr-2' />
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Informasi Utama
                    </h3>
                  </div>
                  <InfoTable data={overviewDetails} />
                </div>

                {/* Metadata */}
                <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                  <div className='flex items-center mb-4'>
                    <ClockIcon className='h-5 w-5 text-gray-500 mr-2' />
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Metadata
                    </h3>
                  </div>
                  <InfoTable data={metadataDetails} />
                </div>
              </div>
            </TabPanel>

            <TabPanel tabId='timeline'>
              <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                <div className='flex items-center mb-4'>
                  <ClockIcon className='h-5 w-5 text-gray-500 mr-2' />
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Riwayat Aktivitas
                  </h3>
                </div>

                {auditTrails.length > 0 ? (
                  <ActivityTimeline
                    auditTrails={auditTrails}
                    title=''
                    showCount={false}
                    emptyMessage='Belum ada aktivitas untuk laporan ini.'
                  />
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    Belum ada aktivitas untuk laporan ini.
                  </div>
                )}
              </div>
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default LaporanPenerimaanBarangDetailCard;
