import React, { useState } from 'react';
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ListBulletIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { AccordionItem, StatusBadge, InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { formatDateTime, formatDate } from '../../utils/formatUtils';
import ActivityTimeline from '../common/ActivityTimeline';
import authService from '../../services/authService';
import suratJalanService from '../../services/suratJalanService';
import toastService from '../../services/toastService';
import { getPackingBoxes, getTotals } from '../../utils/suratJalanHelpers';

const SuratJalanDetailCard = ({ suratJalan, onClose, loading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    invoiceInfo: false,
    printInfo: false,
    metaInfo: false,
    historyInfo: false,
  });
  const [expandedDetails, setExpandedDetails] = useState({});

  if (!suratJalan) return null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleDetail = (detailId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [detailId]: !prev[detailId],
    }));
  };

  const handleExportPDF = async () => {
    try {
      const packingBoxes = getPackingBoxes(suratJalan);
      
      if (!suratJalan || packingBoxes.length === 0) {
        toastService.error('Tidak ada packing boxes untuk dicetak. Pastikan purchase order memiliki packing data.');
        return;
      }

      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info('Generating surat jalan...');

      const html = await suratJalanService.exportSuratJalan(suratJalan.id, companyData.id);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toastService.success('Surat jalan berhasil di-generate. Silakan print.');
      } else {
        toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
      }
    } catch (error) {
      console.error('Error exporting surat jalan:', error);
      toastService.error(error.message || 'Gagal mengekspor surat jalan');
    }
  };

  const checklistData = suratJalan?.checklistSuratJalan;
  const normalizedChecklist = Array.isArray(checklistData)
    ? checklistData
    : checklistData
      ? [checklistData]
      : [];

  const historyData = Array.isArray(suratJalan?.historyPengiriman)
    ? suratJalan.historyPengiriman
    : suratJalan?.historyPengiriman
      ? [suratJalan.historyPengiriman]
      : [];

  const rawAuditTrailData = Array.isArray(suratJalan?.auditTrails)
    ? suratJalan.auditTrails
    : suratJalan?.auditTrails
      ? [suratJalan.auditTrails]
      : [];

  const normalizedAuditTrails = rawAuditTrailData.map((trail) => {
    const timestampSource =
      trail?.timestamp ||
      trail?.createdAt ||
      trail?.updatedAt ||
      trail?.created_at ||
      trail?.updated_at;
    let timestamp = null;

    if (timestampSource) {
      const parsed = new Date(timestampSource);
      if (!Number.isNaN(parsed.getTime())) {
        timestamp = parsed.toISOString();
      }
    }

    return {
      ...trail,
      timestamp,
      tableName: trail?.tableName || trail?.entityType || 'Surat Jalan',
    };
  });

  const statusData = suratJalan?.status;
  const statusDisplay =
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_name ||
        statusData?.status_code ||
        'DRAFT SURAT JALAN';
  const statusVariant = resolveStatusVariant(
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_name || statusData?.status_code
  );
  const statusCode =
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_code || statusData?.status_name;
  const statusCategory =
    typeof statusData === 'string' ? null : statusData?.category;

  const packingBoxes = getPackingBoxes(suratJalan);
  const { totalBoxes, totalQuantity } = getTotals(suratJalan);

  return (
    <div className='bg-white shadow-md rounded-lg p-6 mt-6'>
      {/* Header */}
      <div className='flex justify-between items-start mb-6'>
        <div className='flex items-center space-x-4'>
          <div className='p-2 bg-teal-100 rounded-lg'>
            <TruckIcon className='w-8 h-8 text-teal-600' aria-hidden='true' />
          </div>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>
              Surat Jalan Details
            </h2>
            <p className='text-sm text-gray-600'>
              {suratJalan.no_surat_jalan}
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <button
            type='button'
            onClick={handleExportPDF}
            className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <span>Print Surat Jalan</span>
          </button>
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
          <span className='ml-3 text-sm text-gray-600'>Loading surat jalan details...</span>
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
              id='details'
              label='Box Details'
              icon={<ListBulletIcon className='w-4 h-4' />}
              badge={packingBoxes.length}
            />
            <Tab
              id='checklist'
              label='Checklist'
              icon={<ClipboardDocumentCheckIcon className='w-4 h-4' />}
              badge={normalizedChecklist.length || null}
            />
            <Tab
              id='activity'
              label='Activity'
              icon={<ClockIcon className='w-4 h-4' />}
              badge={normalizedAuditTrails.length || null}
            />
          </TabContainer>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-6'>
                {/* Basic Information */}
                <AccordionItem
                  title='Basic Information'
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor='bg-gradient-to-r from-teal-50 to-teal-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'No Surat Jalan',
                        value: suratJalan.no_surat_jalan,
                      },
                      { label: 'Deliver To', value: suratJalan.deliver_to },
                      { label: 'PIC', value: suratJalan.PIC },
                      { label: 'Alamat Tujuan', value: suratJalan.alamat_tujuan },
                      {
                        label: 'Status',
                        component: (
                          <StatusBadge
                            status={statusDisplay}
                            variant={statusVariant}
                            size='sm'
                            dot
                          />
                        ),
                      },
                      { label: 'Status Code', value: statusCode },
                      { label: 'Status Category', value: statusCategory },
                    ]}
                  />
                </AccordionItem>

                {/* Print Information */}
                <AccordionItem
                  title='Print Information'
                  isExpanded={expandedSections.printInfo}
                  onToggle={() => toggleSection('printInfo')}
                  bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Print Status',
                        component: (
                          <StatusBadge
                            status={
                              suratJalan.is_printed ? 'Printed' : 'Not Printed'
                            }
                            variant={
                              suratJalan.is_printed ? 'success' : 'secondary'
                            }
                            size='sm'
                            dot
                          />
                        ),
                      },
                      { label: 'Print Counter', value: suratJalan.print_counter },
                    ]}
                  />
                </AccordionItem>

                {/* Invoice Information */}
                {suratJalan.invoice && (
                  <AccordionItem
                    title='Invoice Information'
                    isExpanded={expandedSections.invoiceInfo}
                    onToggle={() => toggleSection('invoiceInfo')}
                    bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Invoice No',
                          value: suratJalan.invoice.no_invoice,
                        },
                        {
                          label: 'Invoice Deliver To',
                          value: suratJalan.invoice.deliver_to,
                        },
                        {
                          label: 'Purchase Order No',
                          value: suratJalan.purchaseOrder?.po_number,
                        },
                        {
                          label: 'Customer',
                          value: suratJalan.purchaseOrder?.customer?.namaCustomer,
                        },
                        {
                          label: 'Supplier',
                          value:
                            suratJalan.invoice.purchaseOrder?.supplier
                              ?.nama_supplier,
                        },
                      ]}
                    />
                  </AccordionItem>
                )}

                {/* System Information */}
                <AccordionItem
                  title='System Information'
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor='bg-gradient-to-r from-gray-50 to-gray-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Created At',
                        value: formatDateTime(suratJalan.createdAt),
                      },
                      {
                        label: 'Updated At',
                        value: formatDateTime(suratJalan.updatedAt),
                      },
                      {
                        label: 'Supplier ID',
                        value: suratJalan.invoice.purchaseOrder?.supplier?.id,
                        copyable: Boolean(
                          suratJalan.invoice.purchaseOrder?.supplier?.id
                        ),
                      },
                      {
                        label: 'Customer ID',
                        value: suratJalan.invoice.purchaseOrder?.customer?.id,
                        copyable: Boolean(
                          suratJalan.invoice.purchaseOrder?.customer?.id
                        ),
                      },
                      {
                        label: 'Purchase Order ID',
                        value: suratJalan.invoice.purchaseOrder?.id,
                        copyable: Boolean(suratJalan.invoice.purchaseOrder?.id),
                      },
                      {
                        label: 'Surat Jalan ID',
                        value: suratJalan.id,
                        copyable: Boolean(suratJalan.id),
                      },
                      {
                        label: 'Invoice ID',
                        value: suratJalan.invoiceId,
                        copyable: Boolean(suratJalan.invoiceId),
                      },
                    ]}
                  />
                </AccordionItem>

                {historyData.length > 0 && (
                  <AccordionItem
                    title='History Pengiriman'
                    isExpanded={expandedSections.historyInfo}
                    onToggle={() => toggleSection('historyInfo')}
                    bgColor='bg-gradient-to-r from-amber-50 to-orange-100'
                  >
                    <div className='space-y-4'>
                      {historyData.map((historyItem, historyIndex) => (
                        <div
                          key={historyItem.id || historyIndex}
                          className='flex flex-col gap-3 p-4 bg-white border rounded-lg border-amber-200 md:flex-row md:items-center md:justify-between'
                        >
                          <div>
                            <p className='text-sm font-medium text-gray-600'>
                              Status
                            </p>
                            <StatusBadge
                              status={
                                historyItem.status?.status_name ||
                                historyItem.status?.status_code ||
                                'Unknown'
                              }
                              variant={resolveStatusVariant(
                                historyItem.status?.status_name ||
                                  historyItem.status?.status_code
                              )}
                              size='sm'
                              dot
                            />
                            <p className='mt-1 text-xs text-gray-500'>
                              Category: {historyItem.status?.category || 'N/A'}
                            </p>
                          </div>
                          <div className='text-sm text-gray-600 md:text-right'>
                            <p className='text-xs text-gray-500'>
                              History ID:{' '}
                              <span className='font-medium text-gray-900'>
                                {historyItem.id || 'N/A'}
                              </span>
                            </p>
                            <p className='mt-1 text-xs text-gray-500'>
                              Surat Jalan ID:{' '}
                              <span className='font-medium text-gray-900'>
                                {historyItem.surat_jalan_id ||
                                  suratJalan.id ||
                                  'N/A'}
                              </span>
                            </p>
                            <p className='mt-1 text-xs text-gray-500'>
                              Created At:{' '}
                              <span className='font-medium text-gray-900'>
                                {formatDateTime(historyItem.createdAt)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                )}
              </div>
            </TabPanel>

            <TabPanel tabId='details'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Box Details <span className='text-sm text-green-600'>(from Packing)</span>
                  </h3>
                  <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                    {packingBoxes.length} box{packingBoxes.length !== 1 ? 'es' : ''} • {totalQuantity || 0} qty
                  </div>
                </div>

                {packingBoxes && packingBoxes.length > 0 ? (
                  packingBoxes.map((box, boxIndex) => (
                    <div
                      key={box.id || boxIndex}
                      className='overflow-hidden bg-white border border-gray-200 rounded-lg'
                    >
                      <button
                        onClick={() => toggleDetail(box.id || boxIndex)}
                        className='flex items-center justify-between w-full px-6 py-4 text-left transition-colors hover:bg-gray-50'
                      >
                        <div className='flex items-center space-x-4'>
                          <div className='p-2 bg-blue-100 rounded-lg'>
                            <span>📦</span>
                          </div>
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900'>
                              Box #{box.no_box}
                            </h4>
                            <p className='text-sm text-gray-600'>
                              Total Qty: {box.total_quantity_in_box} • Items:{' '}
                              {box.packingBoxItems?.length || 0}
                            </p>
                          </div>
                        </div>
                        {expandedDetails[box.id || boxIndex] ? (
                          <ChevronDownIcon className='w-5 h-5 text-gray-500' />
                        ) : (
                          <ChevronRightIcon className='w-5 h-5 text-gray-500' />
                        )}
                      </button>

                      {expandedDetails[box.id || boxIndex] && (
                        <div className='px-6 pb-6 border-t border-gray-100'>
                          <div className='mt-4 mb-6'>
                            <InfoTable
                              data={[
                                { label: 'No Box', value: box.no_box },
                                {
                                  label: 'Total Quantity in Box',
                                  value: box.total_quantity_in_box,
                                },
                                {
                                  label: 'Number of Items',
                                  value: box.packingBoxItems?.length || 0,
                                },
                              ]}
                            />
                          </div>

                          {box.packingBoxItems && box.packingBoxItems.length > 0 && (
                            <div>
                              <h5 className='mb-4 text-lg font-medium text-gray-900'>
                                Items ({box.packingBoxItems.length})
                              </h5>
                              <div className='overflow-x-auto bg-white border border-gray-200 rounded-lg'>
                                <table className='min-w-full divide-y divide-gray-200'>
                                  <thead className='bg-gray-50'>
                                    <tr>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Nama Barang
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        PLU
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Item ID
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Quantity
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Satuan
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Keterangan
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className='bg-white divide-y divide-gray-200'>
                                    {box.packingBoxItems.map((item, itemIndex) => (
                                      <tr
                                        key={item.id || item.itemId || itemIndex}
                                        className='hover:bg-gray-50'
                                      >
                                        <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                                          {item.nama_barang}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.item?.plu || '-'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-500 whitespace-nowrap font-mono text-xs'>
                                          {item.itemId ? item.itemId.slice(0, 8) + '...' : '-'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.quantity}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.satuan || 'pcs'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.keterangan || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className='py-12 text-center'>
                    <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                      <ArchiveBoxIcon
                        className='w-8 h-8 text-gray-400'
                        aria-hidden='true'
                      />
                    </div>
                    <h3 className='mb-2 text-lg font-medium text-gray-900'>
                      No Box Details Found
                    </h3>
                    <p className='text-gray-500'>
                      No packing boxes available. Please ensure the purchase order has packing data.
                    </p>
                  </div>
                )}
              </div>
            </TabPanel>

            <TabPanel tabId='checklist'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Checklist Surat Jalan
                  </h3>
                  <div className='px-3 py-1 text-sm font-medium text-teal-800 bg-teal-100 rounded-full'>
                    {normalizedChecklist.length} checklist
                  </div>
                </div>

                {normalizedChecklist.length > 0 ? (
                  normalizedChecklist.map((checklist, checklistIndex) => (
                    <div
                      key={checklist.id || checklistIndex}
                      className='overflow-hidden bg-white border border-gray-200 rounded-lg'
                    >
                      <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
                        <div>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Checklist #{checklistIndex + 1}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            Tanggal: {formatDateTime(checklist.tanggal)}
                          </p>
                        </div>
                        <div className='text-sm text-right text-gray-500'>
                          <p>
                            ID:{' '}
                            <span className='font-medium text-gray-900'>
                              {checklist.id || 'N/A'}
                            </span>
                          </p>
                          <p>
                            Surat Jalan ID:{' '}
                            <span className='font-medium text-gray-900'>
                              {checklist.suratJalanId || suratJalan.id || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className='px-6 py-4'>
                        <InfoTable
                          data={[
                            {
                              label: 'Tanggal Checklist',
                              value: formatDateTime(checklist.tanggal),
                            },
                            { label: 'Checker', value: checklist.checker },
                            { label: 'Driver', value: checklist.driver },
                            { label: 'Mobil', value: checklist.mobil },
                            { label: 'Kota', value: checklist.kota },
                            {
                              label: 'Created At',
                              value: formatDateTime(checklist.createdAt),
                            },
                            {
                              label: 'Updated At',
                              value: formatDateTime(checklist.updatedAt),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='py-12 text-center'>
                    <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                      <ClipboardDocumentCheckIcon
                        className='w-8 h-8 text-gray-400'
                        aria-hidden='true'
                      />
                    </div>
                    <h3 className='mb-2 text-lg font-medium text-gray-900'>
                      No Checklist Found
                    </h3>
                    <p className='text-gray-500'>
                      Belum ada checklist untuk surat jalan ini.
                    </p>
                  </div>
                )}
              </div>
            </TabPanel>

            <TabPanel tabId='activity'>
              <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
                <ActivityTimeline
                  auditTrails={normalizedAuditTrails}
                  title='Activity Timeline'
                  emptyMessage='Belum ada audit trail untuk surat jalan ini.'
                  formatDate={formatDate}
                />
              </div>
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default SuratJalanDetailCard;
