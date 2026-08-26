import React, { useState, useEffect, useMemo } from 'react';
import usePackingOperations from '../../hooks/usePackingOperations';
import useStatuses from '../../hooks/useStatuses';
import {
  extractGroupedItemsFromPacking,
  generateBoxesFromGroupedItems,
} from '../../utils/packingBoxGenerator';

const PackingForm = ({ initialData = null, onSuccess, onCancel }) => {
  const { isUpdating, isCreating, updatePackingData, createPackingData } =
    usePackingOperations();
  const { packingStatuses, packingItemStatuses } = useStatuses();

  // Extract initial grouped items & start box number
  const [groupedItems, setGroupedItems] = useState([]);
  const [startBoxNum, setStartBoxNum] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Default status for created boxes
  const defaultBoxStatusId = useMemo(() => {
    return (
      packingItemStatuses?.[0]?.id ||
      packingStatuses?.[0]?.id ||
      initialData?.statusId ||
      initialData?.status?.id ||
      ''
    );
  }, [packingItemStatuses, packingStatuses, initialData]);

  // Sync state when initialData changes
  useEffect(() => {
    if (initialData) {
      const extracted = extractGroupedItemsFromPacking(initialData);
      setGroupedItems(extracted.items);
      setStartBoxNum(extracted.startBoxNum);
    } else {
      setGroupedItems([]);
      setStartBoxNum(1);
    }
  }, [initialData]);

  // Handle Qty change for an item
  const handleQtyChange = (index, value) => {
    const numericValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setGroupedItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        totalQty: numericValue,
      };
      return updated;
    });
    setErrorMessage('');
  };

  // Handle Qty Per Carton change
  const handleQtyPerCartonChange = (index, value) => {
    const numericValue = Math.max(1, parseInt(value, 10) || 1);
    setGroupedItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qtyPerCarton: numericValue,
      };
      return updated;
    });
  };

  // Compute preview for table (box ranges, total box count, etc.)
  const previewData = useMemo(() => {
    let currentBoxCounter = Number(startBoxNum) > 0 ? Number(startBoxNum) : 1;

    return groupedItems.map((item) => {
      const totalQty = Number(item.totalQty) || 0;
      const qtyPerCarton = Number(item.qtyPerCarton) > 0 ? Number(item.qtyPerCarton) : 1;

      const fullCartons = Math.floor(totalQty / qtyPerCarton);
      const remainderQty = totalQty % qtyPerCarton;
      const totalBoxCount = fullCartons + (remainderQty > 0 ? 1 : 0);

      let minBox = '-';
      let maxBox = '-';
      let keterangan = '-';

      if (totalBoxCount > 0) {
        minBox = currentBoxCounter;
        maxBox = currentBoxCounter + totalBoxCount - 1;
        
        if (fullCartons > 0 && remainderQty === 0) {
          keterangan = `Full carton ${minBox}/${maxBox}`;
        } else if (fullCartons > 0 && remainderQty > 0) {
          keterangan = `Full carton ${minBox}-${maxBox - 1}/${maxBox}, Partial: ${remainderQty} pcs`;
        } else {
          keterangan = `Partial carton - ${remainderQty}/${qtyPerCarton} pcs`;
        }

        currentBoxCounter += totalBoxCount;
      }

      return {
        ...item,
        fullCartons,
        remainderQty,
        totalBoxCount,
        minBox,
        maxBox,
        keteranganPreview: keterangan,
      };
    });
  }, [groupedItems, startBoxNum]);

  // Grand totals
  const grandTotalQty = previewData.reduce((acc, curr) => acc + (Number(curr.totalQty) || 0), 0);
  const grandTotalBoxes = previewData.reduce((acc, curr) => acc + curr.totalBoxCount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (previewData.some((item) => (Number(item.totalQty) || 0) <= 0)) {
      setErrorMessage('Qty untuk setiap barang harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Regenerate box array sequentially
      const generatedBoxes = generateBoxesFromGroupedItems(
        groupedItems,
        startBoxNum,
        defaultBoxStatusId
      );

      const payload = {
        tanggal_packing: initialData?.tanggal_packing || new Date().toISOString(),
        statusId: initialData?.statusId || initialData?.status?.id || defaultBoxStatusId,
        purchaseOrderId: initialData?.purchaseOrderId || '',
        packingBoxes: generatedBoxes,
      };

      if (initialData?.id) {
        await updatePackingData(initialData.id, payload);
      } else {
        await createPackingData(payload);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error updating packing:', error);
      setErrorMessage(error?.message || 'Gagal menyimpan perubahan packing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isUpdating || isCreating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
          {errorMessage}
        </div>
      )}

      {/* Start Box Number Setting */}
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
        <div className="text-xs text-gray-600">
          <span className="font-medium text-gray-800">Nomor Box Mulai Dari:</span>
          <span className="ml-1 text-gray-500">(Otomatis mengurutkan box & keterangan)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold">BOX-</span>
          <input
            type="number"
            min="1"
            value={startBoxNum}
            onChange={(e) => setStartBoxNum(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase border-r">No</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase border-r">Nama Barang</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-r">PLU</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-r">Qty Per Box</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-blue-700 uppercase border-r bg-blue-50">Jumlah Qty</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-r">Satuan</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-r">Box Dari</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase border-r">Box Sampai</th>
              <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Total Box</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewData.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-xs text-gray-500">
                  Tidak ada item ditemukan.
                </td>
              </tr>
            ) : (
              previewData.map((item, index) => (
                <tr key={item.itemId || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 border-r text-center">
                    {index + 1}.
                  </td>
                  <td className="px-3 py-2 whitespace-normal text-xs font-medium text-gray-900 border-r">
                    {item.nama_barang}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">
                    {item.plu}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center border-r">
                    <input
                      type="number"
                      min="1"
                      value={item.qtyPerCarton}
                      onChange={(e) => handleQtyPerCartonChange(index, e.target.value)}
                      className="w-20 px-2 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      disabled={isLoading}
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center border-r bg-blue-50/50">
                    <input
                      type="number"
                      min="0"
                      value={item.totalQty}
                      onChange={(e) => handleQtyChange(index, e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-bold text-center border border-blue-400 bg-white rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled={isLoading}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-500 border-r">
                    {item.satuan}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-600 font-semibold border-r">
                    {item.minBox}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center text-gray-600 font-semibold border-r">
                    {item.maxBox}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-center font-bold text-gray-900 bg-gray-50">
                    {item.totalBoxCount} Box
                  </td>
                </tr>
              ))
            )}

            {/* Summary Row */}
            {previewData.length > 0 && (
              <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                <td colSpan={4} className="px-3 py-2 text-xs text-right text-gray-700 border-r">
                  Grand Total
                </td>
                <td className="px-3 py-2 text-xs text-center text-blue-900 border-r font-bold bg-blue-100/50">
                  {grandTotalQty.toLocaleString()}
                </td>
                <td className="px-3 py-2 border-r"></td>
                <td className="px-3 py-2 border-r"></td>
                <td className="px-3 py-2 border-r"></td>
                <td className="px-3 py-2 text-xs text-center text-gray-900 font-bold bg-gray-200">
                  {grandTotalBoxes} Boxes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
          disabled={isLoading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-sm"
          disabled={isLoading || previewData.length === 0}
        >
          {isLoading ? 'Menyimpan...' : 'Update'}
        </button>
      </div>
    </form>
  );
};

export default PackingForm;
