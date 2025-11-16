import React, { useState, useMemo } from 'react';
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  TruckIcon,
  CubeIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { TabContainer, Tab, TabContent, TabPanel } from '../ui/Tabs';
import { AccordionItem, StatusBadge, InfoTable } from '../ui';
import { formatDateTime } from '../../utils/formatUtils';
import { resolveStatusVariant } from '../../utils/modalUtils';
import ActivityTimeline from '../common/ActivityTimeline';
import checkingListService from '../../services/checkingListService';
import authService from '../../services/authService';
import toastService from '../../services/toastService';

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatNumberValue = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numberFormatter.format(numeric);
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
};

const formatBooleanValue = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value ? 'Ya' : 'Tidak';
};

const CheckingListDetailCard = ({
  checklist,
  onClose,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportGroupedLoading, setExportGroupedLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    statusInfo: false,
    systemInfo: false,
  });
  const [expandedPackings, setExpandedPackings] = useState({});

  // Normalize audit trails - must be called before early return
  const normalizedAuditTrails = useMemo(() => {
    const rawAuditTrailData = Array.isArray(checklist?.auditTrails)
      ? checklist.auditTrails
      : checklist?.auditTrails
        ? [checklist.auditTrails]
        : [];

    return rawAuditTrailData.map((trail) => {
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
        tableName: trail?.tableName || 'Checklist Surat Jalan',
      };
    });
  }, [checklist?.auditTrails]);

  if (!checklist) return null;

  // Normalize suratJalan data
  const suratJalanData = Array.isArray(checklist?.suratJalan)
    ? checklist.suratJalan
    : checklist?.suratJalan
      ? [checklist.suratJalan]
      : [];

  // Get first surat jalan for related data (Customer, Supplier)
  const firstSuratJalan = suratJalanData[0];
  const firstPurchaseOrder = firstSuratJalan?.purchaseOrder;
  const customer = firstPurchaseOrder?.customer;
  const supplier = firstPurchaseOrder?.supplier;

  // Extract unique purchase orders from all surat jalan
  const purchaseOrdersMap = new Map();
  suratJalanData.forEach((sj) => {
    if (sj?.purchaseOrder?.id) {
      purchaseOrdersMap.set(sj.purchaseOrder.id, sj.purchaseOrder);
    }
  });
  const purchaseOrders = Array.from(purchaseOrdersMap.values());

  // Extract unique packing data from all purchase orders
  const packingMap = new Map();
  purchaseOrders.forEach((po) => {
    if (po?.packing?.id) {
      packingMap.set(po.packing.id, {
        ...po.packing,
        po_number: po.po_number, // Add PO reference
        purchaseOrderId: po.id,
      });
    }
  });
  const packingList = Array.from(packingMap.values());

  // Status handling
  const statusData = checklist?.status;
  const statusDisplay =
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_name || statusData?.status_code || 'UNKNOWN';
  const statusVariant = resolveStatusVariant(
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_name || statusData?.status_code
  );

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const togglePacking = (packingId) => {
    setExpandedPackings((prev) => ({
      ...prev,
      [packingId]: !prev[packingId],
    }));
  };

  const handleExportPdf = async () => {
    if (isLoading || !checklist || exportLoading) {
      return;
    }

    setExportLoading(true);

    try {
      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info('Generating checklist...');

      // Call backend API to get HTML
      const html = await checkingListService.exportCheckingList(
        checklist.id,
        companyData.id
      );

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

        toastService.success('Checklist berhasil di-generate. Silakan print.');
      } else {
        toastService.error(
          'Popup window diblokir. Silakan izinkan popup untuk mencetak.'
        );
      }
    } catch (error) {
      console.error('Failed to export checklist:', error);
      toastService.error(error.message || 'Gagal mengekspor checklist');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdfGrouped = async () => {
    if (isLoading || !checklist || exportGroupedLoading) {
      return;
    }

    setExportGroupedLoading(true);

    try {
      // Get company ID from auth
      const companyData = authService.getCompanyData();
      if (!companyData || !companyData.id) {
        toastService.error('Company ID tidak ditemukan. Silakan login ulang.');
        return;
      }

      toastService.info('Generating checklist grouped...');

      // Call backend API to get HTML
      const html = await checkingListService.exportCheckingListGrouped(
        checklist.id,
        companyData.id
      );

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

        toastService.success('Checklist grouped berhasil di-generate. Silakan print.');
      } else {
        toastService.error(
          'Popup window diblokir. Silakan izinkan popup untuk mencetak.'
        );
      }
    } catch (error) {
      console.error('Failed to export checklist grouped:', error);
      toastService.error(error.message || 'Gagal mengekspor checklist grouped');
    } finally {
      setExportGroupedLoading(false);
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DocumentTextIcon className='w-5 h-5' aria-hidden='true' />,
    },
    {
      id: 'purchaseOrder',
      label: 'Purchase Order',
      icon: <ShoppingCartIcon className='w-5 h-5' aria-hidden='true' />,
      disabled: purchaseOrders.length === 0,
      badge: purchaseOrders.length || null,
    },
    {
      id: 'suratJalan',
      label: 'Surat Jalan',
      icon: <TruckIcon className='w-5 h-5' aria-hidden='true' />,
      badge: suratJalanData.length || null,
    },
    {
      id: 'packing',
      label: 'Packing',
      icon: <CubeIcon className='w-5 h-5' aria-hidden='true' />,
      disabled: packingList.length === 0,
      badge: packingList.length || null,
    },
    {
      id: 'customer',
      label: 'Customer',
      icon: <UserIcon className='w-5 h-5' aria-hidden='true' />,
      disabled: !customer,
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: <BuildingStorefrontIcon className='w-5 h-5' aria-hidden='true' />,
      disabled: !supplier,
    },
    {
      id: 'activity',
      label: 'Activity Timeline',
      icon: <ClockIcon className='w-5 h-5' aria-hidden='true' />,
      badge: normalizedAuditTrails.length || null,
    },
  ];

  return (
    <div className='bg-white rounded-lg shadow-md mt-6 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50'>
          <div className='flex items-center space-x-4'>
            <div className='p-2 bg-teal-100 rounded-lg'>
              <ClipboardDocumentCheckIcon
                className='w-8 h-8 text-teal-600'
                aria-hidden='true'
              />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Checklist Surat Jalan Details
              </h2>
              <p className='text-sm text-gray-600'>
                {checklist.no_checklist_surat_jalan || checklist.id}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              type='button'
              onClick={handleExportPdf}
              disabled={isLoading || !checklist || exportLoading}
              className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {exportLoading ? (
                <span className='inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
              ) : (
                <ArrowDownTrayIcon className='w-5 h-5' />
              )}
              <span>{exportLoading ? 'Exporting...' : 'Export PDF'}</span>
            </button>
            <button
              type='button'
              onClick={handleExportPdfGrouped}
              disabled={isLoading || !checklist || exportGroupedLoading}
              className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {exportGroupedLoading ? (
                <span className='inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
              ) : (
                <ArrowDownTrayIcon className='w-5 h-5' />
              )}
              <span>{exportGroupedLoading ? 'Exporting...' : 'Export PDF Grouped'}</span>
            </button>
            <button
            onClick={onClose}
            className='p-2 transition-colors rounded-lg hover:bg-gray-100'
            title='Close'
          >
            <XMarkIcon className='w-6 h-6 text-gray-500' />
          </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className='border-b border-gray-200 bg-gray-50'>
          <TabContainer
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant='underline'
            size='md'
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                badge={tab.badge}
                disabled={tab.disabled}
              />
            ))}
          </TabContainer>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-3 text-sm text-gray-600'>Loading checklist details...</span>
          </div>
        ) : (
          <div className='p-6'>
          <TabContent activeTab={activeTab}>
            {/* Overview Tab */}
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
                        label: 'No Checklist Surat Jalan',
                        value:
                          checklist.no_checklist_surat_jalan ||
                          checklist.id ||
                          '-',
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
                    ]}
                  />
                </AccordionItem>

                {/* Status Information */}
                <AccordionItem
                  title='Status Information'
                  isExpanded={expandedSections.statusInfo}
                  onToggle={() => toggleSection('statusInfo')}
                  bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
                >
                  <InfoTable
                    data={[
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
                      {
                        label: 'Status Code',
                        value:
                          statusData?.status_code ||
                          (typeof statusData === 'string' ? statusData : '-'),
                      },
                      {
                        label: 'Status Name',
                        value:
                          statusData?.status_name ||
                          (typeof statusData === 'string' ? statusData : '-'),
                      },
                      {
                        label: 'Status Category',
                        value: statusData?.category || '-',
                      },
                      {
                        label: 'Status Description',
                        value: statusData?.status_description || '-',
                      },
                      {
                        label: 'Status ID',
                        value: checklist?.statusId || statusData?.id || '-',
                        copyable: Boolean(
                          checklist?.statusId || statusData?.id
                        ),
                      },
                    ]}
                  />
                </AccordionItem>

                {/* System Information */}
                <AccordionItem
                  title='System Information'
                  isExpanded={expandedSections.systemInfo}
                  onToggle={() => toggleSection('systemInfo')}
                  bgColor='bg-gradient-to-r from-gray-50 to-gray-100'
                >
                  <InfoTable
                    data={[
                      {
                        label: 'Created At',
                        value: formatDateTime(checklist.createdAt),
                      },
                      {
                        label: 'Updated At',
                        value: formatDateTime(checklist.updatedAt),
                      },
                      {
                        label: 'Created By',
                        value: checklist.createdBy || '-',
                        copyable: Boolean(checklist.createdBy),
                      },
                      {
                        label: 'Updated By',
                        value: checklist.updatedBy || '-',
                        copyable: Boolean(checklist.updatedBy),
                      },
                      {
                        label: 'Checklist ID',
                        value: checklist.id || '-',
                        copyable: Boolean(checklist.id),
                      },
                    ]}
                  />
                </AccordionItem>
              </div>
            </TabPanel>

            {/* Purchase Order Tab */}
            <TabPanel tabId='purchaseOrder'>
              {purchaseOrders.length > 0 ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      Purchase Order Details
                    </h3>
                    <div className='px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full'>
                      {purchaseOrders.length} purchase order{purchaseOrders.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  {purchaseOrders.map((purchaseOrder, index) => (
                    <div
                      key={purchaseOrder.id || index}
                      className='overflow-hidden bg-white border border-gray-200 rounded-lg mb-4'
                    >
                      <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50'>
                        <h4 className='text-lg font-semibold text-gray-900'>
                          PO #{index + 1}: {purchaseOrder.po_number}
                        </h4>
                      </div>
                      <div className='px-6 py-4'>
                        <InfoTable
                          data={[
                            {
                              label: 'PO Number',
                              value: purchaseOrder.po_number || '-',
                            },
                            {
                              label: 'PO Date',
                              value: formatDateTime(purchaseOrder.po_date),
                            },
                            {
                              label: 'PO Type',
                              value: purchaseOrder.po_type || '-',
                            },
                            {
                              label: 'Tanggal Masuk PO',
                              value: formatDateTime(purchaseOrder.tanggal_masuk_po),
                            },
                            {
                              label: 'Tanggal Batas Kirim',
                              value: formatDateTime(
                                purchaseOrder.tanggal_batas_kirim
                              ),
                            },
                            {
                              label: 'Delivery Date',
                              value: formatDateTime(purchaseOrder.delivery_date),
                            },
                            {
                              label: 'Total Items',
                              value: formatNumberValue(purchaseOrder.total_items),
                            },
                            {
                              label: 'Total Before Discount',
                              value: formatNumberValue(
                                purchaseOrder.total_before_discount
                              ),
                            },
                            {
                              label: 'Total Discount',
                              value: formatNumberValue(
                                purchaseOrder.total_discount
                              ),
                            },
                            {
                              label: 'Total Additional Charges',
                              value: formatNumberValue(
                                purchaseOrder.total_additional_charges
                              ),
                            },
                            {
                              label: 'Total Tax',
                              value: formatNumberValue(purchaseOrder.total_tax),
                            },
                            {
                              label: 'Grand Total',
                              value: formatNumberValue(purchaseOrder.grand_total),
                            },
                            {
                              label: 'Payable Amount',
                              value: formatNumberValue(
                                purchaseOrder.payable_amount
                              ),
                            },
                            {
                              label: 'Remarks',
                              value: purchaseOrder.remarks || '-',
                            },
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <ShoppingCartIcon
                      className='w-8 h-8 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Purchase Order Found
                  </h3>
                  <p className='text-gray-500'>
                    No purchase order data available for this checklist.
                  </p>
                </div>
              )}
            </TabPanel>

            {/* Surat Jalan Tab */}
            <TabPanel tabId='suratJalan'>
              {suratJalanData.length > 0 ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      Surat Jalan Details
                    </h3>
                    <div className='px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full'>
                      {suratJalanData.length} surat jalan
                    </div>
                  </div>

                  {suratJalanData.map((suratJalan, index) => {
                    const sjStatus = suratJalan?.status;
                    const sjStatusDisplay =
                      typeof sjStatus === 'string'
                        ? sjStatus
                        : sjStatus?.status_name ||
                          sjStatus?.status_code ||
                          'UNKNOWN';
                    const sjStatusVariant = resolveStatusVariant(
                      typeof sjStatus === 'string'
                        ? sjStatus
                        : sjStatus?.status_name || sjStatus?.status_code
                    );

                    return (
                      <div
                        key={suratJalan.id || index}
                        className='overflow-hidden bg-white border border-gray-200 rounded-lg mb-4'
                      >
                        <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Surat Jalan #{index + 1}:{' '}
                            {suratJalan.no_surat_jalan}
                          </h4>
                        </div>
                        <div className='px-6 py-4'>
                          <InfoTable
                            data={[
                              {
                                label: 'No Surat Jalan',
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
                                label: 'Status',
                                component: (
                                  <StatusBadge
                                    status={sjStatusDisplay}
                                    variant={sjStatusVariant}
                                    size='sm'
                                    dot
                                  />
                                ),
                              },
                              {
                                label: 'Is Printed',
                                value: formatBooleanValue(
                                  suratJalan.is_printed
                                ),
                              },
                              {
                                label: 'Print Counter',
                                value: formatNumberValue(
                                  suratJalan.print_counter
                                ),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <TruckIcon
                      className='w-8 h-8 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Surat Jalan Found
                  </h3>
                  <p className='text-gray-500'>
                    No surat jalan data available for this checklist.
                  </p>
                </div>
              )}
            </TabPanel>

            {/* Packing Tab */}
            <TabPanel tabId='packing'>
              {packingList.length > 0 ? (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      Packing Details
                    </h3>
                    <div className='px-3 py-1 text-sm font-medium text-purple-800 bg-purple-100 rounded-full'>
                      {packingList.length} packing{packingList.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  {packingList.map((packing, index) => {
                    const packingBoxes = Array.isArray(packing?.packingBoxes)
                      ? packing.packingBoxes
                      : [];
                    const isExpanded = expandedPackings[packing.id] ?? true;

                    return (
                      <div
                        key={packing.id || index}
                        className='overflow-hidden bg-white border border-gray-200 rounded-lg mb-4'
                      >
                        <div
                          className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors'
                          onClick={() => togglePacking(packing.id)}
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <h4 className='text-lg font-semibold text-gray-900'>
                                Packing #{index + 1}: {packing.packing_number}
                              </h4>
                              {packing.po_number && (
                                <p className='text-sm text-gray-600 mt-1'>
                                  PO: {packing.po_number}
                                </p>
                              )}
                            </div>
                            <ChevronDownIcon
                              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                        {isExpanded && (
                          <div className='px-6 py-4'>
                          <InfoTable
                            data={[
                              {
                                label: 'Packing Number',
                                value: packing.packing_number || '-',
                              },
                              {
                                label: 'PO Number',
                                value: packing.po_number || '-',
                              },
                              {
                                label: 'Tanggal Packing',
                                value: formatDateTime(packing.tanggal_packing),
                              },
                              {
                                label: 'Is Printed',
                                value: formatBooleanValue(packing.is_printed),
                              },
                              {
                                label: 'Print Counter',
                                value: formatNumberValue(packing.print_counter),
                              },
                            ]}
                          />

                          {packingBoxes.length > 0 && (
                            <div className='mt-6'>
                              <h5 className='mb-4 text-md font-semibold text-gray-900'>
                                Packing Boxes ({packingBoxes.length})
                              </h5>
                              <div className='max-h-96 overflow-auto bg-white border border-gray-200 rounded-lg'>
                                <table className='min-w-full divide-y divide-gray-200'>
                                  <thead className='bg-gray-50 sticky top-0 z-10'>
                                    <tr>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Box Number
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Total Qty
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Status
                                      </th>
                                      <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                        Items
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className='bg-white divide-y divide-gray-200'>
                                    {packingBoxes.map((box, boxIndex) => (
                                      <tr
                                        key={box.id || boxIndex}
                                        className='hover:bg-gray-50'
                                      >
                                        <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                                          {box.no_box || '-'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {formatNumberValue(box.total_quantity_in_box)}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                          {box.status?.status_name || '-'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900'>
                                          {box.packingBoxItems?.map((item, idx) => (
                                            <div key={idx} className='mb-1'>
                                              {item.nama_barang} ({item.quantity} pcs)
                                              {item.keterangan && (
                                                <span className='text-xs text-gray-500'>
                                                  {' '}
                                                  - {item.keterangan}
                                                </span>
                                              )}
                                            </div>
                                          ))}
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
                    );
                  })}
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <CubeIcon
                      className='w-8 h-8 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Packing Found
                  </h3>
                  <p className='text-gray-500'>
                    No packing data available for this checklist.
                  </p>
                </div>
              )}
            </TabPanel>

            {/* Customer Tab */}
            <TabPanel tabId='customer'>
              {customer ? (
                <div className='space-y-6'>
                  <AccordionItem
                    title='Customer Information'
                    isExpanded={true}
                    onToggle={() => {}}
                    bgColor='bg-gradient-to-r from-green-50 to-emerald-50'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Nama Customer',
                          value:
                            customer.namaCustomer ||
                            customer.nama_customer ||
                            customer.name ||
                            '-',
                        },
                        {
                          label: 'Kode Customer',
                          value:
                            customer.kodeCustomer ||
                            customer.kode_customer ||
                            customer.code ||
                            '-',
                        },
                        {
                          label: 'Email',
                          value: customer.email || '-',
                        },
                        {
                          label: 'Phone Number',
                          value: customer.phoneNumber || '-',
                        },
                        {
                          label: 'NPWP',
                          value: customer.NPWP || '-',
                        },
                        {
                          label: 'Alamat NPWP',
                          value: customer.alamatNPWP || '-',
                        },
                        {
                          label: 'Alamat Pengiriman',
                          value: customer.alamatPengiriman || '-',
                        },
                        {
                          label: 'Group Customer ID',
                          value: customer.groupCustomerId || '-',
                          copyable: Boolean(customer.groupCustomerId),
                        },
                        {
                          label: 'Region ID',
                          value: customer.regionId || '-',
                          copyable: Boolean(customer.regionId),
                        },
                        {
                          label: 'Description',
                          value: customer.description || '-',
                        },
                      ]}
                    />
                  </AccordionItem>
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <UserIcon
                      className='w-8 h-8 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Customer Found
                  </h3>
                  <p className='text-gray-500'>
                    No customer data available for this checklist.
                  </p>
                </div>
              )}
            </TabPanel>

            {/* Supplier Tab */}
            <TabPanel tabId='supplier'>
              {supplier ? (
                <div className='space-y-6'>
                  <AccordionItem
                    title='Supplier Information'
                    isExpanded={true}
                    onToggle={() => {}}
                    bgColor='bg-gradient-to-r from-purple-50 to-indigo-50'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Supplier Name',
                          value: supplier.nama_supplier || supplier.name || '-',
                        },
                        {
                          label: 'Supplier Code',
                          value: supplier.code || '-',
                        },
                        {
                          label: 'Description',
                          value: supplier.description || '-',
                        },
                        {
                          label: 'Address',
                          value: supplier.address || '-',
                        },
                        {
                          label: 'Phone Number',
                          value: supplier.phoneNumber || '-',
                        },
                        {
                          label: 'Email',
                          value: supplier.email || '-',
                        },
                        {
                          label: 'Fax',
                          value: supplier.fax || '-',
                        },
                        {
                          label: 'Bank Name',
                          value: supplier.bank?.name || '-',
                        },
                        {
                          label: 'Bank Holder',
                          value: supplier.bank?.holder || '-',
                        },
                        {
                          label: 'Bank Account',
                          value: supplier.bank?.account || '-',
                        },
                      ]}
                    />
                  </AccordionItem>
                </div>
              ) : (
                <div className='py-12 text-center'>
                  <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full'>
                    <BuildingStorefrontIcon
                      className='w-8 h-8 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    No Supplier Found
                  </h3>
                  <p className='text-gray-500'>
                    No supplier data available for this checklist.
                  </p>
                </div>
              )}
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel tabId='activity'>
              <ActivityTimeline
                auditTrails={normalizedAuditTrails}
                title='Activity Timeline'
                emptyMessage='Belum ada audit trail untuk checklist ini.'
              />
            </TabPanel>
          </TabContent>
          </div>
        )}
    </div>
  );
};

export default CheckingListDetailCard;
