/**
 * Helper utilities for accessing Surat Jalan data with the new packingBoxes structure
 * 
 * MIGRATION NOTE (Nov 9, 2025):
 * Backend has removed suratJalanDetails table. Data now comes from packingBoxes (single source of truth).
 * These helpers provide consistent access patterns for both new and transitional data.
 */

/**
 * Get packing boxes from a surat jalan
 * @param {Object} suratJalan - Surat jalan object
 * @returns {Array} Array of packing boxes
 */
export const getPackingBoxes = (suratJalan) => {
  if (!suratJalan) return [];
  
  // New structure: purchaseOrder.packing.packingBoxes
  const packingBoxes = suratJalan?.purchaseOrder?.packing?.packingBoxes;
  
  if (Array.isArray(packingBoxes) && packingBoxes.length > 0) {
    return packingBoxes;
  }
  
  return [];
};

/**
 * Get all items from all boxes in a surat jalan
 * @param {Object} suratJalan - Surat jalan object
 * @returns {Array} Array of items with box_no attached
 */
export const getAllItems = (suratJalan) => {
  const boxes = getPackingBoxes(suratJalan);
  
  return boxes.flatMap(box => 
    (box.packingBoxItems || []).map(item => ({
      ...item,
      box_no: box.no_box,
      plu: item.item?.plu || item.PLU, // Support both new and old structure
    }))
  );
};

/**
 * Group items by name across all boxes
 * @param {Object} suratJalan - Surat jalan object
 * @returns {Array} Array of grouped items with totals
 */
export const groupItemsByName = (suratJalan) => {
  const items = getAllItems(suratJalan);
  const grouped = new Map();
  
  items.forEach(item => {
    const key = item.nama_barang;
    if (!grouped.has(key)) {
      grouped.set(key, {
        nama_barang: item.nama_barang,
        itemId: item.itemId,
        plu: item.plu || item.item?.plu,
        total_quantity: 0,
        boxes: [],
      });
    }
    
    const group = grouped.get(key);
    group.total_quantity += item.quantity || 0;
    if (!group.boxes.includes(item.box_no)) {
      group.boxes.push(item.box_no);
    }
  });
  
  return Array.from(grouped.values());
};

/**
 * Get totals for a surat jalan (boxes and quantity)
 * @param {Object} suratJalan - Surat jalan object
 * @returns {Object} Object with totalBoxes and totalQuantity
 */
export const getTotals = (suratJalan) => {
  const packingBoxes = getPackingBoxes(suratJalan);
  
  const totalBoxes = packingBoxes.length;
  const totalItems = packingBoxes.reduce(
    (sum, box) => sum + (box.packingBoxItems?.length || 0), 
    0
  );
  const totalQuantity = packingBoxes.reduce(
    (sum, box) => sum + (box.total_quantity_in_box || 0),
    0
  );
  
  return { totalBoxes, totalItems, totalQuantity };
};

/**
 * Get totals grouped by destination for multiple surat jalan
 * @param {Array} suratJalanList - Array of surat jalan objects
 * @returns {Map} Map of destination to totals
 */
export const getTotalsByDestination = (suratJalanList) => {
  const map = new Map();
  
  suratJalanList.forEach(sj => {
    const destination = sj.deliver_to || 'Unknown';
    const boxes = getPackingBoxes(sj);
    
    if (!map.has(destination)) {
      map.set(destination, { boxCount: 0, quantity: 0 });
    }
    
    const totals = map.get(destination);
    totals.boxCount += boxes.length;
    totals.quantity += boxes.reduce(
      (sum, box) => sum + (box.total_quantity_in_box || 0),
      0
    );
  });
  
  return map;
};

/**
 * Search for an item in surat jalan by term (itemId, PLU, or name)
 * @param {Object} suratJalan - Surat jalan object
 * @param {string} searchTerm - Search term
 * @returns {Object|null} Found item with box info or null
 */
export const searchItem = (suratJalan, searchTerm) => {
  if (!searchTerm) return null;
  
  const packingBoxes = getPackingBoxes(suratJalan);
  const lowerSearch = searchTerm.toLowerCase();
  
  for (const box of packingBoxes) {
    const found = box.packingBoxItems?.find(
      item => 
        item.itemId === searchTerm ||
        item.item?.plu === searchTerm ||
        item.PLU === searchTerm ||
        item.nama_barang?.toLowerCase().includes(lowerSearch)
    );
    
    if (found) {
      return { 
        ...found, 
        box_no: box.no_box,
        plu: found.item?.plu || found.PLU,
      };
    }
  }
  
  return null;
};

// Note: getSuratJalanDetailsLegacy removed - backend no longer has suratJalanDetails (Nov 9, 2025)

/**
 * Check if surat jalan has any box data
 * @param {Object} suratJalan - Surat jalan object
 * @returns {boolean} True if has boxes
 */
export const hasBoxData = (suratJalan) => {
  const boxes = getPackingBoxes(suratJalan);
  return boxes.length > 0;
};

/**
 * Format box summary text
 * @param {Object} suratJalan - Surat jalan object
 * @returns {string} Summary text
 */
export const formatBoxSummary = (suratJalan) => {
  const { totalBoxes, totalItems, totalQuantity } = getTotals(suratJalan);
  
  const parts = [];
  if (totalBoxes > 0) parts.push(`${totalBoxes} Box${totalBoxes > 1 ? 'es' : ''}`);
  if (totalItems > 0) parts.push(`${totalItems} Item${totalItems > 1 ? 's' : ''}`);
  if (totalQuantity > 0) parts.push(`${totalQuantity} Qty`);
  
  return parts.join(' • ') || 'No data';
};
