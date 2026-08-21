import React, { useState } from 'react';
import {
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
import PackingGroupedItemsTable from '../packings/PackingGroupedItemsTable';
import { AccordionItem, StatusBadge, InfoTable, TabContainer, Tab, TabContent, TabPanel } from '../ui';
import { formatDateTime, formatDate } from '../../utils/formatUtils';
import ActivityTimeline from '../common/ActivityTimeline';
import suratJalanService from '../../services/suratJalanService';
import toastService from '../../services/toastService';
import { getPackingBoxes, getTotals } from '../../utils/suratJalanHelpers';
import SuratJalanForm from './SuratJalanForm';

const SuratJalanDetailCard = ({ suratJalan, onClose, loading = false, onUpdate }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    invoiceInfo: false,
    printInfo: false,
    metaInfo: false,
    historyInfo: false,
  });

  if (!suratJalan) return null;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
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

      const submitData = {
        no_surat_jalan: formData.no_surat_jalan,
        deliver_to: formData.deliver_to,
        PIC: formData.PIC,
        alamat_tujuan: formData.alamat_tujuan,
        invoiceId: formData.invoiceId || null,
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

  const packingBoxes = getPackingBoxes(suratJalan);
  const { totalBoxes, totalQuantity } = getTotals(suratJalan);

  return (
    <div className='bg-white shadow rounded-lg p-3 mt-3'>
      <div className='flex justify-between items-center mb-2'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 bg-teal-100 rounded'>
            <TruckIcon className='w-4 h-4 text-teal-600' />
          </div>
          <div>
            <h2 className='text-sm font-bold text-gray-900'>Surat Jalan</h2>
            <p className='text-xs text-gray-600'>{suratJalan.no_surat_jalan}</p>
          </div>
        </div>
        <div className='flex items-center gap-1'>
          {!isEditMode ? (
            <>
              <button onClick={handleEditClick} className='inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50'>
                <PencilIcon className='w-3 h-3 mr-1' />Edit
              </button>
              {onClose && (
                <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded' title='Close'>
                  <XMarkIcon className='w-4 h-4 text-gray-500' />
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} disabled={saving} className='px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50'>Cancel</button>
              <button form='surat-jalan-form' type='submit' disabled={saving} className='inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50'>
                <CheckIcon className='w-3 h-3 mr-1' />{saving ? '...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-4'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <span className='ml-2 text-xs text-gray-600'>Loading...</span>
        </div>
      ) : isEditMode ? (
        <div className='bg-gray-50 rounded p-3'>
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
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant='underline' className='mb-2'>
            <Tab id='overview' label='Overview' icon={<DocumentTextIcon className='w-3 h-3' />} />
            <Tab id='details' label='Boxes' icon={<ListBulletIcon className='w-3 h-3' />} badge={packingBoxes.length} />
            <Tab id='checklist' label='Checklist' icon={<ClipboardDocumentCheckIcon className='w-3 h-3' />} badge={normalizedChecklist.length || null} />
            <Tab id='activity' label='Activity' icon={<ClockIcon className='w-3 h-3' />} badge={normalizedAuditTrails.length || null} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            <TabPanel tabId='overview'>
              <div className='space-y-2'>
                <AccordionItem title='Basic Info' isExpanded={expandedSections.basicInfo} onToggle={() => toggleSection('basicInfo')} bgColor='bg-teal-50' compact>
                  <InfoTable compact data={[
                    { label: 'No. SJ', value: suratJalan.no_surat_jalan },
                    { label: 'Deliver To', value: suratJalan.deliver_to },
                    { label: 'PIC', value: suratJalan.PIC },
                    { label: 'Alamat', value: suratJalan.alamat_tujuan },
                    { label: 'Status', component: <StatusBadge status={statusDisplay} variant={statusVariant} size='xs' dot /> },
                  ]} />
                </AccordionItem>

                <AccordionItem title='Print Info' isExpanded={expandedSections.printInfo} onToggle={() => toggleSection('printInfo')} bgColor='bg-purple-50' compact>
                  <InfoTable compact data={[
                    { label: 'Print', component: <StatusBadge status={suratJalan.is_printed ? 'Printed' : 'Not Printed'} variant={suratJalan.is_printed ? 'success' : 'secondary'} size='xs' dot /> },
                    { label: 'Counter', value: suratJalan.print_counter },
                  ]} />
                </AccordionItem>

                {suratJalan.invoice && (
                  <AccordionItem title='Invoice' isExpanded={expandedSections.invoiceInfo} onToggle={() => toggleSection('invoiceInfo')} bgColor='bg-blue-50' compact>
                    <InfoTable compact data={[
                      { label: 'No. Invoice', value: suratJalan.invoice.no_invoice },
                      { label: 'PO#', value: suratJalan.purchaseOrder?.po_number },
                      { label: 'Customer', value: suratJalan.purchaseOrder?.customer?.namaCustomer },
                    ]} />
                  </AccordionItem>
                )}

                <AccordionItem title='System Info' isExpanded={expandedSections.metaInfo} onToggle={() => toggleSection('metaInfo')} bgColor='bg-gray-50' compact>
                  <InfoTable compact data={[
                    { label: 'Created', value: formatDateTime(suratJalan.createdAt) },
                    { label: 'Updated', value: formatDateTime(suratJalan.updatedAt) },
                    { label: 'SJ ID', value: suratJalan.id, copyable: true },
                  ]} />
                </AccordionItem>

                {historyData.length > 0 && (
                  <AccordionItem title='History' isExpanded={expandedSections.historyInfo} onToggle={() => toggleSection('historyInfo')} bgColor='bg-amber-50' compact>
                    <div className='space-y-1'>
                      {historyData.map((h, i) => (
                        <div key={h.id || i} className='flex justify-between items-center p-2 bg-white border rounded text-xs'>
                          <StatusBadge status={h.status?.status_name || 'Unknown'} variant={resolveStatusVariant(h.status?.status_name)} size='xs' dot />
                          <span className='text-gray-500'>{formatDateTime(h.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                )}
              </div>
            </TabPanel>

            <TabPanel tabId='details'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-medium text-gray-700'>Box Details</span>
                <span className='px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full'>{packingBoxes.length} boxes • {totalQuantity || 0} qty</span>
              </div>
              <PackingGroupedItemsTable packingBoxes={packingBoxes} />
            </TabPanel>

            <TabPanel tabId='checklist'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-medium text-gray-700'>Checklist</span>
                <span className='px-2 py-0.5 text-xs font-medium text-teal-800 bg-teal-100 rounded-full'>{normalizedChecklist.length}</span>
              </div>
              {normalizedChecklist.length > 0 ? (
                <div className='space-y-2'>
                  {normalizedChecklist.map((checklist, i) => (
                    <div key={checklist.id || i} className='border border-gray-200 rounded p-2'>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-xs font-semibold'>#{i + 1}</span>
                        <span className='text-xs text-gray-500'>{formatDateTime(checklist.tanggal)}</span>
                      </div>
                      <InfoTable compact data={[
                        { label: 'Checker', value: checklist.checker },
                        { label: 'Ekspedisi', value: checklist.ekspedisi },
                        { label: 'Mobil', value: checklist.mobil },
                        { label: 'Kota', value: checklist.kota },
                      ]} />
                    </div>
                  ))}
                </div>
              ) : <div className='py-4 text-center text-xs text-gray-500'>Belum ada checklist</div>}
            </TabPanel>

            <TabPanel tabId='activity'>
              <ActivityTimeline auditTrails={normalizedAuditTrails} title='Timeline' emptyMessage='Belum ada audit trail.' formatDate={formatDate} />
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default SuratJalanDetailCard;
