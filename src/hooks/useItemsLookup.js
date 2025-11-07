import { useState, useEffect, useCallback } from 'react';
import { getItems } from '../services/itemService';
import toastService from '../services/toastService';

const useItemsLookup = (page = 1, limit = 50) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getItems(page, limit);

      if (response?.success && Array.isArray(response?.data?.data)) {
        setItems(response.data.data);
        return;
      }

      if (Array.isArray(response?.data)) {
        setItems(response.data);
        return;
      }

      if (Array.isArray(response)) {
        setItems(response);
        return;
      }

      setItems([]);
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengambil data item';
      setError(errorMessage);
      toastService.error(errorMessage);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
  };
};

export default useItemsLookup;
