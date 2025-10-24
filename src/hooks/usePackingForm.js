import { useState, useEffect } from 'react';
import useStatuses from './useStatuses';
import useInventories from './useInventories';

const usePackingForm = (initialData = null) => {
  const [formData, setFormData] = useState({
    tanggal_packing: '',
    statusId: '',
    purchaseOrderId: '',
    packingItems: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dependencies
  const { packingStatuses, loading: statusLoading, fetchPackingStatuses } = useStatuses();
  const { inventories, loading: inventoryLoading } = useInventories();

  // Load packing statuses on mount
  useEffect(() => {
    fetchPackingStatuses();
  }, [fetchPackingStatuses]);

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggal_packing: initialData.tanggal_packing ? new Date(initialData.tanggal_packing).toISOString().split('T')[0] : '',
        statusId: initialData.statusId || '',
        purchaseOrderId: initialData.purchaseOrderId || '',
        packingItems: initialData.packingItems || []
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addPackingItem = () => {
    setFormData(prev => ({
      ...prev,
      packingItems: [
        ...prev.packingItems,
        {
          nama_barang: '',
          total_qty: '',
          jumlah_carton: '',
          isi_per_carton: '',
          no_box: '',
          inventoryId: ''
        }
      ]
    }));
  };

  const updatePackingItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      packingItems: prev.packingItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removePackingItem = (index) => {
    setFormData(prev => ({
      ...prev,
      packingItems: prev.packingItems.filter((_, i) => i !== index)
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

    // Validate packingItems
    if (!formData.packingItems || formData.packingItems.length === 0) {
      newErrors.packingItems = 'Minimal satu item packing harus ditambahkan';
    } else {
      formData.packingItems.forEach((item, index) => {
        if (!item.nama_barang) {
          newErrors[`packingItems.${index}.nama_barang`] = 'Nama barang harus diisi';
        }
        if (!item.total_qty || item.total_qty <= 0) {
          newErrors[`packingItems.${index}.total_qty`] = 'Total qty harus lebih dari 0';
        }
        if (!item.jumlah_carton || item.jumlah_carton <= 0) {
          newErrors[`packingItems.${index}.jumlah_carton`] = 'Jumlah carton harus lebih dari 0';
        }
        if (!item.isi_per_carton || item.isi_per_carton <= 0) {
          newErrors[`packingItems.${index}.isi_per_carton`] = 'Isi per carton harus lebih dari 0';
        }
        if (!item.no_box) {
          newErrors[`packingItems.${index}.no_box`] = 'No box harus diisi';
        }
        if (!item.inventoryId) {
          newErrors[`packingItems.${index}.inventoryId`] = 'Inventory harus dipilih';
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
      packingItems: []
    });
    setErrors({});
  };

  const getFormattedData = () => {
    return {
      ...formData,
      tanggal_packing: new Date(formData.tanggal_packing).toISOString(),
      packingItems: formData.packingItems.map(item => ({
        ...item,
        total_qty: parseInt(item.total_qty),
        jumlah_carton: parseInt(item.jumlah_carton),
        isi_per_carton: parseInt(item.isi_per_carton)
      }))
    };
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    packingStatuses,
    inventories,
    statusLoading,
    inventoryLoading,
    handleInputChange,
    addPackingItem,
    updatePackingItem,
    removePackingItem,
    validateForm,
    resetForm,
    getFormattedData
  };
};

export default usePackingForm;
