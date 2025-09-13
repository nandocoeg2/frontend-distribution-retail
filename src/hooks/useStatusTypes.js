import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import statusService from '../services/statusService';
import toastService from '../services/toastService';

/**
 * Hook for managing purchase order statuses
 */
export const usePurchaseOrderStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getPurchaseOrderStatuses();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch purchase order statuses');
      toastService.error('Failed to load purchase order statuses');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};

/**
 * Hook for managing packing statuses
 */
export const usePackingStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getPackingStatuses();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch packing statuses');
      toastService.error('Failed to load packing statuses');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};

/**
 * Hook for managing invoice statuses
 */
export const useInvoiceStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getInvoiceStatuses();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch invoice statuses');
      toastService.error('Failed to load invoice statuses');
    } finally {
      setLoading(false);
    }
  }, [fetchStatuses]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};

/**
 * Hook for managing surat jalan statuses
 */
export const useSuratJalanStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getSuratJalanStatuses();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch surat jalan statuses');
      toastService.error('Failed to load surat jalan statuses');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};

/**
 * Hook for managing bulk file statuses
 */
export const useBulkFileStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statusService.getBulkFileStatuses();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      setError(err.message || 'Failed to fetch bulk file statuses');
      toastService.error('Failed to load bulk file statuses');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};