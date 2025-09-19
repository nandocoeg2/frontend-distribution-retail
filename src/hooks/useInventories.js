import { useState, useEffect, useCallback } from 'react';
import { getInventories } from '../services/inventoryService';
import toastService from '../services/toastService';

const useInventories = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInventories(1, 1000); // Get all inventories
      console.log('Inventories API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const inventoriesData = Array.isArray(response.data.data) ? response.data.data : [];
        setInventories(inventoriesData);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setInventories(response.data);
      } else {
        setInventories([]);
      }
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengambil data inventories';
      setError(errorMessage);
      toastService.error(errorMessage);
      setInventories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  return {
    inventories,
    loading,
    error,
    refetch: fetchInventories
  };
};

export default useInventories;
