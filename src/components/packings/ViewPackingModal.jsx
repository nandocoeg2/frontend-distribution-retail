import React, { useState } from 'react';
import ActivityTimeline from '../common/ActivityTimeline';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  AccordionItem,
  InfoCard,
  StatusBadge
} from '../ui';

const ViewPackingModal = ({ packing, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    poInfo: false,
    statusInfo: false,
    metaInfo: false
  });

  if (!packing) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',  
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const getStatusVariant = (statusCode) => {
    if (!statusCode) return 'default';
    const status = statusCode.toUpperCase();
    if (status.includes('PENDING')) return 'warning';
    if (status.includes('COMPLETED')) return 'success';
    if (status.includes('IN_PROGRESS')) return 'primary';
    if (status.includes('CANCELLED')) return 'danger';
    return 'default';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'items', label: 'Packing Items', icon: '📦', badge: packing.packingItems?.length },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Packing Details</h2>
              <p className="text-sm text-gray-600">{packing.packing_number}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Navigation */}
        <TabContainer 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          variant="default"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              badge={tab.badge}
            />
          ))}
        </TabContainer>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <TabContent activeTab={activeTab}>
            <TabPanel tabId="overview">
              <div className="space-y-6">
                {/* Basic Information */}
                <AccordionItem
                  title="Basic Information"
                  isExpanded={expandedSections.basicInfo}
                  onToggle={() => toggleSection('basicInfo')}
                  bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <InfoCard label="Packing Number" value={packing.packing_number} variant="primary" />
                    <InfoCard label="Tanggal Packing" value={formatDate(packing.tanggal_packing)} variant="primary" />
                    <InfoCard 
                      label="Status" 
                      value={<StatusBadge status={packing.status?.status_name} variant={getStatusVariant(packing.status?.status_code)} />} 
                      variant="primary" 
                    />
                    <InfoCard label="Created At" value={formatDate(packing.createdAt)} />
                    <InfoCard label="Updated At" value={formatDate(packing.updatedAt)} />
                    <InfoCard label="Total Items" value={packing.packingItems?.length || 0} variant="success" />
                  </div>
                </AccordionItem>

                {/* Purchase Order Information */}
                {packing.purchaseOrder && (
                  <AccordionItem
                    title="Purchase Order Information"
                    isExpanded={expandedSections.poInfo}
                    onToggle={() => toggleSection('poInfo')}
                    bgColor="bg-gradient-to-r from-green-50 to-green-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <InfoCard label="PO Number" value={packing.purchaseOrder.po_number} variant="success" />
                      <InfoCard label="Order Date" value={formatDateOnly(packing.purchaseOrder.tanggal_order)} variant="success" />
                      <InfoCard label="PO Type" value={packing.purchaseOrder.po_type} variant="success" />
                      <InfoCard label="Total Items" value={packing.purchaseOrder.total_items} />
                      <InfoCard label="Customer ID" value={packing.purchaseOrder.customerId} copyable />
                      <InfoCard label="Supplier ID" value={packing.purchaseOrder.supplierId || 'Not assigned'} copyable />
                    </div>
                  </AccordionItem>
                )}

                {/* Status Information */}
                {packing.status && (
                  <AccordionItem
                    title="Status Details"
                    isExpanded={expandedSections.statusInfo}
                    onToggle={() => toggleSection('statusInfo')}
                    bgColor="bg-gradient-to-r from-yellow-50 to-yellow-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <InfoCard label="Status Code" value={packing.status.status_code} variant="warning" />
                      <InfoCard label="Status Name" value={packing.status.status_name} variant="warning" />
                      <InfoCard label="Description" value={packing.status.status_description} variant="warning" />
                    </div>
                  </AccordionItem>
                )}

                {/* Metadata */}
                <AccordionItem
                  title="System Information"
                  isExpanded={expandedSections.metaInfo}
                  onToggle={() => toggleSection('metaInfo')}
                  bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <InfoCard label="Packing ID" value={packing.id} copyable />
                    <InfoCard label="Purchase Order ID" value={packing.purchaseOrderId} copyable />
                    <InfoCard label="Updated By" value={packing.updatedBy} copyable />
                  </div>
                </AccordionItem>
              </div>
            </TabPanel>

            <TabPanel tabId="items">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Packing Items</h3>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {packing.packingItems?.length || 0} items
                  </div>
                </div>
                
                {packing.packingItems?.map((item, index) => (
                  <AccordionItem
                    key={item.id}
                    title={item.nama_barang}
                    isExpanded={expandedItems[item.id]}
                    onToggle={() => toggleItemExpansion(item.id)}
                    icon="📦"
                    badge={<StatusBadge status={item.status?.status_name} variant={getStatusVariant(item.status?.status_code)} />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <InfoCard label="Total Qty" value={item.total_qty} variant="primary" />
                      <InfoCard label="Jumlah Carton" value={item.jumlah_carton} variant="success" />
                      <InfoCard label="Isi per Carton" value={item.isi_per_carton} />
                      <InfoCard label="No Box" value={item.no_box || 'Not assigned'} />
                      <InfoCard label="Inventory ID" value={item.inventoryId} copyable />
                      <InfoCard label="Item Created" value={formatDate(item.createdAt)} />
                    </div>
                  </AccordionItem>
                ))}
              </div>
            </TabPanel>

            <TabPanel tabId="timeline">
              <ActivityTimeline 
                auditTrails={packing.auditTrails}
                title="Activity Timeline"
                emptyMessage="No audit trail data available for this packing record."
                formatDate={formatDate}
              />
            </TabPanel>
          </TabContent>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPackingModal;