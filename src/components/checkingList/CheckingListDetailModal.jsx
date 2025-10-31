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
} from '@heroicons/react/24/outline';
import { TabContainer, Tab, TabContent, TabPanel } from '../ui/Tabs';
import { AccordionItem, StatusBadge, InfoTable } from '../ui';
import { formatDateTime } from '../../utils/formatUtils';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { exportCheckingListToPDF } from './PrintCheckingList';
import ActivityTimeline from '../common/ActivityTimeline';

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

const CheckingListDetailModal = ({
  isOpen,
  onClose,
  checklist,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    statusInfo: false,
    systemInfo: false,
  });

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

  if (!isOpen || !checklist) return null;

  // Normalize suratJalan data
  const suratJalanData = Array.isArray(checklist?.suratJalan)
    ? checklist.suratJalan
    : checklist?.suratJalan
      ? [checklist.suratJalan]
      : [];

  // Get first surat jalan for related data (PO, Customer, Supplier, Packing)
  const firstSuratJalan = suratJalanData[0];
  const purchaseOrder = firstSuratJalan?.purchaseOrder;
  const customer = purchaseOrder?.customer;
  const supplier = purchaseOrder?.supplier;
  const packing = purchaseOrder?.packing;
  const packingItems = Array.isArray(packing?.packingItems)
    ? packing.packingItems
    : packing?.packingItems
      ? [packing.packingItems]
      : [];

  // Status handling
  const statusData = checklist?.status;
  const statusDisplay =
    typeof statusData === 'string'
      ? statusData
      : statusData?.status_name ||
        statusData?.status_code ||
        'UNKNOWN';
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

  const handleExportPdf = () => {
    if (isLoading || !checklist) {
      return;
    }
    exportCheckingListToPDF(checklist);
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
      disabled: !purchaseOrder,
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
      disabled: !packing,
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
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
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
              disabled={isLoading || !checklist}
              className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ArrowDownTrayIcon className='w-5 h-5' />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className='p-2 transition-colors rounded-lg hover:bg-gray-100'
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
        <div className='flex-1 p-6 overflow-y-auto'>
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
                        label: 'Checklist ID',
                        value: checklist.id || '-',
                        copyable: Boolean(checklist?.id),
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
                        value:
                          checklist?.statusId ||
                          statusData?.id ||
                          '-',
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
              {purchaseOrder ? (
                <div className='space-y-6'>
                  <AccordionItem
                    title='Purchase Order Details'
                    isExpanded={true}
                    onToggle={() => {}}
                    bgColor='bg-gradient-to-r from-emerald-50 to-green-50'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Purchase Order ID',
                          value: purchaseOrder.id || '-',
                          copyable: Boolean(purchaseOrder.id),
                        },
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
                          value: formatDateTime(
                            purchaseOrder.tanggal_masuk_po
                          ),
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
                  </AccordionItem>
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
                            Surat Jalan #{index + 1}: {suratJalan.no_surat_jalan}
                          </h4>
                        </div>
                        <div className='px-6 py-4'>
                          <InfoTable
                            data={[
                              {
                                label: 'Surat Jalan ID',
                                value: suratJalan.id || '-',
                                copyable: Boolean(suratJalan.id),
                              },
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
                              {
                                label: 'Invoice ID',
                                value: suratJalan.invoiceId || '-',
                                copyable: Boolean(suratJalan.invoiceId),
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
              {packing ? (
                <div className='space-y-6'>
                  <AccordionItem
                    title='Packing Information'
                    isExpanded={true}
                    onToggle={() => {}}
                    bgColor='bg-gradient-to-r from-blue-50 to-indigo-50'
                  >
                    <InfoTable
                      data={[
                        {
                          label: 'Packing ID',
                          value: packing.id || '-',
                          copyable: Boolean(packing.id),
                        },
                        {
                          label: 'Packing Number',
                          value: packing.packing_number || '-',
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
                        {
                          label: 'Purchase Order ID',
                          value: packing.purchaseOrderId || '-',
                          copyable: Boolean(packing.purchaseOrderId),
                        },
                      ]}
                    />
                  </AccordionItem>

                  {packingItems.length > 0 && (
                    <div>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                        Packing Items ({packingItems.length})
                      </h3>
                      <div className='overflow-x-auto bg-white border border-gray-200 rounded-lg'>
                        <table className='min-w-full divide-y divide-gray-200'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                Nama Barang
                              </th>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                Total Qty
                              </th>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                Jumlah Carton
                              </th>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                Isi per Carton
                              </th>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                No Box
                              </th>
                              <th className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                Mixed Carton
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white divide-y divide-gray-200'>
                            {packingItems.map((item, itemIndex) => (
                              <tr
                                key={item.id || itemIndex}
                                className='hover:bg-gray-50'
                              >
                                <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap'>
                                  {item.nama_barang || '-'}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                  {formatNumberValue(item.total_qty)}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                  {formatNumberValue(item.jumlah_carton)}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                  {formatNumberValue(item.isi_per_carton)}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                  {item.no_box || '-'}
                                </td>
                                <td className='px-6 py-4 text-sm text-gray-900 whitespace-nowrap'>
                                  {formatBooleanValue(item.is_mixed_carton)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                          label: 'Customer ID',
                          value: customer.id || '-',
                          copyable: Boolean(customer.id),
                        },
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
                          label: 'Supplier ID',
                          value: supplier.id || '-',
                          copyable: Boolean(supplier.id),
                        },
                        {
                          label: 'Supplier Name',
                          value:
                            supplier.nama_supplier ||
                            supplier.name ||
                            '-',
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

export default CheckingListDetailModal;
