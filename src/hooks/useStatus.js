import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const useStatus = (fetchFunction, entityName) => {
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
      const data = await fetchFunction();
      setStatuses(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        handleAuthError();
        return;
      }
      const errorMessage = err.message || `Failed to fetch ${entityName} statuses`;
      setError(errorMessage);
      toastService.error(`Failed to load ${entityName} statuses`);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, entityName, handleAuthError]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return { statuses, loading, error, refetch: fetchStatuses };
};

export default useStatus;
