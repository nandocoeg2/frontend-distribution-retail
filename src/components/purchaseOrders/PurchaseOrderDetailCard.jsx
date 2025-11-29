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
  const [activeTab, setActiveTab] = useState('details');
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
    { id: 'overview', label: 'Overview', icon: <DocumentTextIcon className='w-4 h-4' /> },
    { id: 'details', label: 'Details', icon: <ListBulletIcon className='w-4 h-4' /> },
    { id: 'documents', label: 'Documents', icon: <FolderIcon className='w-4 h-4' /> },
    { id: 'timeline', label: 'Timeline', icon: <ClockIcon className='w-4 h-4' />, badge: order?.auditTrails?.length },
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
      <div className='flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 rounded bg-emerald-100'>
            <ShoppingCartIcon className='w-4 h-4 text-emerald-600' />
          </div>
          <div>
            <h3 className='text-sm font-bold text-gray-900'>PO Details</h3>
            <p className='text-xs text-gray-600'>{order?.po_number || 'N/A'}</p>
          </div>
        </div>
        <button onClick={onClose} className='p-1 rounded hover:bg-gray-100' title="Close">
          <XMarkIcon className='w-4 h-4 text-gray-500' />
        </button>
      </div>

      <div className='border-b border-gray-200 bg-gray-50'>
        <nav className='flex px-2 gap-1'>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-1.5 px-2 border-b-2 text-xs font-medium flex items-center gap-1 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.icon}<span>{tab.label}</span>
              {tab.badge && <span className='px-1.5 py-0.5 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full'>{tab.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className='p-3 max-h-[500px] overflow-y-auto'>
        {activeTab === 'overview' && (
          <div className='space-y-2'>
            <AccordionItem title='Basic Info' isExpanded={expandedSections.basicInfo} onToggle={() => toggleSection('basicInfo')} bgColor='bg-emerald-50' compact>
              <InfoTable compact data={[
                { label: 'PO#', value: order.po_number },
                { label: 'Tgl Masuk', value: formatDate(order.tanggal_masuk_po) },
                { label: 'Batas Kirim', value: formatDate(order.tanggal_batas_kirim) },
                { label: 'Type', value: order.po_type },
                { label: 'Items', value: order.total_items },
                { label: 'TOP', value: order.termOfPayment?.kode_top || '-' },
              ]} />
            </AccordionItem>

            <AccordionItem title='Customer & Supplier' isExpanded={expandedSections.customerSupplier} onToggle={() => toggleSection('customerSupplier')} bgColor='bg-blue-50' compact>
              <InfoTable compact data={[
                { label: 'Customer', value: order.customer?.namaCustomer || '-' },
                { label: 'Code', value: order.customer?.kodeCustomer || '-' },
                { label: 'Email', value: order.customer?.email || '-' },
                { label: 'Phone', value: order.customer?.phoneNumber || '-' },
                { label: 'Supplier', value: order.supplier?.name || 'Not assigned' },
              ]} />
            </AccordionItem>

            <AccordionItem title='Status' isExpanded={expandedSections.statusInfo} onToggle={() => toggleSection('statusInfo')} bgColor='bg-yellow-50' compact>
              <InfoTable compact data={[
                { label: 'Status', component: <StatusBadge status={order.status?.status_name} variant={resolveStatusVariant(order.status?.status_name)} size='xs' dot /> },
                { label: 'Code', value: order.status?.status_code || '-' },
              ]} />
            </AccordionItem>

            <AccordionItem title='System Info' isExpanded={expandedSections.metaInfo} onToggle={() => toggleSection('metaInfo')} bgColor='bg-gray-50' compact>
              <InfoTable compact data={[
                { label: 'Created', value: formatDateTime(order.createdAt) },
                { label: 'Updated', value: formatDateTime(order.updatedAt) },
                { label: 'PO ID', value: order.id, copyable: true },
                { label: 'Customer ID', value: order.customerId || '-', copyable: !!order.customerId },
                { label: 'Supplier ID', value: order.supplierId || '-', copyable: !!order.supplierId },
              ]} />
            </AccordionItem>
          </div>
        )}

        {activeTab === 'details' && (
          <div className='overflow-hidden bg-white border border-gray-200 rounded'>
            <PurchaseOrderDetailsTable details={order.purchaseOrderDetails || []} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className='space-y-2'>
            <AccordionItem title='Print Documents' isExpanded={expandedSections.documentsPrint} onToggle={() => toggleSection('documentsPrint')} bgColor='bg-orange-50' compact>
              <div className='py-2 space-y-2'>
                <label className='flex items-center p-2 border border-gray-200 rounded bg-gray-50 cursor-pointer'>
                  <input type='checkbox' checked={Object.values(selectedDocuments).every((v) => v)} onChange={handleSelectAll} className='w-3 h-3 text-blue-600 border-gray-300 rounded' />
                  <span className='ml-2 text-xs font-semibold text-gray-900'>Select All</span>
                </label>

                <div className='space-y-1'>
                  {[{ key: 'PURCHASE_ORDER', label: 'Purchase Order', info: purchaseOrderPrintInfo, enabled: true },
                    { key: 'PACKING', label: 'Packing', info: order.packing ? `${order.packing.packing_number} • ${order.packing.is_printed ? 'Printed' : 'Not printed'}` : 'N/A', enabled: !!order.packing },
                    { key: 'INVOICE_PENGIRIMAN', label: 'Invoice', info: order.invoice ? `${order.invoice.no_invoice} • ${order.invoice.is_printed ? 'Printed' : 'Not printed'}` : 'N/A', enabled: !!order.invoice },
                    { key: 'SURAT_JALAN', label: 'Surat Jalan', info: order.suratJalan ? `${order.suratJalan.no_surat_jalan} • ${order.suratJalan.is_printed ? 'Printed' : 'Not printed'}` : 'N/A', enabled: !!order.suratJalan },
                  ].map((doc) => (
                    <label key={doc.key} className={`flex items-center p-2 border rounded cursor-pointer ${doc.enabled ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                      <input type='checkbox' checked={selectedDocuments[doc.key]} onChange={() => handleDocumentCheckbox(doc.key)} disabled={!doc.enabled} className='w-3 h-3 text-blue-600 border-gray-300 rounded disabled:opacity-50' />
                      <div className='ml-2 flex-1'>
                        <p className='text-xs font-medium text-gray-900'>{doc.label}</p>
                        <p className='text-xs text-gray-500'>{doc.info}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className='flex justify-end pt-2'>
                  <button onClick={handlePrintDocuments} disabled={printing || !Object.values(selectedDocuments).some((v) => v)} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                    {printing ? 'Printing...' : 'Mark as Printed'}
                  </button>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title='Surat Jalan' isExpanded={expandedSections.documentsSuratJalan} onToggle={() => toggleSection('documentsSuratJalan')} bgColor='bg-blue-50' compact>
              {order.suratJalan ? (
                <InfoTable compact data={[
                  { label: 'No. SJ', value: order.suratJalan.no_surat_jalan, copyable: true },
                  { label: 'Deliver To', value: order.suratJalan.deliver_to },
                  { label: 'PIC', value: order.suratJalan.PIC },
                  { label: 'Alamat', value: order.suratJalan.alamat_tujuan },
                  { label: 'Status', component: <StatusBadge status={order.suratJalan.status?.status_name} variant={resolveStatusVariant(order.suratJalan.status?.status_name)} size='xs' dot /> },
                  { label: 'Printed', value: order.suratJalan.is_printed ? 'Yes' : 'No' },
                ]} />
              ) : <div className='py-2 text-center text-xs text-gray-500'>No Surat Jalan</div>}
            </AccordionItem>

            <AccordionItem title='Invoice' isExpanded={expandedSections.documentsInvoice} onToggle={() => toggleSection('documentsInvoice')} bgColor='bg-green-50' compact>
              {order.invoice ? (
                <InfoTable compact data={[
                  { label: 'No. Invoice', value: order.invoice.no_invoice, copyable: true },
                  { label: 'Tanggal', value: formatDate(order.invoice.tanggal) },
                  { label: 'Grand Total', value: `Rp ${parseInt(order.invoice.grand_total).toLocaleString('id-ID')}` },
                  { label: 'PPN', value: `${order.invoice.ppn_percentage}%` },
                  { label: 'TOP', value: `${order.invoice.TOP} hari` },
                  { label: 'Status', component: <StatusBadge status={order.invoice.status?.status_name || order.invoice.statusPembayaran?.status_name || '-'} variant={resolveStatusVariant(order.invoice.status?.status_name || order.invoice.statusPembayaran?.status_name)} size='xs' dot /> },
                ]} />
              ) : <div className='py-2 text-center text-xs text-gray-500'>No Invoice</div>}
            </AccordionItem>

            <AccordionItem title='Packing' isExpanded={expandedSections.documentsPacking} onToggle={() => toggleSection('documentsPacking')} bgColor='bg-purple-50' compact>
              {order.packing ? (
                <InfoTable compact data={[
                  { label: 'Number', value: order.packing.packing_number, copyable: true },
                  { label: 'Tanggal', value: formatDate(order.packing.tanggal_packing) },
                  { label: 'Boxes', value: order.packing.packingBoxes?.length || 0 },
                  { label: 'Items', value: order.packing.packingBoxes?.reduce((s, b) => s + (b.packingBoxItems?.length || 0), 0) || 0 },
                  { label: 'Status', component: <StatusBadge status={order.packing.status?.status_name} variant={resolveStatusVariant(order.packing.status?.status_name)} size='xs' dot /> },
                ]} />
              ) : <div className='py-2 text-center text-xs text-gray-500'>No Packing</div>}
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

      <AlertComponent />
    </div>
  );
};

export default PurchaseOrderDetailCard;
