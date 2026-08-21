import { useState, useEffect } from 'react';
import useStatuses from './useStatuses';
import useItemsLookup from './useItemsLookup';

const mapInitialBoxes = (boxesData, itemsList = []) => {
  if (!Array.isArray(boxesData)) return [];
  return boxesData.map((box) => ({
    id: box.id,
    no_box: box.no_box || '',
    statusId: box.statusId || box.status?.id || '',
    status: box.status || null,
    packingBoxItems: Array.isArray(box.packingBoxItems)
      ? box.packingBoxItems.map((item) => {
          let resolvedItemId = item.itemId || item.item?.id || '';
          const nama = item.nama_barang || item.item?.nama_barang || '';
          if (!resolvedItemId && nama && Array.isArray(itemsList) && itemsList.length > 0) {
            const trimmedNama = nama.trim().toLowerCase();
            const matched = itemsList.find(
              (it) =>
                (it.nama_barang && it.nama_barang.trim().toLowerCase() === trimmedNama) ||
                (it.plu && it.plu.trim().toLowerCase() === trimmedNama)
            );
            if (matched) resolvedItemId = matched.id;
          }
          return {
            id: item.id,
            nama_barang: nama,
            quantity: item.quantity ?? '',
            itemId: resolvedItemId,
            keterangan: item.keterangan || '',
          };
        })
      : [],
  }));
};

