import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  ShoppingCartIcon,
  ClockIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { TabContainer, Tab, TabContent, TabPanel } from '../ui/Tabs';
import ActivityTimeline from '../common/ActivityTimeline';
import checkingListService from '../../services/checkingListService';
import { getAuditTrails } from '../../services/auditTrailService';
import toastService from '../../services/toastService';
import CheckingListForm from './CheckingListForm';
import CheckingListPOTable from './CheckingListPOTable';

const CheckingListDetailCard = ({
  checklist,
  onClose,
  isLoading = false,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('po');
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const response = await checkingListService.updateChecklist(checklist.id, formData);
      const updatedData = response?.data || response;
      toastService.success('Checklist berhasil diperbarui');
      if (onUpdate) {
        await onUpdate(updatedData);
      }
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update checklist:', error);
      toastService.error(error.message || 'Gagal memperbarui checklist');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: 'po',
      label: 'PO',
      icon: <ShoppingCartIcon className='w-5 h-5' aria-hidden='true' />,
      badge: suratJalanData.length || null,
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
          {!isEditMode ? (
            <>
              <button
                type='button'
                onClick={handleEditClick}
                className='flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-yellow-600 rounded-lg hover:bg-yellow-700'
              >
                <PencilIcon className='w-5 h-5' />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className='p-2 transition-colors rounded-lg hover:bg-gray-100'
                title='Close'
              >
                <XMarkIcon className='w-6 h-6 text-gray-500' />
              </button>
            </>
          ) : (
            <>
              <button
                type='button'
                onClick={handleCancelEdit}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50'
                disabled={saving}
              >
                Batal
              </button>
              <button
                type='submit'
                form='checking-list-form'
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50'
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      {!isEditMode && (
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
      )}

      {/* Content */}
      {isLoading ? (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-sm text-gray-600'>Loading checklist details...</span>
        </div>
      ) : isEditMode ? (
        <div className='p-6'>
          <CheckingListForm
            initialValues={checklist}
            onSubmit={handleSave}
            onCancel={handleCancelEdit}
            isSubmitting={saving}
            formId='checking-list-form'
          />
        </div>
      ) : (
        <div className='p-6'>
          <TabContent activeTab={activeTab}>
            {/* PO Tab */}
            <TabPanel tabId='po'>
              <div className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
                <CheckingListPOTable suratJalan={suratJalanData} />
              </div>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel tabId='activity'>
              <ActivityTimeline
                auditTrails={normalizedAuditTrails}
                title='Activity Timeline'
                emptyMessage='Belum ada audit trail untuk checklist ini.'
                hasMore={checklist?.hasMoreAuditTrails}
                totalAuditTrails={checklist?.totalAuditTrails || 0}
                tableName='ChecklistSuratJalan'
                recordId={checklist?.id}
                onLoadMore={getAuditTrails}
              />
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default CheckingListDetailCard;
