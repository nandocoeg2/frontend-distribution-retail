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
    if (field === 'quantity_pcs' || field === 'quantity_carton' || field === 'qty_per_carton' || field === 'harga' || field === 'potongan_a' || field === 'potongan_b') {
      calculateDerivedFields(updatedDetails, index);
    }

    onDetailsChange(updatedDetails);
  };

  const calculateDerivedFields = (detailsArray, index) => {
    const detail = detailsArray[index];
    
    const quantityPcs = parseFloat(detail.quantity_pcs) || 0;
    const quantityCarton = parseFloat(detail.quantity_carton) || 0;
    const qtyPerCarton = parseFloat(detail.qty_per_carton) || 1;
    const harga = parseFloat(detail.harga) || 0;
    const potonganA = parseFloat(detail.potongan_a) || 0;
    const potonganB = parseFloat(detail.potongan_b) || 0;

    // Calculate total_quantity_order: (carton × qty_per_carton) + pcs
    const totalQuantityOrder = (quantityCarton * qtyPerCarton) + quantityPcs;

    // Calculate harga_after_potongan_a
    const hargaAfterPotonganA = harga - (harga * potonganA / 100);
    
    // Calculate harga_netto (same as harga_after_potongan_a for now)
    const hargaNetto = hargaAfterPotonganA;
    
    // Calculate harga_after_potongan_b
    const hargaAfterPotonganB = hargaNetto - (hargaNetto * potonganB / 100);
    
    // Calculate total_pembelian: price per pcs × total quantity
    const totalPembelian = totalQuantityOrder * hargaAfterPotonganB;

    detailsArray[index] = {
      ...detail,
      total_quantity_order: totalQuantityOrder,
      harga_after_potongan_a: hargaAfterPotonganA,
      harga_netto: hargaNetto,
      harga_after_potongan_b: hargaAfterPotonganB,
      total_pembelian: totalPembelian
    };
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
        qty_per_carton: itemStock.qty_per_carton || 1
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
      quantity_pcs: 0,
      quantity_carton: 0,
      qty_per_carton: 1,
      total_quantity_order: 0,
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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-900">PO Details</h4>
        <button type="button" onClick={addNewDetail} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add
        </button>
      </div>

      {safeDetails.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-xs">
          <p>No details added. Click "Add" to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeDetails.map((detail, index) => (
            <div key={index} className="border border-gray-200 rounded p-2 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-xs font-medium text-gray-700">#{index + 1}</h5>
                <button type="button" onClick={() => onRemoveDetail(index)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <div className="col-span-2 md:col-span-3 lg:col-span-4">
                  <Autocomplete label="Item" options={items} value={detail.itemId} onChange={(e) => handleItemSelect(index, e.target.value)} placeholder="Search item..." displayKey="nama_barang" valueKey="id" name={`itemId_${index}`} required disabled={isLoading} loading={isLoading} onSearch={searchItemOptions} showId={true} size="sm" />
                  {detail.itemId && <div className="text-xs text-gray-500 mt-0.5">{detail.plu} - {detail.nama_barang}</div>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">PLU</label>
                  <input type="text" value={detail.plu} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Nama</label>
                  <input type="text" value={detail.nama_barang} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Qty Carton</label>
                  <input type="number" value={detail.quantity_carton} onChange={(e) => handleDetailChange(index, 'quantity_carton', parseInt(e.target.value) || 0)} min="0" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Qty PCS</label>
                  <input type="number" value={detail.quantity_pcs} onChange={(e) => handleDetailChange(index, 'quantity_pcs', parseInt(e.target.value) || 0)} min="0" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Per Carton</label>
                  <input type="number" value={detail.qty_per_carton} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
                </div>

                <div className="col-span-2 md:col-span-3 lg:col-span-4">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                    <div className="text-xs text-blue-700">
                      {detail.quantity_carton > 0 && <span>{detail.quantity_carton}×{detail.qty_per_carton}</span>}
                      {detail.quantity_carton > 0 && detail.quantity_pcs > 0 && <span>+</span>}
                      {detail.quantity_pcs > 0 && <span>{detail.quantity_pcs}pcs</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-900">{detail.total_quantity_order || 0}</span>
                      <span className="text-xs text-blue-700 ml-1">pcs</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Harga</label>
                  <input type="number" value={detail.harga} onChange={(e) => handleDetailChange(index, 'harga', parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Pot A %</label>
                  <input type="number" value={detail.potongan_a} onChange={(e) => handleDetailChange(index, 'potongan_a', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">H. Pot A</label>
                  <input type="number" value={detail.harga_after_potongan_a} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">H. Netto</label>
                  <input type="number" value={detail.harga_netto} onChange={(e) => handleDetailChange(index, 'harga_netto', parseFloat(e.target.value) || 0)} min="0" step="0.01" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Total</label>
                  <input type="number" value={detail.total_pembelian} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Pot B %</label>
                  <input type="number" value={detail.potongan_b} onChange={(e) => handleDetailChange(index, 'potongan_b', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">H. Pot B</label>
                  <input type="number" value={detail.harga_after_potongan_b} readOnly className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600" />
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
