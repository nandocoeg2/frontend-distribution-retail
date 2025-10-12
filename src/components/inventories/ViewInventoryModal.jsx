import React, { useMemo, useState } from 'react';
import {
  AccordionItem,
  InfoCard,
  StatusBadge,
  InfoTable
} from '../ui';
import { formatCurrency, formatDateTime } from '../../utils/formatUtils';
import useInventoryDetail from '../../hooks/useInventoryDetail';

const ViewInventoryModal = ({ show, inventory, onClose }) => {
  const inventoryId = show ? inventory?.id : null;
  const {
    inventory: detailedInventory,
    loading,
    error
  } = useInventoryDetail(inventoryId);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    stockInfo: false,
    pricingInfo: false,
    dimensionInfo: false,
    metaInfo: false,
    auditInfo: false
  });

  if (!show || !inventory) {
    return null;
  }

  const resolvedInventory = useMemo(() => {
    return detailedInventory || inventory;
  }, [detailedInventory, inventory]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resolveStockStatusVariant = (currentStock, minStock) => {
    if (currentStock <= minStock) {
      return { status: 'Low Stock', variant: 'danger' };
    } else if (currentStock <= minStock * 1.5) {
      return { status: 'Warning', variant: 'warning' };
    }
    return { status: 'In Stock', variant: 'success' };
  };

  const totalCartons = resolvedInventory?.stok_c || 0;
  const totalPieces = resolvedInventory?.stok_q || 0;
  const minimumStock = resolvedInventory?.min_stok || 0;
  const totalStock = totalCartons + totalPieces;
  const stockStatus = resolveStockStatusVariant(totalStock, minimumStock);

  const weight = resolvedInventory?.berat ?? resolvedInventory?.dimensiKardus?.berat;
  const length = resolvedInventory?.panjang ?? resolvedInventory?.dimensiKardus?.panjang;
  const width = resolvedInventory?.lebar ?? resolvedInventory?.dimensiKardus?.lebar;
  const height = resolvedInventory?.tinggi ?? resolvedInventory?.dimensiKardus?.tinggi;
  const dimensionExists = [weight, length, width, height].some((value) => value !== null && value !== undefined);

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
              <p className="text-sm text-gray-600">{resolvedInventory?.nama_barang}</p>
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
          {error ? (
            <InfoCard
              variant="danger"
              title="Gagal memuat data"
              description={error}
            />
          ) : null}

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : null}

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
                  { label: 'PLU', value: resolvedInventory?.plu, copyable: true },
                  { label: 'Nama Barang', value: resolvedInventory?.nama_barang },
                  { label: 'Inventory ID', value: resolvedInventory?.id, copyable: true }
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
                  { label: 'Stok Karton', value: `${totalCartons} karton` },
                  { label: 'Stok Pcs', value: `${totalPieces} pcs` },
                  { label: 'Total Stok', value: `${totalStock} unit` },
                  { label: 'Minimum Stock', value: `${minimumStock} unit` },
                  {
                    label: 'Stock Status',
                    component: <StatusBadge status={stockStatus.status} variant={stockStatus.variant} size='sm' dot />
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
                  { label: 'Harga Barang', value: formatCurrency(resolvedInventory?.harga_barang) },
                  { label: 'Total Value', value: formatCurrency((resolvedInventory?.harga_barang || 0) * totalStock) }
                ]}
              />
            </AccordionItem>

            {/* Dimension Information */}
            <AccordionItem
              title="Dimension Information"
              isExpanded={expandedSections.dimensionInfo}
              onToggle={() => toggleSection('dimensionInfo')}
              bgColor="bg-gradient-to-r from-lime-50 to-emerald-50"
            >
              {dimensionExists ? (
                <InfoTable
                  data={[
                    { label: 'Berat', value: `${weight || 0} kg` },
                    { label: 'Panjang', value: `${length || 0} cm` },
                    { label: 'Lebar', value: `${width || 0} cm` },
                    { label: 'Tinggi', value: `${height || 0} cm` }
                  ]}
                />
              ) : (
                <InfoCard
                  variant="info"
                  title="Dimensi belum diatur"
                  description="Tidak ada data berat atau ukuran kardus untuk inventory ini."
                />
              )}
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
                  { label: 'Created At', value: formatDateTime(resolvedInventory?.createdAt) },
                  { label: 'Updated At', value: formatDateTime(resolvedInventory?.updatedAt) }
                ]}
              />
            </AccordionItem>

            {/* Audit Information */}
            <AccordionItem
              title="Audit Trail"
              isExpanded={expandedSections.auditInfo}
              onToggle={() => toggleSection('auditInfo')}
              bgColor="bg-gradient-to-r from-slate-50 to-slate-100"
            >
              <InfoTable
                data={[
                  { label: 'Created By', value: resolvedInventory?.createdBy, copyable: true },
                  { label: 'Updated By', value: resolvedInventory?.updatedBy, copyable: true }
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
