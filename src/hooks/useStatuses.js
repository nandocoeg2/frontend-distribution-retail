import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import statusService from '../services/statusService';
import toastService from '../services/toastService';

const useStatuses = () => {
  const [allStatuses, setAllStatuses] = useState([]);
  const [purchaseOrderStatuses, setPurchaseOrderStatuses] = useState([]);
  const [bulkFileStatuses, setBulkFileStatuses] = useState([]);
  const [packingStatuses, setPackingStatuses] = useState([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [suratJalanStatuses, setSuratJalanStatuses] = useState([]);
  const [packingItemStatuses, setPackingItemStatuses] = useState([]);
  const [loading, setLoading] = useState({
    all: false,
    purchaseOrder: false,
    bulkFile: false,
    packing: false,
    invoice: false,
    suratJalan: false,
    packingItem: false
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Use refs to prevent multiple simultaneous calls
  const fetchingRefs = useRef({
    all: false,
    purchaseOrder: false,
    bulkFile: false,
    packing: false,
    invoice: false,
    suratJalan: false,
    packingItem: false
  });

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  // Fetch all statuses
  const fetchAllStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, all: true }));
      setError(null);
      const response = await statusService.getAllStatuses();
      setAllStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch all statuses');
      toastService.error('Failed to load all statuses');
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  }, [handleAuthError]);

  // Fetch purchase order statuses
  const fetchPurchaseOrderStatuses = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRefs.current.purchaseOrder) {
      return;
    }

    try {
      fetchingRefs.current.purchaseOrder = true;
      setLoading(prev => ({ ...prev, purchaseOrder: true }));
      setError(null);
      const response = await statusService.getPurchaseOrderStatuses();
      
      // Handle different response structures
      let statusData = [];
      if (Array.isArray(response)) {
        // If response is directly an array
        statusData = response;
      } else if (response && Array.isArray(response.data)) {
        // If response has data property with array
        statusData = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        // If response has success and data properties
        statusData = response.data;
      } else {
        statusData = [];
      }
      
      setPurchaseOrderStatuses(statusData);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch purchase order statuses');
      toastService.error('Failed to load purchase order statuses');
    } finally {
      setLoading(prev => ({ ...prev, purchaseOrder: false }));
      fetchingRefs.current.purchaseOrder = false;
    }
  }, [handleAuthError]);

  // Fetch bulk file statuses
  const fetchBulkFileStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, bulkFile: true }));
      setError(null);
      const response = await statusService.getBulkFileStatuses();
      setBulkFileStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch bulk file statuses');
      toastService.error('Failed to load bulk file statuses');
    } finally {
      setLoading(prev => ({ ...prev, bulkFile: false }));
    }
  }, [handleAuthError]);

  // Fetch packing statuses
  const fetchPackingStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, packing: true }));
      setError(null);
      const response = await statusService.getPackingStatuses();
      setPackingStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch packing statuses');
      toastService.error('Failed to load packing statuses');
    } finally {
      setLoading(prev => ({ ...prev, packing: false }));
    }
  }, [handleAuthError]);

  // Fetch invoice statuses
  const fetchInvoiceStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, invoice: true }));
      setError(null);
      const response = await statusService.getInvoiceStatuses();
      setInvoiceStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch invoice statuses');
      toastService.error('Failed to load invoice statuses');
    } finally {
      setLoading(prev => ({ ...prev, invoice: false }));
    }
  }, [handleAuthError]);

  // Fetch surat jalan statuses
  const fetchSuratJalanStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, suratJalan: true }));
      setError(null);
      const response = await statusService.getSuratJalanStatuses();
      setSuratJalanStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch surat jalan statuses');
      toastService.error('Failed to load surat jalan statuses');
    } finally {
      setLoading(prev => ({ ...prev, suratJalan: false }));
    }
  }, [handleAuthError]);

  // Fetch packing item statuses
  const fetchPackingItemStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, packingItem: true }));
      setError(null);
      const response = await statusService.getPackingItemStatuses();
      setPackingItemStatuses(response.data || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch packing item statuses');
      toastService.error('Failed to load packing item statuses');
    } finally {
      setLoading(prev => ({ ...prev, packingItem: false }));
    }
  }, [handleAuthError]);

  // Helper function to get status by ID from any status type
  const getStatusById = useCallback((statusId, statusType = 'all') => {
    let statusArray = [];
    
    switch (statusType) {
      case 'purchaseOrder':
        statusArray = purchaseOrderStatuses;
        break;
      case 'bulkFile':
        statusArray = bulkFileStatuses;
        break;
      case 'packing':
        statusArray = packingStatuses;
        break;
      case 'invoice':
        statusArray = invoiceStatuses;
        break;
      case 'suratJalan':
        statusArray = suratJalanStatuses;
        break;
      case 'packingItem':
        statusArray = packingItemStatuses;
        break;
      default:
        statusArray = allStatuses;
        break;
    }
    
    return statusArray.find(status => status.id === statusId);
  }, [allStatuses, purchaseOrderStatuses, bulkFileStatuses, packingStatuses, invoiceStatuses, suratJalanStatuses, packingItemStatuses]);

  // Helper function to get status by code from any status type
  const getStatusByCode = useCallback((statusCode, statusType = 'all') => {
    let statusArray = [];
    
    switch (statusType) {
      case 'purchaseOrder':
        statusArray = purchaseOrderStatuses;
        break;
      case 'bulkFile':
        statusArray = bulkFileStatuses;
        break;
      case 'packing':
        statusArray = packingStatuses;
        break;
      case 'invoice':
        statusArray = invoiceStatuses;
        break;
      case 'suratJalan':
        statusArray = suratJalanStatuses;
        break;
      case 'packingItem':
        statusArray = packingItemStatuses;
        break;
      default:
        statusArray = allStatuses;
        break;
    }
    
    return statusArray.find(status => status.status_code === statusCode);
  }, [allStatuses, purchaseOrderStatuses, bulkFileStatuses, packingStatuses, invoiceStatuses, suratJalanStatuses, packingItemStatuses]);


  return {
    // Status data
    allStatuses,
    purchaseOrderStatuses,
    bulkFileStatuses,
    packingStatuses,
    invoiceStatuses,
    suratJalanStatuses,
    packingItemStatuses,
    
    // Loading states
    loading,
    error,
    
    // Fetch functions
    fetchAllStatuses,
    fetchPurchaseOrderStatuses,
    fetchBulkFileStatuses,
    fetchPackingStatuses,
    fetchInvoiceStatuses,
    fetchSuratJalanStatuses,
    fetchPackingItemStatuses,
    
    // Helper functions
    getStatusById,
    getStatusByCode,
    
    // Auth error handler
    handleAuthError
  };
};

export default useStatuses;