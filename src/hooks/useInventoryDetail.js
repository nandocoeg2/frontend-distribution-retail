import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getInventoryById, deleteInventory } from '../services/inventoryService';

const useInventoryDetail = (inventoryId) => {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const loadInventory = useCallback(async () => {
    if (!inventoryId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getInventoryById(inventoryId);
      
      if (response.success) {
        setInventory(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to load inventory');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load inventory');
      }
    } finally {
      setLoading(false);
    }
  }, [inventoryId, handleAuthError]);

  const handleDelete = async () => {
    if (!inventoryId) return;

    try {
      setDeleteLoading(true);
      await deleteInventory(inventoryId);
      toastService.success('Inventory item deleted successfully');
      return true;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete inventory');
      }
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const refreshInventory = useCallback(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    inventory,
    setInventory,
    loading,
    error,
    setError,
    deleteLoading,
    handleDelete,
    refreshInventory,
    loadInventory
  };
};

export default useInventoryDetail;
