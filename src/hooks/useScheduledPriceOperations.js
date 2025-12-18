import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import scheduledPriceService from '../services/scheduledPriceService';

const useScheduledPriceOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createSchedule = useCallback(async (scheduleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduledPriceService.createSchedule(scheduleData);

      if (response.success) {
        toastService.success('Schedule created successfully');
        return response.data;
      } else {
        // Handle validation errors with issues array
        if (response.issues && Array.isArray(response.issues)) {
          const errorMessages = response.issues.map(issue => issue.message).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(response.error?.message || response.error || 'Failed to create schedule');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        const errorMessage = err.message || 'Failed to create schedule';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateSchedule = useCallback(async (id, scheduleData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduledPriceService.updateSchedule(id, scheduleData);

      if (response.success) {
        toastService.success('Schedule updated successfully');
        return response.data;
      } else {
        // Handle validation errors with issues array
        if (response.issues && Array.isArray(response.issues)) {
          const errorMessages = response.issues.map(issue => issue.message).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(response.error?.message || response.error || 'Failed to update schedule');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        const errorMessage = err.message || 'Failed to update schedule';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteSchedule = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await scheduledPriceService.deleteSchedule(id);
      toastService.success('Schedule deleted successfully');
      return true;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete schedule');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const cancelSchedule = useCallback(async (id, reason) => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduledPriceService.cancelSchedule(id, reason);

      if (response.success) {
        toastService.success('Schedule cancelled successfully');
        return response.data;
      } else {
        // Handle validation errors with issues array
        if (response.issues && Array.isArray(response.issues)) {
          const errorMessages = response.issues.map(issue => issue.message).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(response.error?.message || response.error || 'Failed to cancel schedule');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        const errorMessage = err.message || 'Failed to cancel schedule';
        setError(errorMessage);
        toastService.error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getSchedule = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduledPriceService.getScheduleById(id);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get schedule');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to get schedule');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getEffectivePrice = useCallback(async (itemId, date) => {
    try {
      setLoading(true);
      setError(null);

      const response = await scheduledPriceService.getEffectivePrice(itemId, date);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get effective price');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        // Don't show toast for this error - it's expected when no schedule exists
        console.error('Get effective price error:', err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const validateScheduleData = useCallback((data) => {
    const errors = {};

    if (!data.itemPriceId) {
      errors.itemPriceId = 'Item is required';
    }

    if (!data.effectiveDate) {
      errors.effectiveDate = 'Effective date is required';
    }

    if (!data.harga || data.harga <= 0) {
      errors.harga = 'Price must be greater than 0';
    }

    if (data.pot1 !== undefined && (data.pot1 < 0 || data.pot1 > 100)) {
      errors.pot1 = 'Discount must be between 0-100%';
    }

    if (data.pot2 !== undefined && (data.pot2 < 0 || data.pot2 > 100)) {
      errors.pot2 = 'Discount must be between 0-100%';
    }

    if (data.ppn !== undefined && (data.ppn < 0 || data.ppn > 100)) {
      errors.ppn = 'PPN must be between 0-100%';
    }

    return errors;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    setError,
    clearError,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    cancelSchedule,
    getSchedule,
    getEffectivePrice,
    validateScheduleData
  };
};

export default useScheduledPriceOperations;
