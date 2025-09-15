import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

  const getStatusBadgeColor = (statusCode) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'DEFAULT': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    for (const [key, value] of Object.entries(colorMap)) {
      if (statusCode?.includes(key)) return value;
    }
    return colorMap.DEFAULT;
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'CREATE': '✨',
      'UPDATE': '📝',
      'DELETE': '🗑️',
      'APPROVE': '✅',
      'REJECT': '❌',
      'SUBMIT': '📤',
      'DEFAULT': '🔄'
    };
    return iconMap[action] || iconMap.DEFAULT;
  };

  const getActionColor = (action) => {
    const colorMap = {
      'CREATE': 'bg-green-100',
      'UPDATE': 'bg-blue-100',
      'DELETE': 'bg-red-100',
      'APPROVE': 'bg-emerald-100',
      'REJECT': 'bg-red-100',
      'SUBMIT': 'bg-purple-100',
      'DEFAULT': 'bg-gray-100'
    };
    return colorMap[action] || colorMap.DEFAULT;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'items', label: 'Packing Items', icon: '📦', badge: packing.packingItems?.length },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' }
  ];

  const AccordionSection = ({ title, isExpanded, onToggle, children, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-lg border border-gray-200 mb-4 overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {isExpanded ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  const InfoCard = ({ label, value, variant = "default", copyable = false }) => {
    const variants = {
      default: "bg-gray-50 border-gray-200",
      primary: "bg-blue-50 border-blue-200",
      success: "bg-green-50 border-green-200",
      warning: "bg-yellow-50 border-yellow-200",
      danger: "bg-red-50 border-red-200"
    };

    return (
      <div className={`p-4 rounded-lg border ${variants[variant]}`}>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className={`text-lg ${copyable ? 'font-mono' : 'font-semibold'} text-gray-900 break-all`}>
          {value || 'N/A'}
        </p>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    if (!status) return <span className="text-gray-400">No Status</span>;
    
    return (
      <div className="flex flex-col space-y-1">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          getStatusBadgeColor(status.status_code)
        }`}>
          {status.status_name}
        </span>
        <span className="text-xs text-gray-500">({status.status_code})</span>
      </div>
    );
  };

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
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs font-semibold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <AccordionSection
                title="Basic Information"
                isExpanded={expandedSections.basicInfo}
                onToggle={() => toggleSection('basicInfo')}
                bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <InfoCard label="Packing Number" value={packing.packing_number} variant="primary" />
                  <InfoCard label="Tanggal Packing" value={formatDate(packing.tanggal_packing)} variant="primary" />
                  <InfoCard label="Status" value={<StatusBadge status={packing.status} />} variant="primary" />
                  <InfoCard label="Created At" value={formatDate(packing.createdAt)} />
                  <InfoCard label="Updated At" value={formatDate(packing.updatedAt)} />
                  <InfoCard label="Total Items" value={packing.packingItems?.length || 0} variant="success" />
                </div>
              </AccordionSection>

              {/* Purchase Order Information */}
              {packing.purchaseOrder && (
                <AccordionSection
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
                </AccordionSection>
              )}

              {/* Status Information */}
              {packing.status && (
                <AccordionSection
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
                </AccordionSection>
              )}

              {/* Metadata */}
              <AccordionSection
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
              </AccordionSection>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Packing Items</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {packing.packingItems?.length || 0} items
                </div>
              </div>
              
              {packing.packingItems?.map((item, index) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleItemExpansion(item.id)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span>📦</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{item.nama_barang}</h4>
                        <p className="text-sm text-gray-600">Qty: {item.total_qty} • Cartons: {item.jumlah_carton}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={item.status} />
                      {expandedItems[item.id] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {expandedItems[item.id] && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <InfoCard label="Isi per Carton" value={item.isi_per_carton} />
                        <InfoCard label="No Box" value={item.no_box || 'Not assigned'} />
                        <InfoCard label="Inventory ID" value={item.inventoryId} copyable />
                        <InfoCard label="Item Created" value={formatDate(item.createdAt)} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Activity Timeline</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {packing.auditTrails?.length || 0} activities
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {packing.auditTrails?.length > 0 ? (
                  packing.auditTrails
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((trail, index) => (
                      <div key={trail.id} className="relative flex items-start mb-6">
                        <div className={`flex-shrink-0 w-8 h-8 ${getActionColor(trail.action)} rounded-full flex items-center justify-center border-2 border-white shadow-sm`}>
                          <span className="text-sm">{getActionIcon(trail.action)}</span>
                        </div>
                        <div className="ml-4 bg-white p-4 rounded-lg border border-gray-200 flex-1 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {trail.action.toLowerCase().replace('_', ' ')} {trail.tableName}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(trail.timestamp)}
                              </p>
                              {trail.user && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-semibold">
                                      {trail.user.firstName?.charAt(0) || trail.user.username?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-700">
                                    {trail.user.firstName && trail.user.lastName 
                                      ? `${trail.user.firstName} ${trail.user.lastName}`
                                      : trail.user.username
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">({trail.user.username})</span>
                                </div>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              trail.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                              trail.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                              trail.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trail.action}
                            </span>
                          </div>
                          
                          {/* Show details if available */}
                          {trail.details && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Details:</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {Object.entries(trail.details)
                                  .filter(([key, value]) => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key))
                                  .slice(0, 6) // Limit to first 6 fields to avoid overwhelming
                                  .map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-1">
                                      <span className="text-gray-600 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                      </span>
                                      <span className="text-gray-900 font-medium ml-2 truncate">
                                        {value !== null && value !== undefined ? 
                                          (typeof value === 'string' && value.length > 20 ? 
                                            `${value.substring(0, 20)}...` : 
                                            String(value)
                                          ) : 
                                          'N/A'
                                        }
                                      </span>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
                    <p className="text-gray-500">No audit trail data available for this packing record.</p>
                  </div>
                )}
              </div>
            </div>
          )}
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

