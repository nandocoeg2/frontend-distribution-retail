import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import customerService from '../services/customerService';

const useCustomerOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const createCustomer = useCallback(async (customerData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.createCustomer(customerData);
      
      if (response.success) {
        toastService.success('Customer created successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create customer');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to create customer');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const updateCustomer = useCallback(async (id, customerData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.updateCustomer(id, customerData);
      
      if (response.success) {
        toastService.success('Customer updated successfully');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update customer');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to update customer');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const deleteCustomer = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await customerService.deleteCustomer(id);
      toastService.success('Customer deleted successfully');
      return true;
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete customer');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const getCustomer = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customerService.getCustomerById(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get customer');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to get customer');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const validateCustomerData = useCallback((data) => {
    const errors = {};

    if (!data.namaCustomer || !data.namaCustomer.trim()) {
      errors.namaCustomer = 'Nama customer is required';
    }

    if (!data.kodeCustomer || !data.kodeCustomer.trim()) {
      errors.kodeCustomer = 'Kode customer is required';
    }

    if (!data.groupCustomerId) {
      errors.groupCustomerId = 'Group customer is required';
    }

    if (!data.regionId) {
      errors.regionId = 'Region is required';
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
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    validateCustomerData
  };
};

export default useCustomerOperations;
