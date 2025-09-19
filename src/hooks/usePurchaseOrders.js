import { useState, useEffect, useCallback } from 'react';
import purchaseOrderService from '../services/purchaseOrderService';
import toastService from '../services/toastService';

const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseOrderService.getAllPurchaseOrders(1, 1000); // Get all purchase orders
      console.log('Purchase Orders API Response:', response); // Debug log
      
      if (response && response.success && response.data) {
        // Handle API response structure: { success: true, data: { data: [...], pagination: {...} } }
        const purchaseOrdersData = Array.isArray(response.data.data) ? response.data.data : [];
        setPurchaseOrders(purchaseOrdersData);
      } else if (response && Array.isArray(response.data)) {
        // Handle direct array response
        setPurchaseOrders(response.data);
      } else {
        setPurchaseOrders([]);
      }
    } catch (err) {
      const errorMessage = err.message || 'Gagal mengambil data purchase orders';
      setError(errorMessage);
      toastService.error(errorMessage);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    refetch: fetchPurchaseOrders
  };
};

export default usePurchaseOrders;