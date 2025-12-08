import React, { useState, useEffect, useMemo } from 'react';
import {
  ArchiveBoxIcon,
  EyeIcon,
  CubeIcon,
  ScaleIcon,
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import {
  AccordionItem,
  InfoTable,
  StatusBadge,
  TabContainer,
  Tab,
  TabContent,
  TabPanel
} from '../ui';
import { formatCurrency, formatDateTime } from '../../utils/formatUtils';
import useItemDetail from '../../hooks/useItemDetail';
import ActivityTimeline from '../common/ActivityTimeline';
import { useItemOperations } from '../../hooks/useItem';
import ItemForm from './ItemForm';

const ItemDetailCard = ({ item, onClose, onUpdate, loading: parentLoading = false }) => {
  const itemId = item?.id;
  const {
    item: detailedItem,
    loading: detailLoading,
    error
  } = useItemDetail(itemId);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    pricingInfo: false,
    metaInfo: false
  });

  const {
    updateItemData,
    loading: updateLoading,
    error: updateError,
    setError,
    clearError,
    validateItemData
  } = useItemOperations();

  const resolvedItem = useMemo(() => {
    return detailedItem || item;
  }, [detailedItem, item]);

  const handleEditClick = () => {
    clearError();
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    clearError();
    setIsEditMode(false);
  };

  const handleSave = async (formData) => {
    const validationErrors = validateItemData(formData);
    if (Object.keys(validationErrors).length > 0) {
      const [firstErrorMessage] = Object.values(validationErrors);
      setError(firstErrorMessage);
      return;
    }

    try {
      await updateItemData(item.id, formData);
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Update item error:', error);
    }
  };

  if (!item) return null;

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
        label: 'PPN (%)',
        value: formatNumberWithSuffix(itemPrice?.ppn, '%')
      },
      {
        label: 'Potongan A (%)',
        value: formatNumberWithSuffix(itemPrice?.pot1, '%')
      },
      {
        label: 'Harga Setelah Potongan A',
        value: itemPrice?.harga1 !== undefined && itemPrice?.harga1 !== null ? formatCurrency(itemPrice.harga1) : '—'
      },
      {
        label: 'Potongan B (%)',
        value: formatNumberWithSuffix(itemPrice?.pot2, '%')
      },
      {
        label: 'Harga Setelah Potongan B',
        value: itemPrice?.harga2 !== undefined && itemPrice?.harga2 !== null ? formatCurrency(itemPrice.harga2) : '—'
      }
    ]
    : [
      {
        label: 'Harga',
        value: 'Tidak ada data harga'
      }
    ];

  const loading = parentLoading || detailLoading;

  // Normalize item data for edit form
  const normalizeItemForEdit = (itemData) => {
    const dimensiValue = (() => {
      if (
        itemData.dimensiBarang &&
        typeof itemData.dimensiBarang === 'object' &&
        !Array.isArray(itemData.dimensiBarang)
      ) {
        return itemData.dimensiBarang;
      }
      if (Array.isArray(itemData.dimensiBarang) && itemData.dimensiBarang.length > 0) {
        return itemData.dimensiBarang[0];
      }
      if (itemData.dimensi && typeof itemData.dimensi === 'object') {
        return itemData.dimensi;
      }
      return {};
    })();

    const dimensiKarton = (() => {
      if (
        itemData.dimensiKarton &&
        typeof itemData.dimensiKarton === 'object' &&
        !Array.isArray(itemData.dimensiKarton)
      ) {
        return itemData.dimensiKarton;
      }
      if (Array.isArray(itemData.dimensiKarton) && itemData.dimensiKarton.length > 0) {
        return itemData.dimensiKarton[0];
      }
      return null;
    })();

    const itemStock = itemData.itemStock || itemData.itemStocks || {};
    const itemPrice = (() => {
      if (itemData.itemPrice && typeof itemData.itemPrice === 'object') {
        return itemData.itemPrice;
      }
      if (Array.isArray(itemData.itemPrices) && itemData.itemPrices.length > 0) {
        return itemData.itemPrices[0];
      }
      return {};
    })();

    return {
      ...itemData,
      allow_mixed_carton: Boolean(itemData.allow_mixed_carton ?? true),
      dimensiBarang: dimensiValue,
      dimensi: dimensiValue,
      dimensiKarton,
      itemStock,
      itemStocks: itemStock,
      itemPrice,
      berat: itemData.berat ?? dimensiValue?.berat ?? 0,
      panjang: itemData.panjang ?? dimensiValue?.panjang ?? 0,
      lebar: itemData.lebar ?? dimensiValue?.lebar ?? 0,
      tinggi: itemData.tinggi ?? dimensiValue?.tinggi ?? 0
    };
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Item Details
            {isEditMode && <span className="ml-3 text-sm font-normal text-blue-600">(Editing)</span>}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{resolvedItem?.nama_barang}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditMode ? (
            <>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={updateLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading item details...</span>
        </div>
      ) : isEditMode ? (
        /* EDIT MODE */
        <div className="bg-gray-50 rounded-lg p-6">
          <ItemForm
            onSubmit={handleSave}
            onClose={handleCancelEdit}
            initialData={normalizeItemForEdit(resolvedItem)}
            loading={updateLoading}
            error={updateError}
          />
        </div>
      ) : (
        /* VIEW MODE */
        <div>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
              id="pricing"
              label="Pricing"
              icon={<BanknotesIcon className="h-4 w-4" />}
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

            {/* Pricing Tab */}
            <TabPanel tabId="pricing">
              <div className="space-y-6">
                {/* Pricing Information Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <BanknotesIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Pricing Information</h3>
                  </div>
                  <InfoTable data={pricingRows} />
                </div>

                {/* Pricing Summary Card */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">Ringkasan Harga</h4>
                      <p className="text-green-700 mt-1">
                        Harga Dasar: {itemPrice?.harga !== undefined && itemPrice?.harga !== null ? formatCurrency(itemPrice.harga) : '—'}
                      </p>
                      {itemPrice?.ppn > 0 && (
                        <p className="text-green-600 text-sm mt-1">
                          PPN: {itemPrice.ppn}%
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">Harga Akhir (setelah potongan)</p>
                      <p className="text-2xl font-bold text-green-900">
                        {itemPrice?.harga2 !== undefined && itemPrice?.harga2 !== null && itemPrice?.harga2 > 0
                          ? formatCurrency(itemPrice.harga2)
                          : itemPrice?.harga1 !== undefined && itemPrice?.harga1 !== null && itemPrice?.harga1 > 0
                            ? formatCurrency(itemPrice.harga1)
                            : itemPrice?.harga !== undefined && itemPrice?.harga !== null
                              ? formatCurrency(itemPrice.harga)
                              : '—'}
                      </p>
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
  );
};

export default ItemDetailCard;
