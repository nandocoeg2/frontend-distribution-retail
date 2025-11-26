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
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { resolveStatusVariant } from '../../utils/modalUtils';
import { AccordionItem, StatusBadge, InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { formatDateTime, formatDate } from '../../utils/formatUtils';
import ActivityTimeline from '../common/ActivityTimeline';
import authService from '../../services/authService';
import suratJalanService from '../../services/suratJalanService';
import toastService from '../../services/toastService';
import { getPackingBoxes, getTotals } from '../../utils/suratJalanHelpers';
import SuratJalanForm from './SuratJalanForm';

const SuratJalanDetailCard = ({ suratJalan, onClose, loading = false, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPaketLoading, setExportPaketLoading] = useState(false);
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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      // Normalize payload to match API contract
      const sanitizedChecklist = (() => {
        if (!formData.checklistSuratJalan) {
          return null;
        }

        const { id, suratJalanId, createdAt, updatedAt, ...restChecklist } = formData.checklistSuratJalan;
        let tanggalValue = restChecklist.tanggal;

        if (tanggalValue) {
          if (!tanggalValue.endsWith('Z')) {
            if (tanggalValue.length === 16) {
              tanggalValue += ':00Z';
            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(tanggalValue)) {
              tanggalValue += '.000Z';
            }
          }
          tanggalValue = new Date(tanggalValue).toISOString();
        }

        return {
          ...restChecklist,
          tanggal: tanggalValue || null
        };
      })();

      const submitData = {
        no_surat_jalan: formData.no_surat_jalan,
        deliver_to: formData.deliver_to,
        PIC: formData.PIC,
        alamat_tujuan: formData.alamat_tujuan,
        invoiceId: formData.invoiceId || null,
        checklistSuratJalan: sanitizedChecklist
      };

      const result = await suratJalanService.updateSuratJalan(suratJalan.id, submitData);

      if (result.success) {
        toastService.success('Surat jalan updated successfully');
        setIsEditMode(false);
        if (onUpdate) {
          onUpdate(result.data);
        }
      } else {
        throw new Error(result.message || 'Failed to update surat jalan');
      }
    } catch (err) {
      console.error('Error updating surat jalan:', err);
      toastService.error(err.message || 'Failed to update surat jalan');
    } finally {
      setSaving(false);
    }
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

      setExportLoading(true);
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
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPaket = async () => {
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

      setExportPaketLoading(true);
      toastService.info('Generating paket dokumen (Invoice Pengiriman + Surat Jalan + Purchase Order)...');

      const html = await suratJalanService.exportSuratJalanPaket(suratJalan.id, companyData.id);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };

        toastService.success('Dokumen paket berhasil di-generate. Silakan print.');
      } else {
        toastService.error('Popup window diblokir. Silakan izinkan popup untuk mencetak.');
      }
    } catch (error) {
      console.error('Error exporting surat jalan paket:', error);
      toastService.error(error.message || 'Gagal mengekspor surat jalan paket');
    } finally {
      setExportPaketLoading(false);
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
          {!isEditMode ? (
            <>
              <button
                type='button'
                onClick={handleExportPDF}
                disabled={exportLoading || loading}
                className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                title='Print Surat Jalan'
              >
                {exportLoading ? (
                  <span className='inline-block w-4 h-4 mr-1 border-2 border-white rounded-full animate-spin border-t-transparent'></span>
                ) : (
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
                )}
                <span>Print</span>
              </button>

              <button
                type='button'
                onClick={handleExportPaket}
                disabled={exportPaketLoading || loading}
                className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                title='Print Paket (Invoice Pengiriman + Surat Jalan + Purchase Order)'
              >
                {exportPaketLoading ? (
                  <span className='inline-block w-4 h-4 mr-1 border-2 border-white rounded-full animate-spin border-t-transparent'></span>
                ) : (
                  <DocumentTextIcon className='w-5 h-5' />
                )}
                <span>Print Paket</span>
              </button>

              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
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
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              {/* Save button is inside the form, but we can trigger it via ref or just put a submit button here if we wrap form differently. 
                  Actually, for simplicity and consistency with Companies.jsx, let's keep the save button here and make it trigger the form submit.
                  However, since the form state is inside SuratJalanForm, we need a way to submit it.
                  
                  Alternative: Pass a ref to SuratJalanForm to trigger submit, OR move the state up.
                  Moving state up to SuratJalanDetailCard might be better but SuratJalanForm was created to encapsulate it.
                  
                  Let's look at Companies.jsx again.
                  In Companies.jsx, CompanyForm is used.
                  Wait, in Companies.jsx:
                  <CompanyForm ... handleSubmit={(e) => { e.preventDefault(); handleSave(); }} />
                  The state IS in CompanyDetailCard in that case!
                  
                  Ah, I made SuratJalanForm have its own state.
                  If I want the Save button in the header, I should probably move the state up or use a ref.
                  
                  Let's check SuratJalanForm again. It has its own state.
                  
                  To avoid refactoring SuratJalanForm to be controlled (which would be better but more work),
                  I will put the Save button INSIDE the form or just render the form with its own buttons?
                  
                  The user said "tombol editnya itu di card".
                  In Companies.jsx, the Save button IS in the header.
                  And CompanyDetailCard manages the state.
                  
                  I should probably have made SuratJalanForm a controlled component or just moved the state to SuratJalanDetailCard.
                  
                  But I already created SuratJalanForm with internal state.
                  
                  Let's modify SuratJalanForm to accept a ref or just use a hidden submit button and trigger it?
                  Or better, let's just render the form and let it have its own buttons at the bottom?
                  
                  Actually, looking at Companies.jsx, the buttons are in the header.
                  And the form is rendered in the body.
                  
                  If I want to follow Companies.jsx exactly, I should have lifted the state.
                  
                  However, I can also just pass `isEditMode` to the card, and when in edit mode, render the form.
                  The form can have its own "Save" button at the bottom if I want.
                  
                  But the user liked Companies.jsx.
                  In Companies.jsx, the buttons are in the header.
                  
                  Let's see if I can quickly refactor SuratJalanForm to take `formData` and `onChange` props.
                  
                  Actually, I can just use a ref to trigger the submit.
                  
                  Let's use a ref.
              */}
              <button
                form="surat-jalan-form"
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-sm text-gray-600'>Loading surat jalan details...</span>
        </div>
      ) : isEditMode ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <SuratJalanForm
            suratJalan={suratJalan}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={saving}
            // We need to attach an ID to the form so the external button can trigger it
            formId="surat-jalan-form"
          />
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
                            suratJalan.invoice?.purchaseOrder?.supplier
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
                        value: suratJalan.invoice?.purchaseOrder?.supplier?.id,
                        copyable: Boolean(
                          suratJalan.invoice?.purchaseOrder?.supplier?.id
                        ),
                      },
                      {
                        label: 'Customer ID',
                        value: suratJalan.invoice?.purchaseOrder?.customer?.id,
                        copyable: Boolean(
                          suratJalan.invoice?.purchaseOrder?.customer?.id
                        ),
                      },
                      {
                        label: 'Purchase Order ID',
                        value: suratJalan.invoice?.purchaseOrder?.id,
                        copyable: Boolean(suratJalan.invoice?.purchaseOrder?.id),
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
                  <div className='space-y-4 max-h-[600px] overflow-y-auto pr-2'>
                    {packingBoxes.map((box, boxIndex) => (
                      <div
                        key={box.id || boxIndex}
                        className='border border-gray-200 rounded-lg overflow-hidden'
                      >
                        {/* Box Header */}
                        <div
                          onClick={() => toggleDetail(box.id || boxIndex)}
                          className='px-4 py-3 bg-gray-100 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors'
                        >
                          <div className='flex justify-between items-center'>
                            <div className='flex items-center space-x-3'>
                              {expandedDetails[box.id || boxIndex] ? (
                                <ChevronDownIcon className='w-5 h-5 text-gray-600' />
                              ) : (
                                <ChevronRightIcon className='w-5 h-5 text-gray-600' />
                              )}
                              <span className='text-sm font-semibold text-gray-900'>
                                Box #{box.no_box}
                              </span>
                              <span className='text-xs text-gray-500'>
                                ({box.packingBoxItems?.length || 0} items)
                              </span>
                            </div>
                            <div className='text-xs text-gray-600'>
                              Total Qty:{' '}
                              <span className='font-medium'>
                                {box.total_quantity_in_box || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Box Items Table - Only show when expanded */}
                        {expandedDetails[box.id || boxIndex] && (
                          <div className='overflow-x-auto'>
                            {box.packingBoxItems && box.packingBoxItems.length > 0 ? (
                              <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50'>
                                  <tr>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      Nama Barang
                                    </th>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      PLU
                                    </th>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      Item ID
                                    </th>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      Quantity
                                    </th>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      Satuan
                                    </th>
                                    <th className='px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>
                                      Keterangan
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                  {box.packingBoxItems.map((item, itemIndex) => (
                                    <tr
                                      key={item.id || item.itemId || itemIndex}
                                      className='transition-colors hover:bg-gray-50'
                                    >
                                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                                        {item.nama_barang}
                                      </td>
                                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                                        {item.item?.plu || '-'}
                                      </td>
                                      <td className='px-4 py-4 text-sm text-gray-500 border-b whitespace-nowrap font-mono text-xs'>
                                        {item.itemId ? item.itemId.slice(0, 8) + '...' : '-'}
                                      </td>
                                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                                          {item.quantity}
                                        </span>
                                      </td>
                                      <td className='px-4 py-4 text-sm text-gray-900 border-b whitespace-nowrap'>
                                        {item.satuan || 'pcs'}
                                      </td>
                                      <td className='px-4 py-4 text-sm text-gray-500 border-b'>
                                        {item.keterangan || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <table className='min-w-full'>
                                <tbody>
                                  <tr>
                                    <td
                                      colSpan='6'
                                      className='px-4 py-8 text-sm text-center text-gray-500'
                                    >
                                      Tidak ada items dalam box ini
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
