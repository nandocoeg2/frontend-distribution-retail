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
    return <span className='text-xs text-gray-500'>Tidak ada lampiran</span>;
  }
  return (
    <ul className='space-y-1'>
      {files.map((file) => {
        const key = file?.id || file?.filename || file;
        return (
          <li key={key} className='flex items-center justify-between p-1.5 rounded border border-gray-200 bg-white text-xs'>
            <span className='font-medium text-gray-900 truncate'>{file?.originalName || file?.filename || key}</span>
            <span className='text-gray-500 ml-2'>{formatFileSize(file?.size)}</span>
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
        label: 'TOP',
        value: report?.termOfPayment?.kode_top || report?.top || '-',
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
    <div className='bg-white shadow rounded-lg p-3 mt-3'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          <TagIcon className='h-4 w-4 text-orange-600' />
          <div>
            <h2 className='text-sm font-bold text-gray-900'>Detail LPB</h2>
            <p className='text-xs text-gray-600'>PO: {loading ? '...' : purchaseOrderNumber}</p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <StatusBadge status={statusLabel || '-'} variant={statusVariant} size='xs' />
          {onClose && (
            <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded' title='Close'>
              <XMarkIcon className='w-4 h-4 text-gray-500' />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-4'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-xs text-gray-600'>Loading...</span>
        </div>
      ) : (
        <div>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant='underline' className='mb-2'>
            <Tab id='overview' label='Overview' icon={<DocumentTextIcon className='w-3 h-3' />} />
            <Tab id='timeline' label='Timeline' icon={<ClockIcon className='w-3 h-3' />} badge={auditTrailCount} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-2'>
                <div className='border border-gray-200 rounded p-2'>
                  <div className='flex items-center mb-2'>
                    <DocumentTextIcon className='h-3 w-3 text-gray-500 mr-1' />
                    <span className='text-xs font-semibold text-gray-900'>Info Utama</span>
                  </div>
                  <InfoTable compact data={overviewDetails} />
                </div>
                <div className='border border-gray-200 rounded p-2'>
                  <div className='flex items-center mb-2'>
                    <ClockIcon className='h-3 w-3 text-gray-500 mr-1' />
                    <span className='text-xs font-semibold text-gray-900'>Metadata</span>
                  </div>
                  <InfoTable compact data={metadataDetails} />
                </div>
              </div>
            </TabPanel>

            <TabPanel tabId='timeline'>
              {auditTrails.length > 0 ? (
                <ActivityTimeline auditTrails={auditTrails} title='' showCount={false} emptyMessage='Belum ada aktivitas.' />
              ) : (
                <div className='py-4 text-center text-xs text-gray-500'>Belum ada aktivitas</div>
              )}
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default LaporanPenerimaanBarangDetailCard;
