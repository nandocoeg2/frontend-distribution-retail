import { useState } from 'react';
import { 
  createPacking, 
  updatePacking, 
  deletePacking 
} from '../services/packingService';
import toastService from '../services/toastService';

const usePackingOperations = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createPackingData = async (packingData) => {
    setIsCreating(true);
    try {
      const response = await createPacking(packingData);
      toastService.success('Packing berhasil dibuat');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Gagal membuat packing';
      toastService.error(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const updatePackingData = async (id, packingData) => {
    setIsUpdating(true);
    try {
      const response = await updatePacking(id, packingData);
      toastService.success('Packing berhasil diperbarui');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Gagal memperbarui packing';
      toastService.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deletePackingData = async (id) => {
    setIsDeleting(true);
    try {
      await deletePacking(id);
      toastService.success('Packing berhasil dihapus');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Gagal menghapus packing';
      toastService.error(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isCreating,
    isUpdating,
    isDeleting,
    createPackingData,
    updatePackingData,
    deletePackingData
  };
};

export default usePackingOperations;
