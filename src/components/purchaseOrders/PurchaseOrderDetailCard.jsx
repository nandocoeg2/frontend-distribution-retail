import React, { useState } from 'react';
import {
  ArchiveBoxIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  ListBulletIcon,
  ShoppingCartIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PurchaseOrderDetailsTable from './PurchaseOrderDetailsTable';
import ActivityTimeline from '../common/ActivityTimeline';
import { formatDate, formatDateTime } from '../../utils/formatUtils';
import { resolveStatusVariant } from '../../utils/modalUtils';
import {
  AccordionItem,
  StatusBadge,
  InfoTable,
  useAlert,
} from '../ui';
import purchaseOrderService from '../../services/purchaseOrderService';
import { getPackingById, exportPackingSticker } from '../../services/packingService';
import authService from '../../services/authService';
import invoicePengirimanService from '../../services/invoicePengirimanService';
import suratJalanService from '../../services/suratJalanService';

const PurchaseOrderDetailCard = ({ order, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { showSuccess, showError, AlertComponent } = useAlert();
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    customerSupplier: false,
    statusInfo: false,
    metaInfo: false,
    documentsSuratJalan: false,
    documentsInvoice: false,
    documentsPacking: false,
    documentsPrint: true,
  });

  const [selectedDocuments, setSelectedDocuments] = useState({
    PURCHASE_ORDER: false,
    PACKING: false,
    INVOICE_PENGIRIMAN: false,
    SURAT_JALAN: false,
  });

  const [printing, setPrinting] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDocumentCheckbox = (documentType) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [documentType]: !prev[documentType],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedDocuments).every((val) => val);
    const newValue = !allSelected;
    setSelectedDocuments({
      PURCHASE_ORDER: newValue,
      PACKING: newValue,
      INVOICE_PENGIRIMAN: newValue,
      SURAT_JALAN: newValue,
    });
  };

  const resolveEntityId = (entity, fallbackKeys = []) => {
    if (!entity || typeof entity !== 'object') {
      return null;
    }
    if (entity.id) {
      return entity.id;
    }
    if (entity._id) {
      return entity._id;
    }
    for (const key of fallbackKeys) {
      if (entity[key]) {
        return entity[key];
      }
    }
    return null;
  };

  const unwrapServiceResponse = (result) => {
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data;
    }
    return result;
  };

  const handlePrintDocuments = async () => {
    if (!order?.id) return;

    const selectedDocs = Object.keys(selectedDocuments).filter(
      (key) => selectedDocuments[key]
    );

    if (selectedDocs.length === 0) {
      showError('Please select at least one document to print');
      return;
    }

    const exportTasks = [];

    if (selectedDocuments.PURCHASE_ORDER) {
      const details = Array.isArray(order?.purchaseOrderDetails)
        ? order.purchaseOrderDetails
        : [];

      if (!details.length) {
        showError('Purchase order details are not available for printing');
        return;
      }

      // NOTE: Purchase Order export will be handled by backend API in the future
      // For now, we only mark it as printed without generating the document
      console.info('Purchase Order will be marked as printed (export handled by backend)');
    }

    if (selectedDocuments.PACKING && order?.packing) {
      const packingId =
        resolveEntityId(order.packing, [
          'packingId',
          'packing_id',
          'id_packing',
        ]) ||
        order.packingId ||
        order.packing_id;

      if (!packingId) {
        showError('Packing ID is not available for printing');
        return;
      }

      exportTasks.push(async () => {
        const response = await getPackingById(packingId);
        const packingData = unwrapServiceResponse(response);

        if (!packingData) {
          throw new Error('Failed to fetch packing data');
        }

        const boxes = Array.isArray(packingData.packingBoxes)
          ? packingData.packingBoxes
          : [];

        if (!boxes.length) {
          throw new Error('Packing boxes data is empty');
        }

        const companyData = authService.getCompanyData();
        if (!companyData || !companyData.id) {
          throw new Error('Company ID tidak ditemukan. Silakan login ulang.');
        }

        const html = await exportPackingSticker(packingId, companyData.id);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
        } else {
          throw new Error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
        }
      });
    }

    if (selectedDocuments.INVOICE_PENGIRIMAN && order?.invoice) {
      const invoiceId =
        resolveEntityId(order.invoice, [
          'invoiceId',
          'invoice_id',
          'id_invoice',
        ]) ||
        order.invoiceId ||
        order.invoice_id;

      if (!invoiceId) {
        showError('Invoice ID is not available for printing');
        return;
      }

      exportTasks.push(async () => {
        const response =
          await invoicePengirimanService.getInvoicePengirimanById(invoiceId);
        const invoiceData = unwrapServiceResponse(response);

        if (!invoiceData) {
          throw new Error('Failed to fetch invoice pengiriman data');
        }

        const html = await invoicePengirimanService.exportInvoicePengiriman(invoiceId);
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
          throw new Error('Tidak dapat membuka jendela cetak. Periksa pengaturan pop-up browser.');
        }

        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      });
    }

    if (selectedDocuments.SURAT_JALAN && order?.suratJalan) {
      const suratJalanEntity = Array.isArray(order.suratJalan)
        ? order.suratJalan[0]
        : order.suratJalan;

      const suratJalanId =
        resolveEntityId(suratJalanEntity, [
          'suratJalanId',
          'surat_jalan_id',
          'id_surat_jalan',
        ]) ||
        order.suratJalanId ||
        order.surat_jalan_id;

      if (!suratJalanId) {
        showError('Surat jalan ID is not available for printing');
        return;
      }

      exportTasks.push(async () => {
        const response =
          await suratJalanService.getSuratJalanById(suratJalanId);
        const suratJalanData = unwrapServiceResponse(response);

        if (!suratJalanData) {
          throw new Error('Failed to fetch surat jalan data');
        }

        if (!suratJalanData.suratJalanDetails || suratJalanData.suratJalanDetails.length === 0) {
          throw new Error('Tidak ada detail surat jalan untuk dicetak');
        }

        const companyData = authService.getCompanyData();
        if (!companyData || !companyData.id) {
          throw new Error('Company ID tidak ditemukan. Silakan login ulang.');
        }

        const html = await suratJalanService.exportSuratJalan(suratJalanId, companyData.id);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          
          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };
        } else {
          throw new Error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
        }
      });
    }

    if (exportTasks.length === 0) {
      showError('Selected documents are not available to print');
      return;
    }

    setPrinting(true);
    try {
      for (const task of exportTasks) {
        await Promise.resolve(task());
      }

      const result = await purchaseOrderService.printDocuments(
        order.id,
        selectedDocs
      );

      if (result.success) {
        showSuccess(
          `Successfully marked ${selectedDocs.length} document(s) as printed`
        );
        if (onUpdate) {
          onUpdate();
        }
        setSelectedDocuments({
          PURCHASE_ORDER: false,
          PACKING: false,
          INVOICE_PENGIRIMAN: false,
          SURAT_JALAN: false,
        });
      } else {
        throw new Error('Failed to print documents');
      }
    } catch (error) {
      console.error('Failed to print documents:', error);
      showError(`Failed to print documents: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <DocumentTextIcon className='w-5 h-5' aria-hidden='true' />,
    },
    {
      id: 'details',
      label: 'Order Details',
      icon: <ListBulletIcon className='w-5 h-5' aria-hidden='true' />,
    },
    {
      id: 'documents',
      label: 'Documents Information',
      icon: <FolderIcon className='w-5 h-5' aria-hidden='true' />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <ClockIcon className='w-5 h-5' aria-hidden='true' />,
      badge: order?.auditTrails?.length,
    },
  ];

  const purchaseOrderExportInfoParts = [];
  if (order?.po_number) {
    purchaseOrderExportInfoParts.push(`PO: ${order.po_number}`);
  }
  const purchaseOrderPrintedRaw =
    order?.is_printed ??
    order?.isPrinted ??
    order?.po_is_printed ??
    order?.poIsPrinted ??
    null;
  if (
    purchaseOrderPrintedRaw !== null &&
    purchaseOrderPrintedRaw !== undefined
  ) {
    let isPrinted = null;
    if (typeof purchaseOrderPrintedRaw === 'boolean') {
      isPrinted = purchaseOrderPrintedRaw;
    } else if (typeof purchaseOrderPrintedRaw === 'string') {
      const normalized = purchaseOrderPrintedRaw.trim().toLowerCase();
      if (
        normalized === 'yes' ||
        normalized === 'y' ||
        normalized === 'printed' ||
        normalized === '1'
      ) {
        isPrinted = true;
      } else if (
        normalized === 'no' ||
        normalized === 'n' ||
        normalized === '0' ||
        normalized === 'unprinted'
      ) {
        isPrinted = false;
      }
    } else if (typeof purchaseOrderPrintedRaw === 'number') {
      isPrinted = purchaseOrderPrintedRaw > 0;
    }

    if (isPrinted !== null) {
      purchaseOrderExportInfoParts.push(`Printed: ${isPrinted ? 'Yes' : 'No'}`);
    }
  }

  const purchaseOrderPrintCounter =
    order?.print_counter ??
    order?.printCounter ??
    order?.po_print_counter ??
    order?.poPrintCounter;
  if (
    purchaseOrderPrintCounter !== null &&
    purchaseOrderPrintCounter !== undefined
  ) {
    purchaseOrderExportInfoParts.push(`Counter: ${purchaseOrderPrintCounter}`);
  }

  const purchaseOrderPrintInfo =
    purchaseOrderExportInfoParts.length > 0
      ? purchaseOrderExportInfoParts.join(' • ')
      : 'Ready to export purchase order PDF';

  if (!order) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 rounded-lg bg-emerald-100'>
            <ShoppingCartIcon
              className='w-6 h-6 text-emerald-600'
              aria-hidden='true'
            />
          </div>
          <div>
            <h3 className='text-lg font-bold text-gray-900'>
              Purchase Order Details
            </h3>
            <p className='text-sm text-gray-600'>
              {order?.po_number || 'N/A'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className='p-2 transition-colors rounded-lg hover:bg-gray-100'
          title="Close"
        >
          <XMarkIcon className='w-5 h-5 text-gray-500' />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className='border-b border-gray-200 bg-gray-50'>
        <nav className='flex px-4 space-x-6' aria-label='Tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
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
      <div className='p-4 max-h-[600px] overflow-y-auto'>
        {activeTab === 'overview' && (
          <div className='space-y-4'>
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
                    value: order.termOfPayment?.kode_top || '-',
                  },
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
                    label: 'Customer Name',
                    value: order.customer?.namaCustomer || '-',
                  },
                  {
                    label: 'Customer Code',
                    value: order.customer?.kodeCustomer || '-',
                  },
                  {
                    label: 'Customer Email',
                    value: order.customer?.email || '-',
                  },
                  {
                    label: 'Customer Phone',
                    value: order.customer?.phoneNumber || '-',
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
                    value: order.status?.status_code || '-',
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
                  { label: 'PO ID', value: order.id, copyable: true },
                  {
                    label: 'Customer ID',
                    value: order.customerId || '-',
                    copyable: order.customerId ? true : false,
                  },
                  {
                    label: 'Supplier ID',
                    value: order.supplierId || 'Not assigned',
                    copyable: order.supplierId ? true : false,
                  },
                ]}
              />
            </AccordionItem>
          </div>
        )}

        {activeTab === 'details' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-lg font-semibold text-gray-900'>
                Purchase Order Details
              </h4>
            </div>
            <div className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
              <PurchaseOrderDetailsTable
                details={order.purchaseOrderDetails || []}
              />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className='space-y-4'>
            {/* Print Documents */}
            <AccordionItem
              title='Print Documents'
              isExpanded={expandedSections.documentsPrint}
              onToggle={() => toggleSection('documentsPrint')}
              bgColor='bg-gradient-to-r from-orange-50 to-orange-100'
            >
              <div className='py-4 space-y-4'>
                {/* Select All Checkbox */}
                <div className='flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50'>
                  <input
                    type='checkbox'
                    id='select-all'
                    checked={Object.values(selectedDocuments).every(
                      (val) => val
                    )}
                    onChange={handleSelectAll}
                    className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                  />
                  <label
                    htmlFor='select-all'
                    className='ml-3 text-sm font-semibold text-gray-900'
                  >
                    Select All Documents
                  </label>
                </div>

                {/* Document Checkboxes */}
                <div className='space-y-2'>
                  {/* Purchase Order */}
                  <div className='flex items-center justify-between p-3 border border-gray-200 rounded-lg transition-colors bg-white hover:bg-gray-50'>
                    <div className='flex items-center flex-1'>
                      <input
                        type='checkbox'
                        id='purchase-order-checkbox'
                        checked={selectedDocuments.PURCHASE_ORDER}
                        onChange={() =>
                          handleDocumentCheckbox('PURCHASE_ORDER')
                        }
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                      />
                      <label
                        htmlFor='purchase-order-checkbox'
                        className='flex-1 ml-3'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          Purchase Order
                        </p>
                        <p className='text-xs text-gray-500'>
                          {purchaseOrderPrintInfo}
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Packing */}
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      order.packing
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className='flex items-center flex-1'>
                      <input
                        type='checkbox'
                        id='packing-checkbox'
                        checked={selectedDocuments.PACKING}
                        onChange={() => handleDocumentCheckbox('PACKING')}
                        disabled={!order.packing}
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50'
                      />
                      <label
                        htmlFor='packing-checkbox'
                        className='flex-1 ml-3'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          Packing List
                        </p>
                        {order.packing ? (
                          <p className='text-xs text-gray-500'>
                            {order.packing.packing_number} • Printed:{' '}
                            {order.packing.is_printed ? 'Yes' : 'No'} • Counter:{' '}
                            {order.packing.print_counter || 0}
                          </p>
                        ) : (
                          <p className='text-xs text-gray-500'>
                            Document not available
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Invoice Pengiriman */}
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      order.invoice
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className='flex items-center flex-1'>
                      <input
                        type='checkbox'
                        id='invoice-checkbox'
                        checked={selectedDocuments.INVOICE_PENGIRIMAN}
                        onChange={() =>
                          handleDocumentCheckbox('INVOICE_PENGIRIMAN')
                        }
                        disabled={!order.invoice}
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50'
                      />
                      <label
                        htmlFor='invoice-checkbox'
                        className='flex-1 ml-3'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          Invoice Pengiriman
                        </p>
                        {order.invoice ? (
                          <p className='text-xs text-gray-500'>
                            {order.invoice.no_invoice} • Printed:{' '}
                            {order.invoice.is_printed ? 'Yes' : 'No'} • Counter:{' '}
                            {order.invoice.print_counter || 0}
                          </p>
                        ) : (
                          <p className='text-xs text-gray-500'>
                            Document not available
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Surat Jalan */}
                  <div
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      order.suratJalan
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className='flex items-center flex-1'>
                      <input
                        type='checkbox'
                        id='surat-jalan-checkbox'
                        checked={selectedDocuments.SURAT_JALAN}
                        onChange={() =>
                          handleDocumentCheckbox('SURAT_JALAN')
                        }
                        disabled={!order.suratJalan}
                        className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50'
                      />
                      <label
                        htmlFor='surat-jalan-checkbox'
                        className='flex-1 ml-3'
                      >
                        <p className='text-sm font-medium text-gray-900'>
                          Surat Jalan
                        </p>
                        {order.suratJalan ? (
                          <p className='text-xs text-gray-500'>
                            {order.suratJalan.no_surat_jalan} • Printed:{' '}
                            {order.suratJalan.is_printed ? 'Yes' : 'No'} • Counter:{' '}
                            {order.suratJalan.print_counter || 0}
                          </p>
                        ) : (
                          <p className='text-xs text-gray-500'>
                            Document not available
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className='flex justify-end pt-3'>
                  <button
                    onClick={handlePrintDocuments}
                    disabled={
                      printing ||
                      !Object.values(selectedDocuments).some((val) => val)
                    }
                    className='inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {printing ? (
                      <>
                        <svg
                          className='w-4 h-4 mr-2 animate-spin'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        Printing...
                      </>
                    ) : (
                      <>
                        <svg
                          className='w-4 h-4 mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
                          />
                        </svg>
                        Mark as Printed
                      </>
                    )}
                  </button>
                </div>
              </div>
            </AccordionItem>

            {/* Surat Jalan */}
            <AccordionItem
              title='Surat Jalan'
              isExpanded={expandedSections.documentsSuratJalan}
              onToggle={() => toggleSection('documentsSuratJalan')}
              bgColor='bg-gradient-to-r from-blue-50 to-blue-100'
            >
              {order.suratJalan ? (
                <InfoTable
                  data={[
                    {
                      label: 'No. Surat Jalan',
                      value: order.suratJalan.no_surat_jalan,
                      copyable: true,
                    },
                    {
                      label: 'Deliver To',
                      value: order.suratJalan.deliver_to,
                    },
                    {
                      label: 'PIC',
                      value: order.suratJalan.PIC,
                    },
                    {
                      label: 'Alamat Tujuan',
                      value: order.suratJalan.alamat_tujuan,
                    },
                    {
                      label: 'Status',
                      component: (
                        <StatusBadge
                          status={order.suratJalan.status?.status_name}
                          variant={resolveStatusVariant(
                            order.suratJalan.status?.status_name
                          )}
                          size='sm'
                          dot
                        />
                      ),
                    },
                    {
                      label: 'Is Printed',
                      value: order.suratJalan.is_printed ? 'Yes' : 'No',
                    },
                    {
                      label: 'Print Counter',
                      value: order.suratJalan.print_counter || 0,
                    },
                    {
                      label: 'Created At',
                      value: formatDateTime(order.suratJalan.createdAt),
                    },
                  ]}
                />
              ) : (
                <div className='py-6 text-center text-gray-500'>
                  <div className='flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full'>
                    <TruckIcon
                      className='w-6 h-6 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <p className='text-sm'>No Surat Jalan available</p>
                </div>
              )}
            </AccordionItem>

            {/* Invoice Pengiriman */}
            <AccordionItem
              title='Invoice Pengiriman'
              isExpanded={expandedSections.documentsInvoice}
              onToggle={() => toggleSection('documentsInvoice')}
              bgColor='bg-gradient-to-r from-green-50 to-green-100'
            >
              {order.invoice ? (
                <InfoTable
                  data={[
                    {
                      label: 'No. Invoice',
                      value: order.invoice.no_invoice,
                      copyable: true,
                    },
                    {
                      label: 'Deliver To',
                      value: order.invoice.deliver_to,
                    },
                    {
                      label: 'Tanggal',
                      value: formatDate(order.invoice.tanggal),
                    },
                    {
                      label: 'Sub Total',
                      value: `Rp ${parseInt(order.invoice.sub_total).toLocaleString('id-ID')}`,
                    },
                    {
                      label: 'Total Discount',
                      value: `Rp ${parseInt(order.invoice.total_discount).toLocaleString('id-ID')}`,
                    },
                    {
                      label: 'Total Price',
                      value: `Rp ${parseInt(order.invoice.total_price).toLocaleString('id-ID')}`,
                    },
                    {
                      label: 'Grand Total',
                      value: `Rp ${parseInt(order.invoice.grand_total).toLocaleString('id-ID')}`,
                    },
                    {
                      label: 'PPN Percentage',
                      value: `${order.invoice.ppn_percentage}%`,
                    },
                    {
                      label: 'TOP',
                      value: `${order.invoice.TOP} hari`,
                    },
                    {
                      label: 'Type',
                      value: order.invoice.type,
                    },
                    {
                      label: 'Status',
                      component: (
                        <StatusBadge
                          status={
                            order.invoice.status?.status_name ||
                            order.invoice.status?.status_code ||
                            order.invoice.statusPembayaran?.status_name ||
                            order.invoice.statusPembayaran?.status_code ||
                            '-'
                          }
                          variant={resolveStatusVariant(
                            order.invoice.status?.status_name ||
                              order.invoice.statusPembayaran?.status_name ||
                              order.invoice.status?.status_code ||
                              order.invoice.statusPembayaran?.status_code
                          )}
                          size='sm'
                          dot
                        />
                      ),
                    },
                    {
                      label: 'Created At',
                      value: formatDateTime(order.invoice.createdAt),
                    },
                  ]}
                />
              ) : (
                <div className='py-6 text-center text-gray-500'>
                  <div className='flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full'>
                    <DocumentTextIcon
                      className='w-6 h-6 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <p className='text-sm'>No Invoice available</p>
                </div>
              )}
            </AccordionItem>

            {/* Packing List */}
            <AccordionItem
              title='Packing'
              isExpanded={expandedSections.documentsPacking}
              onToggle={() => toggleSection('documentsPacking')}
              bgColor='bg-gradient-to-r from-purple-50 to-purple-100'
            >
              {order.packing ? (
                <InfoTable
                  data={[
                    {
                      label: 'Packing Number',
                      value: order.packing.packing_number,
                      copyable: true,
                    },
                    {
                      label: 'Tanggal Packing',
                      value: formatDate(order.packing.tanggal_packing),
                    },
                    {
                      label: 'Total Boxes',
                      value: order.packing.packingBoxes?.length || 0,
                    },
                    {
                      label: 'Total Items',
                      value:
                        order.packing.packingBoxes?.reduce(
                          (sum, box) =>
                            sum + (box.packingBoxItems?.length || 0),
                          0
                        ) || 0,
                    },
                    {
                      label: 'Status',
                      component: (
                        <StatusBadge
                          status={order.packing.status?.status_name}
                          variant={resolveStatusVariant(
                            order.packing.status?.status_name
                          )}
                          size='sm'
                          dot
                        />
                      ),
                    },
                    {
                      label: 'Created At',
                      value: formatDateTime(order.packing.createdAt),
                    },
                  ]}
                />
              ) : (
                <div className='py-6 text-center text-gray-500'>
                  <div className='flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full'>
                    <ArchiveBoxIcon
                      className='w-6 h-6 text-gray-400'
                      aria-hidden='true'
                    />
                  </div>
                  <p className='text-sm'>No Packing List available</p>
                </div>
              )}
            </AccordionItem>
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
      </div>

      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
};

export default PurchaseOrderDetailCard;
