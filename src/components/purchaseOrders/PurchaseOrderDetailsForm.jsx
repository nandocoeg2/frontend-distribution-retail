import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchItems, getItems } from '../../services/itemService';
import Autocomplete from '../common/Autocomplete';

const PurchaseOrderDetailsForm = ({ details, onDetailsChange, onRemoveDetail, onAddDetail }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ensure details is always an array
  const safeDetails = details || [];

  // Fetch initial items for autocomplete
  useEffect(() => {
    const fetchInitialItems = async () => {
      try {
        setIsLoading(true);
        const response = await getItems(1, 50);
        if (response.success && Array.isArray(response.data.data)) {
          setItems(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch initial items:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialItems();
  }, []);

  const resolveItemPrice = useMemo(() => {
    return (item) => {
      if (!item || typeof item !== 'object') {
        return 0;
      }

      const priceSource = (() => {
        if (item.itemPrice && typeof item.itemPrice === 'object') {
          return item.itemPrice;
        }
        if (Array.isArray(item.itemPrices) && item.itemPrices.length > 0) {
          return item.itemPrices[0];
        }
        if (item.item_price && typeof item.item_price === 'object') {
          return item.item_price;
        }
        return {};
      })();

      if (priceSource.harga !== undefined && priceSource.harga !== null) {
        return priceSource.harga;
      }

      return 0;
    };
  }, []);

  const resolveItemStock = (item) => {
    if (!item || typeof item !== 'object') {
      return {};
    }
    return item.itemStock || item.itemStocks || item.item_stock || {};
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...safeDetails];
    updatedDetails[index] = {
      ...updatedDetails[index],
      [field]: value
    };

    // Calculate derived fields
    if (field === 'quantity' || field === 'isi' || field === 'harga' || field === 'potongan_a' || field === 'potongan_b') {
      calculateDerivedFields(updatedDetails, index);
    }

    onDetailsChange(updatedDetails);
  };

  const calculateDerivedFields = (detailsArray, index) => {
    const detail = detailsArray[index];
    
    if (detail.quantity && detail.isi && detail.harga) {
      const quantity = parseFloat(detail.quantity) || 0;
      const isi = parseFloat(detail.isi) || 0;
      const harga = parseFloat(detail.harga) || 0;
      const potonganA = parseFloat(detail.potongan_a) || 0;
      const potonganB = parseFloat(detail.potongan_b) || 0;

      // Calculate harga_after_potongan_a
      const hargaAfterPotonganA = harga - (harga * potonganA / 100);
      
      // Calculate harga_netto (same as harga_after_potongan_a for now)
      const hargaNetto = hargaAfterPotonganA;
      
      // Calculate harga_after_potongan_b
      const hargaAfterPotonganB = hargaNetto - (hargaNetto * potonganB / 100);
      
      // Calculate total_pembelian
      const totalPembelian = quantity * isi * hargaAfterPotonganB;

      detailsArray[index] = {
        ...detail,
        harga_after_potongan_a: hargaAfterPotonganA,
        harga_netto: hargaNetto,
        harga_after_potongan_b: hargaAfterPotonganB,
        total_pembelian: totalPembelian
      };
    }
  };

  const handleItemSelect = (index, itemId) => {
    const item = items.find(inv => inv.id === itemId);
    if (item) {
      const itemStock = resolveItemStock(item);
      const derivedPrice = resolveItemPrice(item);
      const updatedDetails = [...safeDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        itemId: itemId,
        plu: item.plu,
        nama_barang: item.nama_barang,
        harga: derivedPrice || 0,
        isi: updatedDetails[index]?.isi ?? itemStock.qty_per_carton ?? 1
      };
      
      // Recalculate derived fields
      calculateDerivedFields(updatedDetails, index);
      onDetailsChange(updatedDetails);
    }
  };

  // Function to search items dynamically
  const searchItemOptions = async (query) => {
    try {
      setIsLoading(true);
      const response = await searchItems(query, 1, 50);
      if (response.success && Array.isArray(response.data.data)) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to search items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewDetail = () => {
    const newDetail = {
      plu: '',
      nama_barang: '',
      quantity: 1,
      isi: 1,
      harga: 0,
      potongan_a: 0,
      harga_after_potongan_a: 0,
      harga_netto: 0,
      total_pembelian: 0,
      potongan_b: 0,
      harga_after_potongan_b: 0,
      itemId: ''
    };
    onAddDetail(newDetail);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-gray-900">Purchase Order Details</h4>
        <button
          type="button"
          onClick={addNewDetail}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Detail
        </button>
      </div>

      {safeDetails.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="mt-2">No purchase order details added yet.</p>
          <p className="text-sm">Click "Add Detail" to start adding items.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeDetails.map((detail, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-medium text-gray-900">Detail #{index + 1}</h5>
                <button
                  type="button"
                  onClick={() => onRemoveDetail(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Item Selection */}
                <div className="lg:col-span-3">
                  <Autocomplete
                    label="Item *"
                    options={items}
                    value={detail.itemId}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                    placeholder="Search item by PLU or name"
                    displayKey="nama_barang"
                    valueKey="id"
                    name={`itemId_${index}`}
                    required
                    disabled={isLoading}
                    loading={isLoading}
                    onSearch={searchItemOptions}
                    showId={true}
                  />
                  {detail.itemId && (
                    <div className="mt-1 text-xs text-gray-500">
                      Selected: {detail.plu} - {detail.nama_barang}
                    </div>
                  )}
                </div>

                {/* PLU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLU *
                  </label>
                  <input
                    type="text"
                    value={detail.plu}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="PLU akan terisi otomatis dari item"
                  />
                  <p className="mt-1 text-xs text-gray-500">Otomatis terisi dari item yang dipilih</p>
                </div>

                {/* Nama Barang */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Barang *
                  </label>
                  <input
                    type="text"
                    value={detail.nama_barang}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="Nama barang akan terisi otomatis dari item"
                  />
                  <p className="mt-1 text-xs text-gray-500">Otomatis terisi dari item yang dipilih</p>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={detail.quantity}
                    onChange={(e) => handleDetailChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Isi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Isi *
                  </label>
                  <input
                    type="number"
                    value={detail.isi}
                    onChange={(e) => handleDetailChange(index, 'isi', parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga *
                  </label>
                  <input
                    type="number"
                    value={detail.harga}
                    onChange={(e) => handleDetailChange(index, 'harga', parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Potongan A */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Potongan A (%)
                  </label>
                  <input
                    type="number"
                    value={detail.potongan_a}
                    onChange={(e) => handleDetailChange(index, 'potongan_a', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Harga After Potongan A */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga After Potongan A
                  </label>
                  <input
                    type="number"
                    value={detail.harga_after_potongan_a}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    placeholder="Auto calculated"
                  />
                </div>

                {/* Harga Netto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Netto *
                  </label>
                  <input
                    type="number"
                    value={detail.harga_netto}
                    onChange={(e) => handleDetailChange(index, 'harga_netto', parseFloat(e.target.value) || 0)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Total Pembelian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Pembelian
                  </label>
                  <input
                    type="number"
                    value={detail.total_pembelian}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    placeholder="Auto calculated"
                  />
                </div>

                {/* Potongan B */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Potongan B (%)
                  </label>
                  <input
                    type="number"
                    value={detail.potongan_b}
                    onChange={(e) => handleDetailChange(index, 'potongan_b', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Harga After Potongan B */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga After Potongan B
                  </label>
                  <input
                    type="number"
                    value={detail.harga_after_potongan_b}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    placeholder="Auto calculated"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetailsForm;
