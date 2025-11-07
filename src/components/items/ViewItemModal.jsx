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
import useItemDetail from '../../hooks/useItemDetail';
import ActivityTimeline from '../common/ActivityTimeline';

const ViewItemModal = ({ show, item, onClose }) => {
  const itemId = show ? item?.id : null;
  const {
    item: detailedItem,
    loading,
    error
  } = useItemDetail(itemId);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false
  });

  if (!show || !item) {
    return null;
  }

  const resolvedItem = useMemo(() => {
    return detailedItem || item;
  }, [detailedItem, item]);


  const resolveStockStatusVariant = (currentStock, minStock) => {
    if (currentStock <= minStock) {
      return { status: 'Low Stock', variant: 'danger' };
    } else if (currentStock <= minStock * 1.5) {
      return { status: 'Warning', variant: 'warning' };
    }
    return { status: 'In Stock', variant: 'success' };
  };

  const itemStock = resolvedItem?.itemStock || resolvedItem?.itemStocks || {};
  const itemPrice = (() => {
    if (resolvedItem?.itemPrice && typeof resolvedItem.itemPrice === 'object') {
      return resolvedItem.itemPrice;
    }
    if (Array.isArray(resolvedItem?.itemPrices) && resolvedItem.itemPrices.length > 0) {
      return resolvedItem.itemPrices[0];
    }
    return {};
  })();
  const stokQuantity = Number(itemStock?.stok_quantity ?? resolvedItem?.stok_quantity ?? 0);
  const minimumStock = Number(itemStock?.min_stok ?? resolvedItem?.min_stok ?? 0);
  const qtyPerCarton = Number(itemStock?.qty_per_carton ?? resolvedItem?.qty_per_carton ?? 0);
  const stockStatus = resolveStockStatusVariant(stokQuantity, minimumStock);

  const dimensiBarang = (() => {
    if (
      resolvedItem?.dimensiBarang &&
      typeof resolvedItem.dimensiBarang === 'object' &&
      !Array.isArray(resolvedItem.dimensiBarang)
    ) {
      return resolvedItem.dimensiBarang;
    }
    if (Array.isArray(resolvedItem?.dimensiBarang) && resolvedItem.dimensiBarang.length > 0) {
      return resolvedItem.dimensiBarang[0];
    }
    if (resolvedItem?.dimensi && typeof resolvedItem.dimensi === 'object') {
      return resolvedItem.dimensi;
    }
    return {};
  })();

  const dimensionValues = {
    berat: dimensiBarang?.berat ?? resolvedItem?.berat,
    panjang: dimensiBarang?.panjang ?? resolvedItem?.panjang,
    lebar: dimensiBarang?.lebar ?? resolvedItem?.lebar,
    tinggi: dimensiBarang?.tinggi ?? resolvedItem?.tinggi
  };
  const dimensiKarton = resolvedItem?.dimensiKarton || null;
  const cartonDimensionValues = dimensiKarton
    ? {
        berat: dimensiKarton?.berat,
        panjang: dimensiKarton?.panjang,
        lebar: dimensiKarton?.lebar,
        tinggi: dimensiKarton?.tinggi
      }
    : {};

  const dimensionExists = Object.values(dimensionValues).some(
    (value) => value !== null && value !== undefined
  );
  const cartonDimensionExists = Object.values(cartonDimensionValues).some(
    (value) => value !== null && value !== undefined
  );

  const formatNumberWithSuffix = (value, suffix = '') => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (suffix) {
      return `${value}${suffix}`;
    }
    return String(value);
  };

  const hasItemPrice = itemPrice && Object.values(itemPrice).some(value => value !== null && value !== undefined);
  const pricingRows = hasItemPrice
    ? [
        {
          label: 'Harga Dasar',
          value: itemPrice?.harga !== undefined && itemPrice?.harga !== null ? formatCurrency(itemPrice.harga) : 'Tidak ada data harga'
        },
        {
          label: 'Potongan 1 (%)',
          value: formatNumberWithSuffix(itemPrice?.pot1, '%')
        },
        {
          label: 'Harga Setelah Potongan 1',
          value: itemPrice?.harga1 !== undefined && itemPrice?.harga1 !== null ? formatCurrency(itemPrice.harga1) : '—'
        },
        {
          label: 'Potongan 2 (%)',
          value: formatNumberWithSuffix(itemPrice?.pot2, '%')
        },
        {
          label: 'Harga Setelah Potongan 2',
          value: itemPrice?.harga2 !== undefined && itemPrice?.harga2 !== null ? formatCurrency(itemPrice.harga2) : '—'
        },
        {
          label: 'PPN (%)',
          value: formatNumberWithSuffix(itemPrice?.ppn, '%')
        }
      ]
    : [
        {
          label: 'Harga',
          value: 'Tidak ada data harga'
        }
      ];

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
              <h2 className="text-2xl font-bold text-gray-900">Item Details</h2>
              <p className="text-sm text-gray-600">{resolvedItem?.nama_barang}</p>
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
                          { label: 'PLU', value: resolvedItem?.plu, copyable: true },
                          { label: 'Nama Barang', value: resolvedItem?.nama_barang },
                          { label: 'Item ID', value: resolvedItem?.id, copyable: true },
                          { label: 'EAN Barcode', value: resolvedItem?.eanBarcode || '—', copyable: Boolean(resolvedItem?.eanBarcode) },
                          { label: 'Satuan (UoM)', value: resolvedItem?.uom || '—' },
                          { label: 'Allow Mixed Carton', value: resolvedItem?.allow_mixed_carton ? 'Ya' : 'Tidak' }
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
                      <InfoTable data={pricingRows} />
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
                          { label: 'Created At', value: formatDateTime(resolvedItem?.createdAt) },
                          { label: 'Updated At', value: formatDateTime(resolvedItem?.updatedAt) }
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
                          { label: 'Stok Quantity', value: `${stokQuantity} unit` },
                          { label: 'Minimum Stock', value: `${minimumStock} unit` },
                          { label: 'Qty per Carton', value: `${qtyPerCarton} pcs` },
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
                            Total: {stokQuantity} unit | Min: {minimumStock} unit
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
                      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-amber-100 rounded-lg mr-3">
                            <ArchiveBoxIcon className="h-5 w-5 text-amber-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Dimensi Produk</h3>
                        </div>
                        <InfoTable
                          data={[
                            { label: 'Berat', value: `${dimensionValues.berat ?? 0} kg` },
                            { label: 'Panjang', value: `${dimensionValues.panjang ?? 0} cm` },
                            { label: 'Lebar', value: `${dimensionValues.lebar ?? 0} cm` },
                            { label: 'Tinggi', value: `${dimensionValues.tinggi ?? 0} cm` }
                          ]}
                        />
                      </div>
                    ) : null}

                    {cartonDimensionExists ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <CubeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">Dimensi Karton</h3>
                        </div>
                        <InfoTable
                          data={[
                            { label: 'Berat Karton', value: `${cartonDimensionValues.berat ?? 0} kg` },
                            { label: 'Panjang Karton', value: `${cartonDimensionValues.panjang ?? 0} cm` },
                            { label: 'Lebar Karton', value: `${cartonDimensionValues.lebar ?? 0} cm` },
                            { label: 'Tinggi Karton', value: `${cartonDimensionValues.tinggi ?? 0} cm` }
                          ]}
                        />
                      </div>
                    ) : null}

                    {!dimensionExists && !cartonDimensionExists ? (
                      <div className="text-center py-10">
                        <ScaleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">No Dimension Data</h3>
                        <p className="text-gray-400">Tidak ada data berat atau ukuran untuk item ini.</p>
                      </div>
                    ) : null}
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
                        auditTrails={resolvedItem?.auditTrails || []}
                        title=""
                        showCount={true}
                        emptyMessage="No activity found for this item."
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

export default ViewItemModal;
