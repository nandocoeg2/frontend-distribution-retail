import React, { useMemo, useState } from 'react';
import { ArchiveBoxIcon, EyeIcon, CubeIcon, ScaleIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  AccordionItem,
  InfoCard,
  StatusBadge,
  InfoTable,
  TabContainer,
  Tab,
  TabContent,
  TabPanel
} from '../ui';
import { formatCurrency, formatDateTime } from '../../utils/formatUtils';
import useInventoryDetail from '../../hooks/useInventoryDetail';
import ActivityTimeline from '../common/ActivityTimeline';

const ViewInventoryModal = ({ show, inventory, onClose }) => {
  const inventoryId = show ? inventory?.id : null;
  const {
    inventory: detailedInventory,
    loading,
    error
  } = useInventoryDetail(inventoryId);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false
  });

  if (!show || !inventory) {
    return null;
  }

  const resolvedInventory = useMemo(() => {
    return detailedInventory || inventory;
  }, [detailedInventory, inventory]);


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

  const dimensionList = Array.isArray(resolvedInventory?.dimensiBarang) ? resolvedInventory.dimensiBarang : [];
  const dimensiKarton =
    resolvedInventory?.dimensiKarton ||
    dimensionList.find((dimension) => dimension?.type === 'KARTON') ||
    resolvedInventory?.dimensiKardus ||
    null;
  const dimensiPcs =
    resolvedInventory?.dimensiPcs ||
    dimensionList.find((dimension) => dimension?.type === 'PCS') ||
    null;

  const cartonWeight = dimensiKarton?.berat ?? resolvedInventory?.berat;
  const cartonLength = dimensiKarton?.panjang ?? resolvedInventory?.panjang;
  const cartonWidth = dimensiKarton?.lebar ?? resolvedInventory?.lebar;
  const cartonHeight = dimensiKarton?.tinggi ?? resolvedInventory?.tinggi;
  const cartonQtyPerCarton = dimensiKarton?.qty_per_carton ?? resolvedInventory?.qty_per_carton;

  const pcsWeight = dimensiPcs?.berat;
  const pcsLength = dimensiPcs?.panjang;
  const pcsWidth = dimensiPcs?.lebar;
  const pcsHeight = dimensiPcs?.tinggi;

  const hasCartonDimension = [cartonWeight, cartonLength, cartonWidth, cartonHeight, cartonQtyPerCarton].some(
    (value) => value !== null && value !== undefined
  );
  const hasPcsDimension = [pcsWeight, pcsLength, pcsWidth, pcsHeight].some(
    (value) => value !== null && value !== undefined
  );
  const dimensionExists = hasCartonDimension || hasPcsDimension;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArchiveBoxIcon className="h-8 w-8 text-orange-500" aria-hidden="true" />
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
          ) : (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <TabContainer
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="underline"
                className="mb-6"
              >
                <Tab
                  id="overview"
                  label="Overview"
                  icon={<EyeIcon className="h-4 w-4" />}
                />
                <Tab
                  id="stock"
                  label="Stok"
                  icon={<CubeIcon className="h-4 w-4" />}
                />
                <Tab
                  id="dimensions"
                  label="Dimensi"
                  icon={<ScaleIcon className="h-4 w-4" />}
                />
                <Tab
                  id="activity"
                  label="Activity"
                  icon={<ClockIcon className="h-4 w-4" />}
                />
              </TabContainer>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                {/* Overview Tab */}
                <TabPanel tabId="overview">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <AccordionItem
                      title="Basic Information"
                      isExpanded={expandedSections.basicInfo}
                      onToggle={() => setExpandedSections(prev => ({ ...prev, basicInfo: !prev.basicInfo }))}
                      bgColor="bg-gradient-to-r from-orange-50 to-orange-100"
                    >
                      <InfoTable
                        data={[
                          { label: 'PLU', value: resolvedInventory?.plu, copyable: true },
                          { label: 'Nama Barang', value: resolvedInventory?.nama_barang },
                          { label: 'Inventory ID', value: resolvedInventory?.id, copyable: true },
                          { label: 'Allow Mixed Carton', value: resolvedInventory?.allow_mixed_carton ? 'Ya' : 'Tidak' }
                        ]}
                      />
                    </AccordionItem>

                    {/* Pricing Information */}
                    <AccordionItem
                      title="Pricing Information"
                      isExpanded={expandedSections.pricingInfo}
                      onToggle={() => setExpandedSections(prev => ({ ...prev, pricingInfo: !prev.pricingInfo }))}
                      bgColor="bg-gradient-to-r from-green-50 to-green-100"
                    >
                      <InfoTable
                        data={[
                          { label: 'Harga Barang', value: formatCurrency(resolvedInventory?.harga_barang) },
                          { label: 'Total Value', value: formatCurrency((resolvedInventory?.harga_barang || 0) * totalStock) }
                        ]}
                      />
                    </AccordionItem>

                    {/* System Information */}
                    <AccordionItem
                      title="System Information"
                      isExpanded={expandedSections.metaInfo}
                      onToggle={() => setExpandedSections(prev => ({ ...prev, metaInfo: !prev.metaInfo }))}
                      bgColor="bg-gradient-to-r from-purple-50 to-purple-100"
                    >
                      <InfoTable
                        data={[
                          { label: 'Created At', value: formatDateTime(resolvedInventory?.createdAt) },
                          { label: 'Updated At', value: formatDateTime(resolvedInventory?.updatedAt) }
                        ]}
                      />
                    </AccordionItem>

                  </div>
                </TabPanel>

                {/* Stock Tab */}
                <TabPanel tabId="stock">
                  <div className="space-y-6">
                    {/* Stock Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <CubeIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Stock Information</h3>
                      </div>
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
                    </div>

                    {/* Stock Summary Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-blue-900">Stock Overview</h4>
                          <p className="text-blue-700 mt-1">
                            Total: {totalStock} unit | Min: {minimumStock} unit
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={stockStatus.status} variant={stockStatus.variant} size='lg' dot />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabPanel>

                {/* Dimensions Tab */}
                <TabPanel tabId="dimensions">
                  <div className="space-y-6">
                    {dimensionExists ? (
                      <>
                        {/* Carton Dimensions */}
                        {hasCartonDimension && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                                <ArchiveBoxIcon className="h-5 w-5 text-amber-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Carton Dimensions</h3>
                            </div>
                            <InfoTable
                              data={[
                                { label: 'Berat', value: `${cartonWeight || 0} kg` },
                                { label: 'Panjang', value: `${cartonLength || 0} cm` },
                                { label: 'Lebar', value: `${cartonWidth || 0} cm` },
                                { label: 'Tinggi', value: `${cartonHeight || 0} cm` },
                                { label: 'Qty per Carton', value: `${cartonQtyPerCarton || 0} pcs` }
                              ]}
                            />
                          </div>
                        )}

                        {/* PCS Dimensions */}
                        {hasPcsDimension && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                              <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <CubeIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Individual Unit Dimensions</h3>
                            </div>
                            <InfoTable
                              data={[
                                { label: 'Berat', value: `${pcsWeight || 0} kg` },
                                { label: 'Panjang', value: `${pcsLength || 0} cm` },
                                { label: 'Lebar', value: `${pcsWidth || 0} cm` },
                                { label: 'Tinggi', value: `${pcsHeight || 0} cm` }
                              ]}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <ScaleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">No Dimension Data</h3>
                        <p className="text-gray-400">Tidak ada data berat atau ukuran untuk inventory ini.</p>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Activity Tab */}
                <TabPanel tabId="activity">
                  <div className="space-y-6">
                    {/* Activity Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <ClockIcon className="h-5 w-5 text-purple-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                      </div>
                      <ActivityTimeline
                        auditTrails={resolvedInventory?.auditTrails || []}
                        title=""
                        showCount={true}
                        emptyMessage="No activity found for this inventory item."
                      />
                    </div>
                  </div>
                </TabPanel>
              </TabContent>
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

export default ViewInventoryModal;
