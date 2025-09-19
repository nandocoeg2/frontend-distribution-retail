import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';

const useEntityForm = ({
  initialData,
  service,
  validate,
  entityName,
}) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleAuthError = useCallback((err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      localStorage.clear();
      navigate('/login');
      toastService.error('Session expired. Please login again.');
      return true;
    }
    return false;
  }, [navigate]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [validationErrors]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setValidationErrors({});
    setError(null);
  }, [initialData]);

  const loadData = useCallback((data) => {
    setFormData(data);
    setValidationErrors({});
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e, id = null) => {
    e.preventDefault();

    if (validate) {
      const errors = validate(formData);
      setValidationErrors(errors);
      if (Object.keys(errors).length > 0) {
        toastService.error('Please fix the validation errors.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (id) {
        result = await service.update(id, formData);
        toastService.success(`${entityName} updated successfully`);
      } else {
        result = await service.create(formData);
        toastService.success(`${entityName} created successfully`);
      }
      return result;
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message);
        toastService.error(`Failed to save ${entityName}: ${err.message}`);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, service, validate, entityName, handleAuthError]);

  return {
    formData,
    setFormData,
    loading,
    error,
    validationErrors,
    handleInputChange,
    resetForm,
    loadData,
    handleSubmit,
  };
};

export default useEntityForm;
