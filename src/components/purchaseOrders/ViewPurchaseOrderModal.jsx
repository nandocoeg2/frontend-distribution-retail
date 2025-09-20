import React, { useState } from 'react';
import fileService from '../../services/fileService';
import HeroIcon from '../atoms/HeroIcon';
import PurchaseOrderDetailsTable from './PurchaseOrderDetailsTable';
import purchaseOrderService from '../../services/purchaseOrderService';
import {
  AccordionItem,
  InfoCard,
  StatusBadge
} from '../ui';

const ViewPurchaseOrderModal = ({ isOpen, onClose, order, loading, onProcessed }) => {
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    customerSupplier: false,
    statusInfo: false,
    documentsInfo: false,
    metaInfo: false
  });

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDownload = async (fileId, fileName) => {
    await fileService.downloadFile(fileId, fileName);
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'CREATE': '✨',
      'UPDATE': '📝',
      'DELETE': '🗑️',
      'APPROVE': '✅',
      'REJECT': '❌',
      'SUBMIT': '📤',
      'PROCESS': '⚡',
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
      'PROCESS': 'bg-orange-100',
      'DEFAULT': 'bg-gray-100'
    };
    return colorMap[action] || colorMap.DEFAULT;
  };

  const handleProcess = async () => {
    if (!order?.id) return;

    setProcessing(true);
    try {
      const result = await purchaseOrderService.processPurchaseOrder(order.id, 'PROCESSING PURCHASE ORDER');
      if (result.success) {
        alert('Purchase order processed successfully.');
        if (onProcessed) {
          onProcessed();
        }
        onClose();
      } else {
        throw new Error('Failed to process purchase order');
      }
    } catch (error) {
      console.error('Failed to process purchase order:', error);
      alert(`Failed to process purchase order: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'details', label: 'Order Details', icon: '📦' },
    { id: 'files', label: 'Attached Files', icon: '📎', badge: order?.files?.length },
    { id: 'timeline', label: 'Timeline', icon: '⏱️', badge: order?.auditTrails?.length }
  ];



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <span className="text-2xl">🛒</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Purchase Order Details</h2>
              <p className="text-sm text-gray-600">{order?.po_number || 'Loading...'}</p>
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
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : order ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <AccordionItem
                    title="Basic Information"
                    isExpanded={expandedSections.basicInfo}
                    onToggle={() => toggleSection('basicInfo')}
                    bgColor="bg-gradient-to-r from-emerald-50 to-emerald-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <InfoCard label="PO Number" value={order.po_number} variant="primary" />
                      <InfoCard label="Tanggal Masuk PO" value={formatDate(order.tanggal_masuk_po)} variant="primary" />
                      <InfoCard label="Tanggal Batas Kirim" value={formatDate(order.tanggal_batas_kirim)} variant="primary" />
                      <InfoCard label="PO Type" value={order.po_type} variant="success" />
                      <InfoCard label="Total Items" value={order.total_items} variant="warning" />
                      <InfoCard label="Termin Bayar" value={order.termin_bayar} variant="info" />
                      <InfoCard label="PO ID" value={order.id} variant="primary" copyable />
                    </div>
                  </AccordionItem>

                  {/* Customer & Supplier Information */}
                  <AccordionItem
                    title="Customer & Supplier Information"
                    isExpanded={expandedSections.customerSupplier}
                    onToggle={() => toggleSection('customerSupplier')}
                    bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <InfoCard label="Customer ID" value={order.customerId} variant="primary" copyable />
                      <InfoCard label="Customer Name" value={order.customer?.namaCustomer} variant="primary" />
                      <InfoCard label="Customer Code" value={order.customer?.kodeCustomer} variant="primary" />
                      <InfoCard label="Customer Email" value={order.customer?.email} variant="primary" />
                      <InfoCard label="Customer Phone" value={order.customer?.phoneNumber} variant="primary" />
                      <InfoCard label="Supplier ID" value={order.supplierId || 'Not assigned'} variant="success" copyable />
                      <InfoCard label="Supplier Name" value={order.supplier?.name || 'Not assigned'} variant="success" />
                    </div>
                  </AccordionItem>

                  {/* Status Information */}
                  <AccordionItem
                    title="Status Information"
                    isExpanded={expandedSections.statusInfo}
                    onToggle={() => toggleSection('statusInfo')}
                    bgColor="bg-gradient-to-r from-yellow-50 to-yellow-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                        <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                        <StatusBadge status={order.status?.status_name} />
                      </div>
                      <InfoCard label="Status Code" value={order.status?.status_code} variant="warning" />
                    </div>
                  </AccordionItem>

                  {/* Documents Information */}
                  <AccordionItem
                    title="Documents Information"
                    isExpanded={expandedSections.documentsInfo}
                    onToggle={() => toggleSection('documentsInfo')}
                    bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <InfoCard label="Surat Jalan" value={order.suratJalan} variant="default" />
                      <InfoCard label="Invoice Pengiriman" value={order.invoicePengiriman} variant="default" />
                      <InfoCard label="Surat PO" value={order.suratPO} variant="default" />
                      <InfoCard label="Surat Penagihan" value={order.suratPenagihan} variant="default" />
                    </div>
                  </AccordionItem>

                  {/* System Information */}
                  <AccordionItem
                    title="System Information"
                    isExpanded={expandedSections.metaInfo}
                    onToggle={() => toggleSection('metaInfo')}
                    bgColor="bg-gradient-to-r from-gray-50 to-gray-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <InfoCard label="Created At" value={formatDateTime(order.createdAt)} />
                      <InfoCard label="Updated At" value={formatDateTime(order.updatedAt)} />
                    </div>
                  </AccordionItem>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Purchase Order Details</h3>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <PurchaseOrderDetailsTable details={order.purchaseOrderDetails} />
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Attached Files</h3>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {order.files?.length || 0} files
                    </div>
                  </div>

                  {order.files && order.files.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                      {order.files.map((file) => (
                        <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <HeroIcon icon="PaperClipIcon" className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.filename}
                                </p>
                                <p className="text-sm text-gray-500">
                                  File ID: {file.id}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleDownload(file.id, file.filename)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📎</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Attached</h3>
                      <p className="text-gray-500">No files have been attached to this purchase order.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Activity Timeline</h3>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {order.auditTrails?.length || 0} activities
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {order.auditTrails?.length > 0 ? (
                      order.auditTrails
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
                                    {formatDateTime(trail.timestamp)}
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
                                <StatusBadge 
                                  status={trail.action} 
                                  variant={
                                    trail.action === 'CREATE' ? 'success' :
                                    trail.action === 'UPDATE' ? 'primary' :
                                    trail.action === 'DELETE' ? 'danger' :
                                    trail.action === 'PROCESS' ? 'warning' :
                                    'secondary'
                                  } 
                                />
                              </div>
                              
                              {/* Show details if available */}
                              {trail.details && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Details:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {Object.entries(trail.details)
                                      .filter(([key, value]) => !['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key))
                                      .slice(0, 6)
                                      .map(([key, value]) => (
                                        <div key={key} className="flex justify-between py-1">
                                          <span className="text-gray-600 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                          </span>
                                          <span className="text-gray-900 font-medium ml-2 truncate">
                                            {value !== null && value !== undefined ? 
                                              (() => {
                                                if (typeof value === 'object') {
                                                  // Handle nested objects
                                                  if (value.status) {
                                                    // If status is an object, return status_name or status_code
                                                    if (typeof value.status === 'object') {
                                                      return value.status.status_name || value.status.status_code || 'Status Object';
                                                    }
                                                    return value.status;
                                                  }
                                                  if (value.action) {
                                                    return value.action;
                                                  }
                                                  if (value.result) {
                                                    return typeof value.result === 'object' ? 'See details below' : value.result;
                                                  }
                                                  return JSON.stringify(value).length > 20 ? 
                                                    `${JSON.stringify(value).substring(0, 20)}...` : 
                                                    JSON.stringify(value);
                                                }
                                                if (typeof value === 'string' && value.length > 20) {
                                                  return `${value.substring(0, 20)}...`;
                                                }
                                                return String(value);
                                              })() : 
                                              'N/A'
                                            }
                                          </span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                  
                                  {/* Show result details if available */}
                                  {trail.details.result && typeof trail.details.result === 'object' && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                      <h6 className="text-sm font-medium text-gray-700 mb-2">Process Result:</h6>
                                      <div className="space-y-2 text-xs">
                                        {trail.details.result.status && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className="text-gray-900 font-medium">
                                              {trail.details.result.status.status_name || trail.details.result.status.status_code}
                                            </span>
                                          </div>
                                        )}
                                        {trail.details.result.po_number && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">PO Number:</span>
                                            <span className="text-gray-900 font-medium">{trail.details.result.po_number}</span>
                                          </div>
                                        )}
                                        {trail.details.result.customer && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="text-gray-900 font-medium">{trail.details.result.customer.namaCustomer}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
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
                        <p className="text-gray-500">No audit trail data available for this purchase order.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No details available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            {order?.status?.status_name !== 'Processed' && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
              >
                {processing ? 'Processing...' : 'Process'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseOrderModal;

