import React, { useState } from 'react';
import fileService from '../../services/fileService';
import HeroIcon from '../atoms/HeroIcon';
import PurchaseOrderDetailsTable from './PurchaseOrderDetailsTable';
import purchaseOrderService from '../../services/purchaseOrderService';
import ActivityTimeline from '../common/ActivityTimeline';
import { resolveStatusVariant } from '../../utils/modalUtils';
import {
  AccordionItem,
  InfoCard,
  StatusBadge,
  InfoTable,
  useAlert,
} from '../ui';

const ViewPurchaseOrderModal = ({
  isOpen,
  onClose,
  order,
  loading,
  onProcessed,
}) => {
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    customerSupplier: false,
    statusInfo: false,
    documentsInfo: false,
    metaInfo: false,
  });

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
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

  const formatSuratJalanValue = (suratJalan) => {
    if (!suratJalan) return 'Not assigned';

    if (Array.isArray(suratJalan)) {
      const numbers = suratJalan
        .map((item) => item?.no_surat_jalan || item?.noSuratJalan)
        .filter(Boolean);

      if (numbers.length > 0) {
        return numbers.join(', ');
      }

      return `${suratJalan.length} record${
        suratJalan.length > 1 ? 's' : ''
      }`;
    }

    return (
      suratJalan.no_surat_jalan ||
      suratJalan.noSuratJalan ||
      suratJalan.id ||
      'Not assigned'
    );
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDownload = async (fileId, fileName) => {
    await fileService.downloadFile(fileId, fileName);
  };

  const handleProcess = async () => {
    if (!order?.id) return;

    setProcessing(true);
    try {
      const result = await purchaseOrderService.processPurchaseOrder(
        order.id,
        'PROCESSING PURCHASE ORDER'
      );
      if (result.success) {
        showSuccess('Purchase order processed successfully.');
        if (onProcessed) {
          onProcessed();
        }
        onClose();
      } else {
        throw new Error('Failed to process purchase order');
      }
    } catch (error) {
      console.error('Failed to process purchase order:', error);
      showError(`Failed to process purchase order: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'details', label: 'Order Details', icon: '📦' },
    {
      id: 'files',
      label: 'Attached Files',
      icon: '📎',
      badge: order?.files?.length,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: '⏱️',
      badge: order?.auditTrails?.length,
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 rounded-lg bg-emerald-100'>
              <span className='text-2xl'>🛒</span>
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Purchase Order Details
              </h2>
              <p className='text-sm text-gray-600'>
                {order?.po_number || 'Loading...'}
              </p>
            </div>
          </div>
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
          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <div className='w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin'></div>
            </div>
          ) : order ? (
            <>
              {activeTab === 'overview' && (
                <div className='space-y-6'>
                  {/* Basic Information */}
                  <AccordionItem
                    title='Basic Information'
                    isExpanded={expandedSections.basicInfo}
                    onToggle={() => toggleSection('basicInfo')}
                    bgColor='bg-gradient-to-r from-emerald-50 to-emerald-100'
                  >
                    <InfoTable
                      data={[
                        { label: 'PO Number', value: order.po_number },
                        {
                          label: 'Tanggal Masuk PO',
                          value: formatDate(order.tanggal_masuk_po),
                        },
                        {
                          label: 'Tanggal Batas Kirim',
                          value: formatDate(order.tanggal_batas_kirim),
                        },
                        { label: 'PO Type', value: order.po_type },
                        { label: 'Total Items', value: order.total_items },
                        {
                          label: 'TOP',
                          value: order.termOfPayment.kode_top,
                        },
                        { label: 'PO ID', value: order.id, copyable: true },
                      ]}
                    />
                  </AccordionItem>

                  {/* Customer & Supplier Information */}
                  <AccordionItem
                    title='Customer & Supplier Information'
                    isExpanded={expandedSections.customerSupplier}
                    onToggle={() => toggleSection('customerSupplier')}
                    bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Customer ID',
                          value: order.customerId,
                          copyable: true,
                        },
                        {
                          label: 'Customer Name',
                          value: order.customer?.namaCustomer,
                        },
                        {
                          label: 'Customer Code',
                          value: order.customer?.kodeCustomer,
                        },
                        {
                          label: 'Customer Email',
                          value: order.customer?.email,
                        },
                        {
                          label: 'Customer Phone',
                          value: order.customer?.phoneNumber,
                        },
                        {
                          label: 'Supplier ID',
                          value: order.supplierId || 'Not assigned',
                          copyable: order.supplierId ? true : false,
                        },
                        {
                          label: 'Supplier Name',
                          value: order.supplier?.name || 'Not assigned',
                        },
                      ]}
                    />
                  </AccordionItem>

                  {/* Status Information */}
                  <AccordionItem
                    title='Status Information'
                    isExpanded={expandedSections.statusInfo}
                    onToggle={() => toggleSection('statusInfo')}
                    bgColor='bg-gradient-to-r from-yellow-50 to-yellow-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Status',
                          component: (
                            <StatusBadge
                              status={order.status?.status_name}
                              variant={resolveStatusVariant(
                                order.status?.status_name
                              )}
                              size='sm'
                              dot
                            />
                          ),
                        },
                        {
                          label: 'Status Code',
                          value: order.status?.status_code,
                        },
                      ]}
                    />
                  </AccordionItem>

                  {/* Documents Information */}
                  <AccordionItem
                    title='Documents Information'
                    isExpanded={expandedSections.documentsInfo}
                    onToggle={() => toggleSection('documentsInfo')}
                    bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Surat Jalan',
                          value: formatSuratJalanValue(order.suratJalan),
                        },
                        {
                          label: 'Invoice Pengiriman',
                          value: order.invoicePengiriman || 'Not assigned',
                        },
                        {
                          label: 'Packing List',
                          value: order.packing?.packing_number || 'Not assigned',
                        },
                      ]}
                    />
                  </AccordionItem>

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
                          value: formatDateTime(order.createdAt),
                        },
                        {
                          label: 'Updated At',
                          value: formatDateTime(order.updatedAt),
                        },
                      ]}
                    />
                  </AccordionItem>
                </div>
              )}

              {activeTab === 'details' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      Purchase Order Details
                    </h3>
                  </div>
                  <div className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
                    <PurchaseOrderDetailsTable
                      details={order.purchaseOrderDetails}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      Attached Files
                    </h3>
                    <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                      {order.files?.length || 0} files
                    </div>
                  </div>

                  {order.files && order.files.length > 0 ? (
                    <div className='bg-white border border-gray-200 divide-y divide-gray-200 rounded-lg'>
                      {order.files.map((file) => (
                        <div
                          key={file.id}
                          className='p-4 transition-colors hover:bg-gray-50'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <div className='flex-shrink-0'>
                                <HeroIcon
                                  icon='PaperClipIcon'
                                  className='w-8 h-8 text-gray-400'
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-gray-900 truncate'>
                                  {file.filename}
                                </p>
                                <p className='text-sm text-gray-500'>
                                  File ID: {file.id}
                                </p>
                              </div>
                            </div>
                            <div className='flex-shrink-0'>
                              <button
                                onClick={() =>
                                  handleDownload(file.id, file.filename)
                                }
                                className='inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white transition-colors bg-blue-600 border border-transparent rounded-md hover:bg-blue-700'
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-12 text-center'>
                      <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                        <span className='text-2xl'>📎</span>
                      </div>
                      <h3 className='mb-2 text-lg font-medium text-gray-900'>
                        No Files Attached
                      </h3>
                      <p className='text-gray-500'>
                        No files have been attached to this purchase order.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <ActivityTimeline
                  auditTrails={order.auditTrails}
                  title='Activity Timeline'
                  emptyMessage='No audit trail data available for this purchase order.'
                  formatDate={formatDateTime}
                />
              )}
            </>
          ) : (
            <div className='py-8 text-center'>
              <p className='text-gray-500'>No details available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            {order?.status?.status_name !== 'Processed' && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className='px-6 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300'
              >
                {processing ? 'Processing...' : 'Process'}
              </button>
            )}
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default ViewPurchaseOrderModal;
