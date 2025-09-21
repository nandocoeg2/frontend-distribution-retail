import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  AccordionItem,
  InfoCard,
  StatusBadge
} from '../ui';

const ViewSuratJalanModal = ({ show, onClose, suratJalan }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    invoiceInfo: false,
    printInfo: false,
    metaInfo: false
  });
  const [expandedDetails, setExpandedDetails] = useState({});

  if (!show || !suratJalan) return null;

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleDetail = (detailId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [detailId]: !prev[detailId]
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'details', label: 'Surat Jalan Details', icon: '📦', badge: suratJalan.suratJalanDetails?.length }
  ];



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <span className="text-2xl">🚚</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Surat Jalan Details</h2>
              <p className="text-sm text-gray-600">{suratJalan.no_surat_jalan}</p>
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
              <AccordionItem
                title="Basic Information"
                isExpanded={expandedSections.basicInfo}
                onToggle={() => toggleSection('basicInfo')}
                bgColor="bg-gradient-to-r from-teal-50 to-teal-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  <InfoCard label="No Surat Jalan" value={suratJalan.no_surat_jalan} variant="primary" />
                  <InfoCard label="Deliver To" value={suratJalan.deliver_to} variant="default" />
                  <InfoCard label="PIC" value={suratJalan.PIC} variant="success" />
                  <InfoCard label="Alamat Tujuan" value={suratJalan.alamat_tujuan} variant="default" />
                  <InfoCard label="Surat Jalan ID" value={suratJalan.id} variant="primary" copyable />
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                    <StatusBadge 
                      status={suratJalan.status || 'DRAFT SURAT JALAN'}
                      variant={
                        suratJalan.status === 'DRAFT SURAT JALAN' ? 'warning' :
                        suratJalan.status === 'READY TO SHIP SURAT JALAN' ? 'info' :
                        suratJalan.status === 'SHIPPED SURAT JALAN' ? 'primary' :
                        suratJalan.status === 'DELIVERED SURAT JALAN' ? 'success' :
                        suratJalan.status === 'CANCELLED SURAT JALAN' ? 'danger' :
                        // Fallback untuk status lama
                        suratJalan.status === 'DRAFT' ? 'warning' :
                        suratJalan.status === 'READY_TO_SHIP' ? 'info' :
                        suratJalan.status === 'SHIPPED' ? 'primary' :
                        suratJalan.status === 'DELIVERED' ? 'success' :
                        suratJalan.status === 'CANCELLED' ? 'danger' :
                        'warning'
                      }
                    />
                  </div>
                </div>
              </AccordionItem>

              {/* Print Information */}
              <AccordionItem
                title="Print Information"
                isExpanded={expandedSections.printInfo}
                onToggle={() => toggleSection('printInfo')}
                bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-600 mb-1">Print Status</p>
                    <StatusBadge 
                      status={suratJalan.is_printed ? 'Printed' : 'Not Printed'} 
                      variant={suratJalan.is_printed ? 'success' : 'warning'} 
                    />
                  </div>
                  <InfoCard label="Print Counter" value={suratJalan.print_counter} variant="warning" />
                </div>
              </AccordionItem>

              {/* Invoice Information */}
              {suratJalan.invoice && (
                <AccordionItem
                  title="Invoice Information"
                  isExpanded={expandedSections.invoiceInfo}
                  onToggle={() => toggleSection('invoiceInfo')}
                  bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InfoCard label="Invoice No" value={suratJalan.invoice.no_invoice} variant="primary" />
                    <InfoCard label="Invoice Deliver To" value={suratJalan.invoice.deliver_to} variant="default" />
                  </div>
                </AccordionItem>
              )}

              {/* System Information */}
              <AccordionItem
                title="System Information"
                isExpanded={expandedSections.metaInfo}
                onToggle={() => toggleSection('metaInfo')}
                bgColor="bg-gradient-to-r from-gray-50 to-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <InfoCard label="Created At" value={formatDate(suratJalan.createdAt)} />
                  <InfoCard label="Updated At" value={formatDate(suratJalan.updatedAt)} />
                </div>
              </AccordionItem>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Surat Jalan Details</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {suratJalan.suratJalanDetails?.length || 0} details
                </div>
              </div>

              {suratJalan.suratJalanDetails && suratJalan.suratJalanDetails.length > 0 ? (
                suratJalan.suratJalanDetails.map((detail, detailIndex) => (
                  <div key={detail.id || detailIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleDetail(detail.id || detailIndex)}
                      className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span>📦</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Box #{detail.no_box}</h4>
                          <p className="text-sm text-gray-600">
                            Total Qty: {detail.total_quantity_in_box} • Boxes: {detail.total_box}
                          </p>
                        </div>
                      </div>
                      {expandedDetails[detail.id || detailIndex] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedDetails[detail.id || detailIndex] && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-6">
                          <InfoCard label="No Box" value={detail.no_box} variant="primary" />
                          <InfoCard label="Total Quantity in Box" value={detail.total_quantity_in_box} variant="success" />
                          <InfoCard label="Isi Box" value={detail.isi_box} variant="default" />
                          <InfoCard label="Sisa" value={detail.sisa} variant="warning" />
                          <InfoCard label="Total Box" value={detail.total_box} variant="info" />
                        </div>

                        {detail.items && detail.items.length > 0 && (
                          <div>
                            <h5 className="text-lg font-medium text-gray-900 mb-4">Items</h5>
                            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PLU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Box</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {detail.items.map((item, itemIndex) => (
                                    <tr key={item.id || itemIndex} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.nama_barang}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.PLU}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.quantity}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.satuan}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.total_box}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.keterangan || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Details Found</h3>
                  <p className="text-gray-500">No surat jalan details available for this record.</p>
                </div>
              )}
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
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSuratJalanModal;
