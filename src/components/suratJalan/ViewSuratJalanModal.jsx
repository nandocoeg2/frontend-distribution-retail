import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { AccordionItem, StatusBadge, InfoTable } from '../ui';

import ActivityTimeline from '../common/ActivityTimeline';
import { exportSuratJalanToPDF } from './PrintSuratJalan';

const ViewSuratJalanModal = ({ show, onClose, suratJalan }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    invoiceInfo: false,
    printInfo: false,
    metaInfo: false,
    historyInfo: false,
  });
  const [expandedDetails, setExpandedDetails] = useState({});

  if (!show || !suratJalan) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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

  const handleExportPDF = () => {
    exportSuratJalanToPDF(suratJalan);
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
  const statusId = typeof statusData === 'string' ? null : statusData?.id;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'OV' },
    {
      id: 'details',
      label: 'Surat Jalan Details',
      icon: 'DT',
      badge: suratJalan.suratJalanDetails?.length,
    },
    {
      id: 'checklist',
      label: 'Checklist Surat Jalan',
      icon: 'CL',
      badge: normalizedChecklist.length || null,
    },
    {
      id: 'activity',
      label: 'Activity Timeline',
      icon: 'AT',
      badge: normalizedAuditTrails.length || null,
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-teal-100 rounded-lg'>
              <span className='text-2xl'>🚚</span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
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
            <button
              onClick={onClose}
              className='p-2 transition-colors rounded-lg hover:bg-gray-100'
            >
              <svg
                className='w-6 h-6 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className='border-b border-gray-200 bg-gray-50'>
          <nav className='flex px-6 space-x-8' aria-label='Tabs'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className='px-2 py-1 ml-2 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full'>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          {activeTab === 'overview' && (
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
                      value: formatDate(suratJalan.createdAt),
                    },
                    {
                      label: 'Updated At',
                      value: formatDate(suratJalan.updatedAt),
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
                              {formatDate(historyItem.createdAt)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Surat Jalan Details
                </h3>
                <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                  {suratJalan.suratJalanDetails?.length || 0} details
                </div>
              </div>

              {suratJalan.suratJalanDetails &&
              suratJalan.suratJalanDetails.length > 0 ? (
                suratJalan.suratJalanDetails.map((detail, detailIndex) => (
                  <div
                    key={detail.id || detailIndex}
                    className='overflow-hidden bg-white border border-gray-200 rounded-lg'
                  >
                    <button
                      onClick={() => toggleDetail(detail.id || detailIndex)}
                      className='flex items-center justify-between w-full px-6 py-4 text-left transition-colors hover:bg-gray-50'
                    >
                      <div className='flex items-center space-x-4'>
                        <div className='p-2 bg-blue-100 rounded-lg'>
                          <span>📦</span>
                        </div>
                        <div>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Box #{detail.no_box}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            Total Qty: {detail.total_quantity_in_box} • Boxes:{' '}
                            {detail.total_box}
                          </p>
                        </div>
                      </div>
                      {expandedDetails[detail.id || detailIndex] ? (
                        <ChevronDownIcon className='w-5 h-5 text-gray-500' />
                      ) : (
                        <ChevronRightIcon className='w-5 h-5 text-gray-500' />
                      )}
                    </button>

                    {expandedDetails[detail.id || detailIndex] && (
                      <div className='px-6 pb-6 border-t border-gray-100'>
                        <div className='mt-4 mb-6'>
                          <InfoTable
                            data={[
                              { label: 'No Box', value: detail.no_box },
                              {
                                label: 'Total Quantity in Box',
                                value: detail.total_quantity_in_box,
                              },
                              { label: 'Isi Box', value: detail.isi_box },
                              { label: 'Sisa', value: detail.sisa },
                              { label: 'Total Box', value: detail.total_box },
                            ]}
                          />
                        </div>

                        {(detail.items || detail.suratJalanDetailItems) &&
                          (detail.items?.length > 0 ||
                            detail.suratJalanDetailItems?.length > 0) && (
                            <div>
                              <h5 className='mb-4 text-lg font-medium text-gray-900'>
                                Items
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
                                        Quantity
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Satuan
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Total Box
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Keterangan
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className='bg-white divide-y divide-gray-200'>
                                    {(
                                      detail.items ||
                                      detail.suratJalanDetailItems ||
                                      []
                                    ).map((item, itemIndex) => (
                                      <tr
                                        key={item.id || itemIndex}
                                        className='hover:bg-gray-50'
                                      >
                                        <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                                          {item.nama_barang}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.PLU}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.quantity}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.satuan}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {item.total_box}
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
                    <span className='text-2xl'>📦</span>
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Details Found
                  </h3>
                  <p className='text-gray-500'>
                    No surat jalan details available for this record.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
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
                          Tanggal: {formatDate(checklist.tanggal)}
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
                            value: formatDate(checklist.tanggal),
                          },
                          { label: 'Checker', value: checklist.checker },
                          { label: 'Driver', value: checklist.driver },
                          { label: 'Mobil', value: checklist.mobil },
                          { label: 'Kota', value: checklist.kota },
                          {
                            label: 'Created At',
                            value: formatDate(checklist.createdAt),
                          },
                          {
                            label: 'Updated At',
                            value: formatDate(checklist.updatedAt),
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <span className='text-2xl'>CL</span>
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
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline
              auditTrails={normalizedAuditTrails}
              title='Activity Timeline'
              emptyMessage='Belum ada audit trail untuk surat jalan ini.'
              formatDate={formatDate}
            />
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSuratJalanModal;