const usePackingForm = (initialData = null) => {
  // Load dependencies
  const {
    packingStatuses,
    packingItemStatuses,
    loading: statusLoadingObj,
    fetchPackingStatuses,
    fetchPackingItemStatuses,
  } = useStatuses();
  
  // Extract specific loading state for packing and packing item
  const statusLoading =
    statusLoadingObj?.packing || statusLoadingObj?.packingItem || false;
  const { items, loading: itemsLoading } = useItemsLookup();

  const [formData, setFormData] = useState(() => {
    if (!initialData) {
      return {
        tanggal_packing: '',
        statusId: '',
        purchaseOrderId: '',
        packingBoxes: [],
      };
    }
    return {
      tanggal_packing: initialData.tanggal_packing
        ? new Date(initialData.tanggal_packing).toISOString().split('T')[0]
        : '',
      statusId: initialData.statusId || initialData.status?.id || '',
      purchaseOrderId: initialData.purchaseOrderId || '',
      packingBoxes: mapInitialBoxes(initialData.packingBoxes, items),
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load packing and packing item statuses on mount
  useEffect(() => {
    if (typeof fetchPackingStatuses === 'function') fetchPackingStatuses();
    if (typeof fetchPackingItemStatuses === 'function') fetchPackingItemStatuses();
  }, []);

  // Determine box statuses (category 'Packing Detail Item' is used for packing boxes)
  const boxStatuses =
    Array.isArray(packingItemStatuses) && packingItemStatuses.length > 0
      ? packingItemStatuses
      : packingStatuses;

  // Initialize/sync form when initialData changes
  useEffect(() => {
    if (!initialData) return;
    setFormData({
      tanggal_packing: initialData.tanggal_packing
        ? new Date(initialData.tanggal_packing).toISOString().split('T')[0]
        : '',
      statusId: initialData.statusId || initialData.status?.id || '',
      purchaseOrderId: initialData.purchaseOrderId || '',
      packingBoxes: mapInitialBoxes(initialData.packingBoxes, items),
    });
  }, [initialData?.id]);

  // Auto-resolve missing itemId in box items when items lookup is available
  useEffect(() => {
    if (!items || items.length === 0) return;

    setFormData((prev) => {
      let hasChanges = false;
      const updatedBoxes = prev.packingBoxes.map((box) => {
        let boxChanged = false;
        const updatedItems = (box.packingBoxItems || []).map((item) => {
          if (!item.itemId && item.nama_barang) {
            const trimmedNama = item.nama_barang.trim().toLowerCase();
            const matchedItem = items.find(
              (it) =>
                (it.nama_barang &&
                  it.nama_barang.trim().toLowerCase() === trimmedNama) ||
                (it.plu && it.plu.trim().toLowerCase() === trimmedNama)
            );
            if (matchedItem) {
              boxChanged = true;
              return { ...item, itemId: matchedItem.id };
            }
          }
          return item;
        });

        if (boxChanged) {
          hasChanges = true;
          return { ...box, packingBoxItems: updatedItems };
        }
        return box;
      });

      return hasChanges ? { ...prev, packingBoxes: updatedBoxes } : prev;
    });
  }, [items?.length]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const addPackingBox = () => {
    const defaultStatusId =
      packingItemStatuses?.[0]?.id || packingStatuses?.[0]?.id || '';
    setFormData((prev) => ({
      ...prev,
      packingBoxes: [
        ...prev.packingBoxes,
        {
          no_box: '',
          statusId: defaultStatusId,
          packingBoxItems: [
            {
              nama_barang: '',
              quantity: '',
              itemId: '',
              keterangan: '',
            },
          ],
        },
      ],
    }));
  };

  const updatePackingBox = (boxIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      packingBoxes: prev.packingBoxes.map((box, i) =>
        i === boxIndex ? { ...box, [field]: value } : box
      ),
    }));
  };

  const addItemToBox = (boxIndex) => {
    setFormData((prev) => ({
      ...prev,
      packingBoxes: prev.packingBoxes.map((box, i) =>
        i === boxIndex
          ? {
              ...box,
              packingBoxItems: [
                ...box.packingBoxItems,
                {
                  nama_barang: '',
                  quantity: '',
                  itemId: '',
                  keterangan: '',
                },
              ],
            }
          : box
      ),
    }));
  };

  const updateBoxItem = (boxIndex, itemIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      packingBoxes: prev.packingBoxes.map((box, i) =>
        i === boxIndex
          ? {
              ...box,
              packingBoxItems: box.packingBoxItems.map((item, j) =>
                j === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : box
      ),
    }));
  };

  const removeBoxItem = (boxIndex, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      packingBoxes: prev.packingBoxes.map((box, i) =>
        i === boxIndex
          ? {
              ...box,
              packingBoxItems: box.packingBoxItems.filter(
                (_, j) => j !== itemIndex
              ),
            }
          : box
      ),
    }));
  };

  const removePackingBox = (index) => {
    setFormData((prev) => ({
      ...prev,
      packingBoxes: prev.packingBoxes.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate packingBoxes
    if (!formData.packingBoxes || formData.packingBoxes.length === 0) {
      newErrors.packingBoxes = 'Minimal satu box packing harus ditambahkan';
    } else {
      formData.packingBoxes.forEach((box, boxIndex) => {
        if (!box.no_box) {
          newErrors[`packingBoxes.${boxIndex}.no_box`] =
            'Nomor box harus diisi';
        }

        if (!box.packingBoxItems || box.packingBoxItems.length === 0) {
          newErrors[`packingBoxes.${boxIndex}.items`] =
            'Minimal satu item per box';
        } else {
          box.packingBoxItems.forEach((item, itemIndex) => {
            if (!item.nama_barang) {
              newErrors[
                `packingBoxes.${boxIndex}.items.${itemIndex}.nama_barang`
              ] = 'Nama barang harus diisi';
            }
            if (!item.quantity || item.quantity <= 0) {
              newErrors[
                `packingBoxes.${boxIndex}.items.${itemIndex}.quantity`
              ] = 'Quantity harus lebih dari 0';
            }
            if (!item.itemId) {
              newErrors[
                `packingBoxes.${boxIndex}.items.${itemIndex}.itemId`
              ] = 'Item harus dipilih';
            }
          });
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      tanggal_packing: '',
      statusId: '',
      purchaseOrderId: '',
      packingBoxes: [],
    });
    setErrors({});
  };

  const getFormattedData = () => {
    const data = {
      packingBoxes: formData.packingBoxes.map((box) => ({
        ...(box.id ? { id: box.id } : {}),
        no_box: box.no_box,
        statusId: box.statusId || undefined,
        packingBoxItems: box.packingBoxItems.map((item) => ({
          ...(item.id ? { id: item.id } : {}),
          itemId: item.itemId,
          nama_barang: item.nama_barang,
          quantity: parseInt(item.quantity, 10),
          keterangan: item.keterangan || '',
        })),
      })),
    };

    if (formData.tanggal_packing) {
      data.tanggal_packing = new Date(formData.tanggal_packing).toISOString();
    }
    if (formData.statusId) {
      data.statusId = formData.statusId;
    }
    if (formData.purchaseOrderId) {
      data.purchaseOrderId = formData.purchaseOrderId;
    }

    return data;
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    boxStatuses,
    packingStatuses,
    packingItemStatuses,
    items,
    statusLoading,
    itemsLoading,
    handleInputChange,
    addPackingBox,
    updatePackingBox,
    addItemToBox,
    updateBoxItem,
    removeBoxItem,
    removePackingBox,
    validateForm,
    resetForm,
    getFormattedData,
  };
};

export default usePackingForm;
