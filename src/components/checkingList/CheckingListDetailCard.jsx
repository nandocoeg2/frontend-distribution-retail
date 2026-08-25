import React, { useState, useMemo, useEffect } from 'react';
import {
  XMarkIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ClockIcon,
  PlusIcon,
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
import checkingListService from '../../services/checkingListService';
import toastService from '../../services/toastService';
import { formatDate } from '../../utils/formatUtils';
import CheckingListPOTable from './CheckingListPOTable';
import AddSuratJalanToChecklistModal from './AddSuratJalanToChecklistModal';

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
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState('po');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

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

  const firstSj = suratJalanData[0];
  const poNumber = firstSj?.purchaseOrder?.po_number || firstSj?.po_number || '-';

  const statusName = checklist?.status?.status_name || checklist?.status?.status_code || '-';
  const statusVariant = resolveStatusVariant(statusName);

  const handleAddSuratJalans = async (selectedSjs) => {
    if (!selectedSjs || selectedSjs.length === 0) return;
    setIsAdding(true);
    try {
      const currentSjIds = suratJalanData.map((sj) => sj.id);
      const newSjIds = selectedSjs.map((sj) => sj.id);
      const combinedIds = Array.from(new Set([...currentSjIds, ...newSjIds]));

      const response = await checkingListService.assignSuratJalan(checklist.id, combinedIds);
      const updatedData = response?.data || response;
      toastService.success(`${selectedSjs.length} Surat Jalan / Faktur berhasil ditambahkan`);

      if (onUpdate) {
        await onUpdate(updatedData);
      }
    } catch (err) {
      console.error('Failed to add surat jalan to checklist:', err);
      toastService.error(
        err?.response?.data?.message || err.message || 'Gagal menambahkan Surat Jalan / Faktur'
      );
    } finally {
      setIsAdding(false);
    }
  };
  const overviewInfo = [
    { label: 'No Checklist', value: checklist.no_checklist_surat_jalan || checklist.id || '-', copyable: true },
    { label: 'Tanggal', value: formatDate(checklist.tanggal) },
    { label: 'Checker', value: checklist.checker || '-' },
    { label: 'Ekspedisi', value: checklist.ekspedisi || '-' },
    { label: 'Nomor Kendaraan', value: checklist.mobil || '-' },
    { label: 'Kota Tujuan', value: checklist.kota || '-' },
    {
      label: 'Status',
      component: <StatusBadge status={statusName} variant={statusVariant} size="xs" dot />,
    },
    { label: 'Total Surat Jalan', value: `${suratJalanData.length} Dokumen` },
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
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Daftar Dokumen ({suratJalanData.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    disabled={isAdding}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Tambah Faktur / Surat Jalan</span>
                  </button>
                </div>
                <div className="overflow-hidden bg-white border border-gray-200 rounded">
                  <CheckingListPOTable suratJalan={suratJalanData} />
                </div>
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

      {/* Modal to pick and add draft Surat Jalan / Faktur */}
      <AddSuratJalanToChecklistModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSuratJalans}
        existingSuratJalanIds={suratJalanData.map((sj) => sj.id)}
        companyId={checklist?.companyId || checklist?.suratJalan?.[0]?.companyId}
      />
    </div>
  );
};

export default CheckingListDetailCard;
