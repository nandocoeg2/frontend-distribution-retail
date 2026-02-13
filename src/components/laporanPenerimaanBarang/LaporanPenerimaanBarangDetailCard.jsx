import React, { useState, useEffect, useMemo } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
  TagIcon,
  ListBulletIcon,
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

/**
 * Format quantity with UOM
 * @param {number|null} qty - Quantity value
 * @param {string|null} uom - Unit of measure (e.g., "CTN", "PCS")
 * @returns {string} Formatted quantity string
 */
const formatQtyWithUom = (qty, uom) => {
  if (qty === null || qty === undefined) return '-';
  const unit = uom || 'PCS';
  return `${qty} ${unit}`;
};

/**
 * Get style class for selisih value
 * @param {number|null} selisih - Difference value
 * @returns {string} Tailwind CSS classes
 */
const getSelisihStyle = (selisih) => {
  if (selisih === null || selisih === undefined) return 'text-gray-400';
  if (selisih < 0) return 'text-red-600 font-medium bg-red-50';
  if (selisih > 0) return 'text-green-600 font-medium bg-green-50';
  return 'text-gray-600';
};

/**
 * Format selisih value with prefix
 * @param {number|null} selisih - Difference value
 * @param {string|null} uom - Unit of measure
 * @returns {string} Formatted selisih string
 */
const formatSelisih = (selisih, uom) => {
  if (selisih === null || selisih === undefined) return '-';
  if (selisih === 0) return `0 ${uom || 'PCS'}`;
  const prefix = selisih > 0 ? '+' : '';
  return `${prefix}${selisih} ${uom || 'PCS'}`;
};

const LaporanPenerimaanBarangDetailCard = ({
  report,
  onClose,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    if (report) {
      setActiveTab('items');
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

  // Merge PO details and LPB details for comparison table
  const { mergedItems, selisihCount } = useMemo(() => {
    const poDetails = report?.purchaseOrder?.purchaseOrderDetails || [];
    const lpbDetails = report?.detailItems || [];

    // Create map from PO Details by PLU
    const poDetailsMap = new Map();
    poDetails.forEach((detail) => {
      poDetailsMap.set(detail.plu, detail);
    });

    // Create map from LPB Details by PLU
    const lpbDetailsMap = new Map();
    lpbDetails.forEach((item) => {
      lpbDetailsMap.set(item.plu, item);
    });

    // Collect all unique PLUs, prioritizing PO order
    const processedPLUs = new Set();
    const items = [];

    // First, add items from PO (to maintain PO order)
    poDetails.forEach((poDetail) => {
      const plu = poDetail.plu;
      if (!processedPLUs.has(plu)) {
        processedPLUs.add(plu);
        const lpbDetail = lpbDetailsMap.get(plu);

        const qtyPO = poDetail.total_quantity_order ?? null;
        const qtyLPB = lpbDetail?.total_quantity_order ?? null;

        let qtySelisih = null;
        if (qtyPO !== null && qtyLPB !== null) {
          qtySelisih = qtyLPB - qtyPO;
        }

        items.push({
          plu,
          nama_barang: poDetail.nama_barang || lpbDetail?.nama_barang || '-',
          qtyPO,
          qtyLPB,
          qtySelisih,
          uom: poDetail.item?.uom || 'PCS',
        });
      }
    });

    // Then, add items only in LPB (not in PO)
    lpbDetails.forEach((lpbDetail) => {
      const plu = lpbDetail.plu;
      if (!processedPLUs.has(plu)) {
        processedPLUs.add(plu);

        items.push({
          plu,
          nama_barang: lpbDetail.nama_barang || '-',
          qtyPO: null,
          qtyLPB: lpbDetail.total_quantity_order ?? null,
          qtySelisih: null, // Can't calculate if no PO
          uom: 'PCS',
        });
      }
    });

    // Count items with selisih (non-zero difference)
    const countSelisih = items.filter(
      (item) => item.qtySelisih !== null && item.qtySelisih !== 0
    ).length;

    return {
      mergedItems: items,
      selisihCount: countSelisih,
    };
  }, [report]);

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

  const auditTrailCount = auditTrails.length;
  const purchaseOrderNumber =
    report?.purchaseOrder?.po_number || report?.purchaseOrderId || 'Tidak ada PO';

  // Badge for items tab
  const itemsBadge = useMemo(() => {
    if (mergedItems.length === 0) return null;
    if (selisihCount > 0) {
      return `${mergedItems.length} (${selisihCount} selisih)`;
    }
    return mergedItems.length;
  }, [mergedItems.length, selisihCount]);

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
            <Tab id='items' label='Detail Item' icon={<ListBulletIcon className='w-3 h-3' />} badge={itemsBadge} />
            <Tab id='overview' label='Overview' icon={<DocumentTextIcon className='w-3 h-3' />} />
            <Tab id='timeline' label='Timeline' icon={<ClockIcon className='w-3 h-3' />} badge={auditTrailCount} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            {/* Tab 1: Detail Item */}
            <TabPanel tabId='items'>
              <div className='border border-gray-200 rounded overflow-hidden'>
                {mergedItems.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200 text-xs'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-2 py-2 text-left font-semibold text-gray-600 w-8'>No</th>
                          <th className='px-2 py-2 text-left font-semibold text-gray-600'>Nama Item</th>
                          <th className='px-2 py-2 text-left font-semibold text-gray-600 w-24'>PLU</th>
                          <th className='px-2 py-2 text-right font-semibold text-gray-600 w-20'>Qty PO</th>
                          <th className='px-2 py-2 text-right font-semibold text-gray-600 w-20'>Qty LPB</th>
                          <th className='px-2 py-2 text-right font-semibold text-gray-600 w-24'>Qty Selisih</th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {mergedItems.map((item, index) => (
                          <tr key={item.plu} className='hover:bg-gray-50'>
                            <td className='px-2 py-2 text-gray-500'>{index + 1}</td>
                            <td className='px-2 py-2 text-gray-900 font-medium'>{item.nama_barang}</td>
                            <td className='px-2 py-2 text-gray-600 font-mono'>{item.plu}</td>
                            <td className='px-2 py-2 text-right text-gray-600'>
                              {formatQtyWithUom(item.qtyPO, item.uom)}
                            </td>
                            <td className='px-2 py-2 text-right text-gray-600'>
                              {formatQtyWithUom(item.qtyLPB, item.uom)}
                            </td>
                            <td className={`px-2 py-2 text-right rounded ${getSelisihStyle(item.qtySelisih)}`}>
                              {formatSelisih(item.qtySelisih, item.uom)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='py-6 text-center text-xs text-gray-500'>
                    Tidak ada data item
                  </div>
                )}

                {/* Summary footer */}
                {mergedItems.length > 0 && (
                  <div className='bg-gray-50 px-3 py-2 border-t border-gray-200 flex justify-between items-center text-xs'>
                    <span className='text-gray-600'>
                      Total: <span className='font-semibold'>{mergedItems.length}</span> item
                    </span>
                    {selisihCount > 0 && (
                      <span className='text-orange-600 font-medium'>
                        {selisihCount} item memiliki selisih
                      </span>
                    )}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Tab 2: Overview */}
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

            {/* Tab 3: Timeline */}
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
