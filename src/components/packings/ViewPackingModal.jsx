import React, { useState } from 'react';
import {
  ArchiveBoxIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ActivityTimeline from '../common/ActivityTimeline';
import PackingItemsTable from './PackingItemsTable';
import PackingItemDetailModal from './PackingItemDetailModal';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { formatDate, formatDateTime } from '../../utils/formatUtils';
import { exportPackingSticker, exportPackingTandaTerima } from '../../services/packingService';
import authService from '../../services/authService';
import toastService from '../../services/toastService';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  AccordionItem,
  StatusBadge,
  InfoTable,
} from '../ui';

const ViewPackingModal = ({ packing, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    poInfo: false,
    statusInfo: false,
    metaInfo: false,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);

  if (!packing) {
    return null;
  }

  // Check if packing has the expected structure
  if (!packing.packing_number && !packing.id) {
    console.log('ViewPackingModal - Invalid packing data structure:', packing);
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
        <div className='w-full max-w-md p-6 bg-white shadow-2xl rounded-xl'>
          <div className='text-center'>
            <div className='mb-4 flex items-center justify-center'>
              <ExclamationTriangleIcon
                className='h-16 w-16 text-red-500'
                aria-hidden='true'
              />
            </div>
            <h2 className='mb-2 text-xl font-bold text-gray-900'>
              Data Tidak Valid
            </h2>
            <p className='mb-4 text-gray-600'>
              Data packing yang diterima tidak valid atau tidak lengkap.
            </p>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsItemDetailOpen(true);
  };

  const closeItemDetail = () => {
    setIsItemDetailOpen(false);
    setSelectedItem(null);
  };

  const handleExportPDF = async () => {
    try {
      // Validate packing data
      if (!packing || !packing.packingBoxes || packing.packingBoxes.length === 0) {
        toastService.error('Tidak ada data box untuk dicetak');
        return;
      }

      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info('Generating sticker...');

      // Call backend API to get HTML
      const html = await exportPackingSticker(packing.id, companyData.id);

      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toastService.success('Sticker berhasil di-generate. Silakan print.');
      } else {
        toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
      }
    } catch (error) {
      console.error('Error exporting sticker:', error);
      toastService.error(error.message || 'Gagal mengekspor sticker');
    }
  };

  const handleExportTandaTerima = async () => {
    try {
      // Validate packing data
      if (!packing || !packing.packingBoxes || packing.packingBoxes.length === 0) {
        toastService.error('Tidak ada data box untuk dicetak');
        return;
      }

      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info('Generating tanda terima...');

      // Call backend API to get HTML
      const html = await exportPackingTandaTerima(packing.id, companyData.id);

      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toastService.success('Tanda terima berhasil di-generate. Silakan print.');
      } else {
        toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
      }
    } catch (error) {
      console.error('Error exporting tanda terima:', error);
      toastService.error(error.message || 'Gagal mengekspor tanda terima');
    }
  };

  const resolveStatusVariant = (status) => {
    const value = typeof status === 'string' ? status.toLowerCase() : '';

    if (!value) {
      return 'secondary';
    }

    // Complete = Hijau
    if (value.includes('completed') || value.includes('complete')) {
      return 'success';
    }

    // Failed = Merah
    if (
      value.includes('cancelled') ||
      value.includes('failed') ||
      value.includes('error')
    ) {
      return 'danger';
    }

    // Processed = Biru
    if (value.includes('processed') && !value.includes('processing')) {
      return 'primary';
    }

    // Processing/In Progress = Kuning
    if (
      value.includes('processing') ||
      value.includes('in_progress') ||
      value.includes('in progress')
    ) {
      return 'warning';
    }

    // Pending/Draft = Netral/Abu-abu
    if (value.includes('pending') || value.includes('draft')) {
      return 'secondary';
    }

    return 'default';
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DocumentTextIcon className='h-5 w-5' aria-hidden='true' />,
    },
    {
      id: 'boxes',
      label: 'Packing Boxes',
      icon: <ArchiveBoxIcon className='h-5 w-5' aria-hidden='true' />,
      badge: packing.packingBoxes?.length,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <ClockIcon className='h-5 w-5' aria-hidden='true' />,
    },
  ];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ArchiveBoxIcon
                className='h-8 w-8 text-blue-600'
                aria-hidden='true'
              />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Packing Details
              </h2>
              <p className='text-sm text-gray-600'>
                {packing.packing_number || 'N/A'}
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
              <span>Print Stiker</span>
            </button>
            <button
              type='button'
              onClick={handleExportTandaTerima}
              className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700'
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
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <span>Print Tanda Terima</span>
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
        <TabContainer
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant='default'
        >
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

        {/* Tab Content */}
        <div className='flex-1 p-6 overflow-y-auto'>
          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-6'>
                {/* Basic Information */}
                <AccordionItem
                  title='Basic Information'
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Packing Number',
                        value: packing.packing_number || 'N/A',
                      },
                      {
                        label: 'Tanggal Packing',
                        value: formatDate(packing.tanggal_packing),
                      },
                      {
                        label: 'Status',
                        component: packing.status?.status_name ? (
                          <StatusBadge
                            status={packing.status.status_name}
                            variant={resolveStatusVariant(
                              packing.status?.status_name
                            )}
                            size='sm'
                            dot
                          />
                        ) : (
                          <span className='text-gray-500'>No Status</span>
                        ),
                      },
                      {
                        label: 'Created At',
                        value: formatDateTime(packing.createdAt),
                      },
                      {
                        label: 'Updated At',
                        value: formatDateTime(packing.updatedAt),
                      },
                      {
                        label: 'Total Boxes',
                        value: packing.packingBoxes?.length || 0,
                      },
                      {
                        label: 'Total Items',
                        value:
                          packing.packingBoxes?.reduce(
                            (sum, box) =>
                              sum + (box.packingBoxItems?.length || 0),
                            0
                          ) || 0,
                      },
                    ]}
                  />
                </AccordionItem>

                {/* Purchase Order Information */}
                {packing.purchaseOrder && (
                  <AccordionItem
                    title='Purchase Order Information'
                    isExpanded={expandedSections.poInfo}
                    onToggle={() => toggleSection('poInfo')}
                    bgColor='bg-gradient-to-r from-green-50 to-green-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'PO Number',
                          value: packing.purchaseOrder.po_number,
                          copyable: true,
                        },
                        {
                          label: 'Tanggal Masuk PO',
                          value: formatDate(
                            packing.purchaseOrder.tanggal_masuk_po
                          ),
                        },
                        {
                          label: 'Tanggal Batas Kirim',
                          value: formatDate(
                            packing.purchaseOrder.tanggal_batas_kirim
                          ),
                        },
                        {
                          label: 'TOP',
                          value: packing.purchaseOrder.termOfPayment.kode_top,
                        },
                        {
                          label: 'PO Type',
                          value: packing.purchaseOrder.po_type,
                        },
                        {
                          label: 'Total Items',
                          value: packing.purchaseOrder.total_items,
                        },
                        {
                          label: 'Customer',
                          value: packing.purchaseOrder.customer.namaCustomer,
                          copyable: true,
                        },
                      ]}
                    />
                  </AccordionItem>
                )}

                {/* Status Information */}
                {packing.status && (
                  <AccordionItem
                    title='Status Details'
                    isExpanded={expandedSections.statusInfo}
                    onToggle={() => toggleSection('statusInfo')}
                    bgColor='bg-gradient-to-r from-yellow-50 to-yellow-100'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Status Code',
                          component: (
                            <div className='flex items-center space-x-2'>
                              <StatusBadge
                                status={packing.status.status_code}
                                variant={resolveStatusVariant(
                                  packing.status?.status_name ||
                                    packing.status?.status_code
                                )}
                                size='sm'
                                dot
                              />
                            </div>
                          ),
                        },
                        {
                          label: 'Status Name',
                          value: packing.status.status_name,
                        },
                        {
                          label: 'Description',
                          value: packing.status.status_description,
                        },
                      ]}
                    />
                  </AccordionItem>
                )}

                {/* Metadata */}
                <AccordionItem
                  title='System Information'
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Packing ID',
                        value: packing.id,
                        copyable: true,
                      },
                      {
                        label: 'Purchase Order ID',
                        value: packing.purchaseOrderId,
                        copyable: true,
                      },
                      {
                        label: 'Created By',
                        value: packing.createdBy,
                        copyable: true,
                      },
                      {
                        label: 'Updated By',
                        value: packing.updatedBy,
                        copyable: true,
                      },
                    ]}
                  />
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId='boxes'>
              <div className='p-6 space-y-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Packing Boxes
                  </h3>
                  <div className='flex items-center space-x-3'>
                    <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                      {packing.packingBoxes?.length || 0} boxes
                    </div>
                  </div>
                </div>

                <PackingItemsTable
                  packingBoxes={packing.packingBoxes}
                  onItemClick={handleItemClick}
                />
              </div>
            </TabPanel>

            <TabPanel tabId='timeline'>
              <ActivityTimeline
                auditTrails={packing.auditTrails}
                title='Activity Timeline'
                emptyMessage='No audit trail data available for this packing record.'
                formatDate={formatDate}
              />
            </TabPanel>
          </TabContent>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={onClose}
              className='px-6 py-2 font-medium text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600'
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Packing Item Detail Modal */}
      {isItemDetailOpen && (
        <PackingItemDetailModal item={selectedItem} onClose={closeItemDetail} />
      )}
    </div>
  );
};

export default ViewPackingModal;
