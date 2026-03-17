import PackingGroupedItemsTable from './PackingGroupedItemsTable';
import React, { useState } from 'react';
import {
  ArchiveBoxIcon,
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ActivityTimeline from '../common/ActivityTimeline';
import { formatDate } from '../../utils/formatUtils';
import { getAuditTrails } from '../../services/auditTrailService';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  AccordionItem,
  StatusBadge,
  InfoTable,
} from '../ui';

const PackingDetailCard = ({ packing, onClose, loading = false }) => {
  const [activeTab, setActiveTab] = useState('boxes');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    poInfo: false,
    statusInfo: false,
    metaInfo: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const resolveStatusVariant = (status) => {
    const value = typeof status === 'string' ? status.toLowerCase() : '';

    if (!value) {
      return 'secondary';
    }

    if (value.includes('completed') || value.includes('complete')) {
      return 'success';
    }

    if (
      value.includes('cancelled') ||
      value.includes('failed') ||
      value.includes('error')
    ) {
      return 'danger';
    }

    if (value.includes('processed') && !value.includes('processing')) {
      return 'primary';
    }

    if (
      value.includes('processing') ||
      value.includes('in_progress') ||
      value.includes('in progress')
    ) {
      return 'warning';
    }

    if (value.includes('pending') || value.includes('draft')) {
      return 'secondary';
    }

    return 'default';
  };

  if (!packing) return null;

  return (
    <div className="bg-white shadow rounded-lg p-3 mt-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded">
            <ArchiveBoxIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Packing Details</h2>
            <p className="text-xs text-gray-600">{packing.purchaseOrder.po_number || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" title="Close">
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-600">Loading...</span>
        </div>
      ) : (
        <div>
          <TabContainer activeTab={activeTab} onTabChange={setActiveTab} variant="underline" className="mb-2">
            <Tab id="overview" label="Overview" icon={<DocumentTextIcon className="w-3 h-3" />} />
            <Tab id="boxes" label="Boxes" icon={<ArchiveBoxIcon className="w-3 h-3" />} badge={packing.packingBoxes?.length || 0} />
            <Tab id="timeline" label="Timeline" icon={<ClockIcon className="w-3 h-3" />} badge={packing.auditTrails?.length || 0} />
          </TabContainer>

          <TabContent activeTab={activeTab}>
            <TabPanel tabId="overview">
              <div className="space-y-2">
                <AccordionItem title="Basic Info" isExpanded={expandedSections.basicInfo} onToggle={() => toggleSection('basicInfo')} bgColor="bg-blue-50" compact>
                  <InfoTable compact data={[
                    { label: 'Packing#', value: packing.packing_number || 'N/A' },
                    { label: 'Tanggal', value: formatDate(packing.tanggal_packing) },
                    { label: 'Status', component: packing.status?.status_name ? <StatusBadge status={packing.status.status_name} variant={resolveStatusVariant(packing.status?.status_name)} size="xs" dot /> : <span className="text-gray-500 text-xs">-</span> },
                    { label: 'Boxes', value: packing.packingBoxes?.length || 0 },
                    { label: 'Items', value: packing.packingBoxes?.reduce((s, b) => s + (b.packingBoxItems?.length || 0), 0) || 0 },
                  ]} />
                </AccordionItem>

                {packing.purchaseOrder && (
                  <AccordionItem title="PO Info" isExpanded={expandedSections.poInfo} onToggle={() => toggleSection('poInfo')} bgColor="bg-green-50" compact>
                    <InfoTable compact data={[
                      { label: 'PO#', value: packing.purchaseOrder.po_number, copyable: true },
                      { label: 'Tgl Masuk', value: formatDate(packing.purchaseOrder.tanggal_masuk_po) },
                      { label: 'Batas Kirim', value: formatDate(packing.purchaseOrder.tanggal_batas_kirim) },
                      { label: 'Customer', value: packing.purchaseOrder.customer?.namaCustomer || '-' },
                    ]} />
                  </AccordionItem>
                )}

                {packing.status && (
                  <AccordionItem title="Status" isExpanded={expandedSections.statusInfo} onToggle={() => toggleSection('statusInfo')} bgColor="bg-yellow-50" compact>
                    <InfoTable compact data={[
                      { label: 'Code', component: <StatusBadge status={packing.status.status_code} variant={resolveStatusVariant(packing.status?.status_name)} size="xs" dot /> },
                      { label: 'Name', value: packing.status.status_name },
                    ]} />
                  </AccordionItem>
                )}

                <AccordionItem title="System Info" isExpanded={expandedSections.metaInfo} onToggle={() => toggleSection('metaInfo')} bgColor="bg-purple-50" compact>
                  <InfoTable compact data={[
                    { label: 'ID', value: packing.id, copyable: true },
                    { label: 'PO ID', value: packing.purchaseOrderId, copyable: true },
                  ]} />
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId="boxes">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Packing Boxes</span>
                <span className="px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">{packing.packingBoxes?.length || 0} boxes</span>
              </div>
              <PackingGroupedItemsTable packingBoxes={packing.packingBoxes} />
            </TabPanel>

            <TabPanel tabId="timeline">
              <ActivityTimeline
                auditTrails={packing.auditTrails}
                title="Timeline"
                emptyMessage="No audit trail."
                formatDate={formatDate}
                hasMore={packing?.hasMoreAuditTrails}
                totalAuditTrails={packing?.totalAuditTrails || 0}
                tableName='Packing'
                recordId={packing?.id}
                onLoadMore={getAuditTrails}
              />
            </TabPanel>
          </TabContent>
        </div>
      )}
    </div >
  );
};

export default PackingDetailCard;
