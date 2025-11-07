import { useState, useEffect } from 'react';
import useStatuses from './useStatuses';
import useItemsLookup from './useItemsLookup';

const usePackingForm = (initialData = null) => {
  const [formData, setFormData] = useState({
    tanggal_packing: '',
    statusId: '',
    purchaseOrderId: '',
    packingBoxes: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dependencies
  const {
    packingStatuses,
    loading: statusLoadingObj,
    fetchPackingStatuses,
  } = useStatuses();
  
  // Extract specific loading state for packing (statusLoadingObj is an object)
  const statusLoading = statusLoadingObj?.packing || false;
  const { items, loading: itemsLoading } = useItemsLookup();

  // Load packing statuses on mount
  useEffect(() => {
    fetchPackingStatuses();
  }, [fetchPackingStatuses]);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggal_packing: initialData.tanggal_packing
          ? new Date(initialData.tanggal_packing).toISOString().split('T')[0]
          : '',
        statusId: initialData.statusId || '',
        purchaseOrderId: initialData.purchaseOrderId || '',
        packingBoxes: initialData.packingBoxes || [],
      });
    }
  }, [initialData]);

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
    setFormData((prev) => ({
      ...prev,
      packingBoxes: [
        ...prev.packingBoxes,
        {
          no_box: '',
          statusId: '',
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

    // Validate tanggal_packing
    if (!formData.tanggal_packing) {
      newErrors.tanggal_packing = 'Tanggal packing harus diisi';
    }

    // Validate statusId
    if (!formData.statusId) {
      newErrors.statusId = 'Status harus dipilih';
    }

    // Validate purchaseOrderId
    if (!formData.purchaseOrderId) {
      newErrors.purchaseOrderId = 'Purchase Order harus dipilih';
    }

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
    return {
      ...formData,
      tanggal_packing: new Date(formData.tanggal_packing).toISOString(),
      packingBoxes: formData.packingBoxes.map((box) => ({
        ...box,
        packingBoxItems: box.packingBoxItems.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity),
        })),
      })),
    };
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    packingStatuses,
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
