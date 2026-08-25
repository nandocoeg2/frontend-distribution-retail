import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  StatusBadge,
  InfoTable,
} from '../ui';
import ActivityTimeline from '../common/ActivityTimeline';
import { getAuditTrails } from '../../services/auditTrailService';
import { formatDate } from '../../utils/formatUtils';
import CheckingListPOTable from './CheckingListPOTable';

const resolveStatusVariant = (status) => {
  const statusText = typeof status === 'string'
    ? status
    : status?.status_name || status?.status_code || '';

  const value = statusText.toLowerCase();

  if (!value) {
    return 'secondary';
  }

  if (value.includes('completed') || value.includes('selesai') || value.includes('success')) {
    return 'success';
  }

  if (value.includes('cancelled') || value.includes('canceled') || value.includes('failed') || value.includes('batal')) {
    return 'danger';
  }

  if (value.includes('processed') && !value.includes('processing')) {
    return 'primary';
  }

  if (value.includes('processing') || value.includes('proses') || value.includes('in progress')) {
    return 'warning';
  }

  if (value.includes('pending') || value.includes('menunggu') || value.includes('waiting')) {
    return 'secondary';
  }

  return 'default';
};

const CheckingListDetailCard = ({
  checklist,
  onClose,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('po');

  useEffect(() => {
    if (checklist) {
      setActiveTab('po');
    }
  }, [checklist]);

  // Normalize audit trails
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
    <div className="bg-white shadow rounded-lg p-3 mt-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-100 rounded">
            <ClipboardDocumentCheckIcon className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Detail Checklist Surat Jalan</h2>
            <p className="text-xs text-gray-600">
              {firstSj?.no_surat_jalan ? `SJ: ${firstSj.no_surat_jalan}` : (checklist.no_checklist_surat_jalan || 'Checklist Detail')}
              {poNumber !== '-' ? ` • PO: ${poNumber}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={statusName} variant={statusVariant} size="xs" />
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Close">
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-600">Loading...</span>
        </div>
      ) : (
        <div>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant="underline" className="mb-2">
            <Tab
              id="po"
              label="Surat Jalan & No PO"
              icon={<DocumentTextIcon className="w-3 h-3" />}
              badge={suratJalanData.length || null}
            />
            <Tab
              id="overview"
              label="Informasi"
              icon={<ClipboardDocumentCheckIcon className="w-3 h-3" />}
            />
            <Tab
              id="timeline"
              label="Timeline"
              icon={<ClockIcon className="w-3 h-3" />}
              badge={normalizedAuditTrails.length || null}
            />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            {/* Tab 1: Surat Jalan & No PO */}
            <TabPanel tabId="po">
              <div className="overflow-hidden bg-white border border-gray-200 rounded">
                <CheckingListPOTable suratJalan={suratJalanData} />
              </div>
            </TabPanel>

            {/* Tab 2: Informasi */}
            <TabPanel tabId="overview">
              <div className="border border-gray-200 rounded p-2 bg-gray-50">
                <InfoTable compact data={overviewInfo} />
              </div>
            </TabPanel>

            {/* Tab 3: Timeline */}
            <TabPanel tabId="timeline">
              {normalizedAuditTrails.length > 0 ? (
                <ActivityTimeline
                  auditTrails={normalizedAuditTrails}
                  title="Activity Timeline"
                  emptyMessage="Belum ada audit trail untuk checklist ini."
                  hasMore={checklist?.hasMoreAuditTrails}
                  totalAuditTrails={checklist?.totalAuditTrails || 0}
                  tableName="ChecklistSuratJalan"
                  recordId={checklist?.id}
                  onLoadMore={getAuditTrails}
                />
              ) : (
                <div className="py-4 text-center text-xs text-gray-500">
                  Belum ada aktivitas.
                </div>
              )}
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div>
  );
};

export default CheckingListDetailCard;
