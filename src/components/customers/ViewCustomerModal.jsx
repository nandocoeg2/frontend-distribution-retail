import React, { useState } from 'react';
import {
  AccordionItem,
  InfoCard
} from '../ui';

const ViewCustomerModal = ({ show, onClose, customer }) => {
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    contactInfo: false,
    metaInfo: false
  });

  if (!show || !customer) {
    return null;
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <p className="text-sm text-gray-600">{customer.name}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <AccordionItem
              title="Basic Information"
              isExpanded={expandedSections.basicInfo}
              onToggle={() => toggleSection('basicInfo')}
              bgColor="bg-gradient-to-r from-green-50 to-green-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InfoCard label="Customer Name" value={customer.name} variant="success" />
                <InfoCard label="Customer ID" value={customer.id} variant="primary" copyable />
                <InfoCard label="Description" value={customer.description} variant="default" />
              </div>
            </AccordionItem>

            {/* Contact Information */}
            <AccordionItem
              title="Contact Information"
              isExpanded={expandedSections.contactInfo}
              onToggle={() => toggleSection('contactInfo')}
              bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InfoCard label="Email" value={customer.email} variant="primary" />
                <InfoCard label="Phone Number" value={customer.phoneNumber} variant="primary" />
                <InfoCard label="Address" value={customer.address} variant="default" />
              </div>
            </AccordionItem>

            {/* System Information */}
            <AccordionItem
              title="System Information"
              isExpanded={expandedSections.metaInfo}
              onToggle={() => toggleSection('metaInfo')}
              bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InfoCard label="Created At" value={formatDate(customer.createdAt)} />
                <InfoCard label="Updated At" value={formatDate(customer.updatedAt)} />
              </div>
            </AccordionItem>
          </div>
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

export default ViewCustomerModal;

