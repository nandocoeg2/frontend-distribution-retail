/**
 * Utility to group packing items and regenerate packingBoxes sequentially
 */

/**
 * Extract distinct items from initial packing data
 */
export const extractGroupedItemsFromPacking = (initialData) => {
  if (!initialData) return { startBoxNum: 1, items: [] };

  const boxes = initialData.packingBoxes || [];
  
  // Always default start box number to 1 for standard sequential packing
  let minStartBox = 1;

  // Extract from existing packing boxes
  const itemsMap = new Map();

  boxes.forEach((box) => {
    const boxNumMatch = String(box.no_box).match(/\d+/);
    const boxNum = boxNumMatch ? parseInt(boxNumMatch[0], 10) : null;

    (box.packingBoxItems || []).forEach((bi) => {
      const itemId = bi.itemId || bi.item?.id;
      const key = itemId || bi.nama_barang;

      if (!itemsMap.has(key)) {
        const qtyPerCarton =
          bi.item?.itemStock?.qty_per_carton ||
          bi.item?.qty_per_carton ||
          (bi.quantity > 0 ? bi.quantity : 1);

        itemsMap.set(key, {
          itemId: itemId || '',
          nama_barang: bi.nama_barang || bi.item?.nama_barang || '',
          plu: bi.item?.plu || bi.plu || '-',
          satuan: bi.item?.itemStock?.uom || bi.item?.uom || bi.satuan || 'PCS',
          qtyPerCarton: qtyPerCarton || 250,
          totalQty: 0,
          statusId: box.statusId || '',
          boxes: [],
        });
      }

      const itemObj = itemsMap.get(key);
      itemObj.totalQty += Number(bi.quantity) || 0;
      if (boxNum !== null) {
        itemObj.boxes.push(boxNum);
      }
    });
  });

  // Preserve order by lowest box number
  const itemsArray = Array.from(itemsMap.values()).sort((a, b) => {
    const minA = a.boxes.length > 0 ? Math.min(...a.boxes) : 999999;
    const minB = b.boxes.length > 0 ? Math.min(...b.boxes) : 999999;
    return minA - minB;
  });

  return {
    startBoxNum: minStartBox > 0 ? minStartBox : 1,
    items: itemsArray,
  };
};

/**
 * Regenerates packing boxes array from item summaries and start box number
 */
export const generateBoxesFromGroupedItems = (items, startBoxNum = 1, defaultStatusId = '') => {
  const newBoxes = [];
  let currentBoxCounter = Number(startBoxNum) > 0 ? Number(startBoxNum) : 1;

  items.forEach((item) => {
    const totalQty = Math.max(0, Number(item.totalQty) || 0);
    const qtyPerCarton = Number(item.qtyPerCarton) > 0 ? Number(item.qtyPerCarton) : 1;

    const fullCartons = Math.floor(totalQty / qtyPerCarton);
    const remainderQty = totalQty % qtyPerCarton;
    const totalCartonsForItem = fullCartons + (remainderQty > 0 ? 1 : 0);

    // Full carton boxes
    for (let i = 0; i < fullCartons; i++) {
      newBoxes.push({
        no_box: `BOX-${String(currentBoxCounter).padStart(3, '0')}`,
        statusId: item.statusId || defaultStatusId,
        packingBoxItems: [
          {
            itemId: item.itemId,
            nama_barang: item.nama_barang,
            quantity: qtyPerCarton,
            keterangan: `Full carton ${i + 1}/${totalCartonsForItem}`,
          },
        ],
      });
      currentBoxCounter++;
    }

    // Remainder carton box (if any)
    if (remainderQty > 0) {
      newBoxes.push({
        no_box: `BOX-${String(currentBoxCounter).padStart(3, '0')}`,
        statusId: item.statusId || defaultStatusId,
        packingBoxItems: [
          {
            itemId: item.itemId,
            nama_barang: item.nama_barang,
            quantity: remainderQty,
            keterangan: `Partial carton - ${remainderQty}/${qtyPerCarton} pcs`,
          },
        ],
      });
      currentBoxCounter++;
    }
  });

  return newBoxes;
};
