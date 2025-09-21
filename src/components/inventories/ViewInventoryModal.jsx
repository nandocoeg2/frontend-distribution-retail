import React, { useState } from 'react';
import {
  AccordionItem,
  InfoCard,
  StatusBadge,
  InfoTable
} from '../ui';

const ViewInventoryModal = ({ show, inventory, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    stockInfo: false,
    pricingInfo: false,
    metaInfo: false
  });

  if (!show || !inventory) {
    return null;
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

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

  const getStockStatus = (currentStock, minStock) => {
    if (currentStock <= minStock) {
      return { status: 'Low Stock', variant: 'danger' };
    } else if (currentStock <= minStock * 1.5) {
      return { status: 'Warning', variant: 'warning' };
    }
    return { status: 'In Stock', variant: 'success' };
  };

  const totalStock = (inventory.stok_c || 0) + (inventory.stok_q || 0);
  const stockStatus = getStockStatus(totalStock, inventory.min_stok);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inventory Details</h2>
              <p className="text-sm text-gray-600">{inventory.nama_barang}</p>
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
              bgColor="bg-gradient-to-r from-orange-50 to-orange-100"
            >
              <InfoTable 
                data={[
                  { label: 'PLU', value: inventory.plu, copyable: true },
                  { label: 'Nama Barang', value: inventory.nama_barang },
                  { label: 'Inventory ID', value: inventory.id, copyable: true }
                ]}
              />
            </AccordionItem>

            {/* Stock Information */}
            <AccordionItem
              title="Stock Information"
              isExpanded={expandedSections.stockInfo}
              onToggle={() => toggleSection('stockInfo')}
              bgColor="bg-gradient-to-r from-blue-50 to-blue-100"
            >
              <InfoTable 
                data={[
                  { label: 'Stok Karton', value: `${inventory.stok_c} karton` },
                  { label: 'Stok Pcs', value: `${inventory.stok_q} pcs` },
                  { label: 'Total Stok', value: `${totalStock} pcs` },
                  { label: 'Minimum Stock', value: `${inventory.min_stok} pcs` },
                  { 
                    label: 'Stock Status', 
                    component: <StatusBadge status={stockStatus.status} variant={stockStatus.variant} />
                  }
                ]}
              />
            </AccordionItem>

            {/* Pricing Information */}
            <AccordionItem
              title="Pricing Information"
              isExpanded={expandedSections.pricingInfo}
              onToggle={() => toggleSection('pricingInfo')}
              bgColor="bg-gradient-to-r from-green-50 to-green-100"
            >
              <InfoTable 
                data={[
                  { label: 'Harga Barang', value: formatCurrency(inventory.harga_barang) },
                  { label: 'Total Value', value: formatCurrency(inventory.harga_barang * totalStock) }
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
                  { label: 'Created At', value: formatDate(inventory.createdAt) },
                  { label: 'Updated At', value: formatDate(inventory.updatedAt) }
                ]}
              />
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

export default ViewInventoryModal;

