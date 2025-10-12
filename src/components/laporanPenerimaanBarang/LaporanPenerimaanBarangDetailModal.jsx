import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

const LaporanPenerimaanBarangDetailModal = ({
  isOpen,
  onClose,
  report,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

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
        component: isLoading ? (
          <div className='flex items-center text-sm text-gray-500'>
            <LoadingDots size='sm' className='mr-2' />
            Memuat lampiran...
          </div>
        ) : (
          renderFileList(report?.files)
        ),
      },
    ];
  }, [report, statusLabel, statusVariant, isLoading]);

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
  const fileCountLabel = isLoading ? '...' : fileCount;
  const auditTrailCountLabel = isLoading ? '...' : auditTrailCount;
  const purchaseOrderLabel = isLoading ? 'Memuat...' : purchaseOrderNumber;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📄' },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: '🕒',
      badge: isLoading ? undefined : auditTrailCount,
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <div>
            <h3 className='text-2xl font-semibold text-gray-900'>Detail Laporan Penerimaan Barang</h3>
            <p className='text-sm text-gray-600 mt-1'>
              Purchase Order: {purchaseOrderLabel}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              Lampiran: {fileCountLabel} • Audit Trail: {auditTrailCountLabel}
            </p>
          </div>
          <div className='flex items-start gap-3'>
            <StatusBadge status={statusLabel || '-'} variant={statusVariant} />
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500'
            >
              <XMarkIcon className='h-6 w-6' />
            </button>
          </div>
        </div>

        <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant='default'>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              badge={tab.badge}
            />
          ))}
        </TabContainer>

        <div className='flex-1 overflow-y-auto p-6 bg-gray-50'>
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-8'>
                {isLoading ? (
                  <div className='flex flex-col items-center justify-center py-10 text-sm text-gray-500'>
                    <LoadingDots className='mb-3' />
                    Memuat detail laporan...
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>Informasi Utama</h4>
                      <InfoTable data={overviewDetails} />
                    </div>

                    <div>
                      <h4 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>Metadata</h4>
                      <InfoTable data={metadataDetails} />
                    </div>
                  </>
                )}
              </div>
            </TabPanel>

            <TabPanel tabId='timeline'>
              {isLoading ? (
                <div className='flex flex-col items-center justify-center py-10 text-sm text-gray-500'>
                  <LoadingDots className='mb-3' />
                  Memuat riwayat aktivitas...
                </div>
              ) : (
                <ActivityTimeline
                  auditTrails={auditTrails}
                  title='Riwayat Aktivitas'
                  emptyMessage='Belum ada aktivitas untuk laporan ini.'
                />
              )}
            </TabPanel>
          </TabContent>
        </div>

        <div className='px-6 py-4 border-t border-gray-200 bg-white flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenerimaanBarangDetailModal;


