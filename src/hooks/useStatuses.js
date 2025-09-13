import { useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState({
    all: false,
    purchaseOrder: false,
    bulkFile: false,
    packing: false,
    invoice: false,
    suratJalan: false
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      const data = await statusService.getAllStatuses();
      setAllStatuses(data);
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
    try {
      setLoading(prev => ({ ...prev, purchaseOrder: true }));
      setError(null);
      const data = await statusService.getPurchaseOrderStatuses();
      setPurchaseOrderStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch purchase order statuses');
      toastService.error('Failed to load purchase order statuses');
    } finally {
      setLoading(prev => ({ ...prev, purchaseOrder: false }));
    }
  }, [handleAuthError]);

  // Fetch bulk file statuses
  const fetchBulkFileStatuses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, bulkFile: true }));
      setError(null);
      const data = await statusService.getBulkFileStatuses();
      setBulkFileStatuses(data);
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
      const data = await statusService.getPackingStatuses();
      setPackingStatuses(data);
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
      const data = await statusService.getInvoiceStatuses();
      setInvoiceStatuses(data);
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
      const data = await statusService.getSuratJalanStatuses();
      setSuratJalanStatuses(data);
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
      default:
        statusArray = allStatuses;
        break;
    }
    
    return statusArray.find(status => status.id === statusId);
  }, [allStatuses, purchaseOrderStatuses, bulkFileStatuses, packingStatuses, invoiceStatuses, suratJalanStatuses]);

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
      default:
        statusArray = allStatuses;
        break;
    }
    
    return statusArray.find(status => status.status_code === statusCode);
  }, [allStatuses, purchaseOrderStatuses, bulkFileStatuses, packingStatuses, invoiceStatuses, suratJalanStatuses]);

  return {
    // Status data
    allStatuses,
    purchaseOrderStatuses,
    bulkFileStatuses,
    packingStatuses,
    invoiceStatuses,
    suratJalanStatuses,
    
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
    
    // Helper functions
    getStatusById,
    getStatusByCode,
    
    // Auth error handler
    handleAuthError
  };
};

export default useStatuses;