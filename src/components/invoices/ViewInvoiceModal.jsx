import React, { useState } from 'react';
import {
  TabContainer,
  Tab,
  TabContent,
  TabPanel,
  AccordionItem,
  InfoCard,
  InfoTable
} from '../ui';

const ViewInvoiceModal = ({ show, onClose, invoice }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false
  });

  if (!show || !invoice) return null;

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'details', label: 'Invoice Details', icon: '📊', badge: invoice.invoiceDetails?.length }
  ];



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-2xl">🧻</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-600">{invoice.no_invoice}</p>
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
                bgColor="bg-gradient-to-r from-indigo-50 to-indigo-100"
              >
                <InfoTable 
                  data={[
                    { label: 'Invoice Number', value: invoice.no_invoice },
                    { label: 'Date', value: formatDate(invoice.tanggal) },
                    { label: 'Deliver To', value: invoice.deliver_to },
                    { label: 'Type', value: invoice.type },
                    { label: 'TOP', value: invoice.TOP },
                    { label: 'Invoice ID', value: invoice.id, copyable: true }
                  ]}
                />
              </AccordionItem>

              {/* Pricing Information */}
              <AccordionItem
                title="Pricing & Financial Details"
                isExpanded={expandedSections.pricingInfo}
                onToggle={() => toggleSection('pricingInfo')}
                bgColor="bg-gradient-to-r from-green-50 to-green-100"
              >
                <InfoTable 
                  data={[
                    { label: 'Sub Total', value: formatCurrency(invoice.sub_total) },
                    { label: 'Total Discount', value: formatCurrency(invoice.total_discount) },
                    { label: 'Total Price', value: formatCurrency(invoice.total_price) },
                    { label: 'PPN Percentage', value: `${invoice.ppn_percentage}%` },
                    { label: 'PPN Rupiah', value: formatCurrency(invoice.ppn_rupiah) },
                    { label: 'Grand Total', value: formatCurrency(invoice.grand_total) }
                  ]}
                />
              </AccordionItem>

              {/* System Information */}
              <AccordionItem
                title="System Information"
                isExpanded={expandedSections.metaInfo}
                onToggle={() => toggleSection('metaInfo')}
                bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
              >
                <InfoTable 
                  data={[
                    { label: 'Created At', value: formatDateTime(invoice.createdAt) },
                    { label: 'Updated At', value: formatDateTime(invoice.updatedAt) }
                  ]}
                />
              </AccordionItem>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Invoice Details</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {invoice.invoiceDetails?.length || 0} items
                </div>
              </div>
              
              {invoice.invoiceDetails && invoice.invoiceDetails.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PLU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoice.invoiceDetails.map((detail, index) => (
                        <tr key={detail.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {detail.nama_barang}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.PLU}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.satuan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(detail.harga)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(detail.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoice Details</h3>
                  <p className="text-gray-500">No detailed items found for this invoice.</p>
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

export default ViewInvoiceModal;
