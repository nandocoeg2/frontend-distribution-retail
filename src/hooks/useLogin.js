import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import toastService from '../services/toastService';

/**
 * Hook untuk menangani proses login
 * @returns {Object} Object berisi state dan fungsi untuk login
 */
const useLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    companyId: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validasi form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username harus diisi';
    } else if (formData.username.length < 2) {
      newErrors.username = 'Username minimal 2 karakter';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Perusahaan harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  }, [errors]);

  const normalizeCompanies = useCallback((companies) => {
    if (!Array.isArray(companies)) {
      return [];
    }

    return companies
      .map((company) => {
        const id = company.id || company.companyId || company.uuid || company.company_id || company._id;
        if (!id) {
          return null;
        }
        const code = company.kode_company || company.code || company.companyCode || company.company_code || '';
        const name = company.nama_perusahaan || company.name || company.companyName || company.company_name || company.display_name || '';
        const displayName = [code, name].filter(Boolean).join(' - ') || name || code || 'Perusahaan';
        return {
          ...company,
          id,
          displayName
        };
      })
      .filter(Boolean);
  }, []);

  const extractCompanyList = useCallback((responseJson) => {
    if (!responseJson) {
      return [];
    }

    // Common wrappers inside the API response
    const topLevelCandidates = [
      responseJson,
      responseJson?.data,
      responseJson?.data?.data,
      responseJson?.data?.items,
      responseJson?.results,
      responseJson?.companies
    ];

    for (const candidate of topLevelCandidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }, []);

  // Load initial companies (called on focus if no options exist)
  const loadInitialCompanies = useCallback(async () => {
    // Skip if already loaded
    if (companyOptions.length > 0) {
      return;
    }

    setIsCompanyLoading(true);
    try {
      // Fetch first 10 companies using search API with empty query
      const response = await fetch(`http://localhost:5050/api/v1/companies/search?q=&limit=10`, {
        headers: {
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error?.message || errorData?.message || 'Gagal memuat daftar perusahaan';
        throw new Error(message);
      }

      const data = await response.json();
      const candidates = extractCompanyList(data);
      const normalized = normalizeCompanies(candidates);
      setCompanyOptions(normalized);
    } catch (error) {
      console.error('Load companies error:', error);
      toastService.error(error.message || 'Gagal memuat daftar perusahaan');
      setCompanyOptions([]);
    } finally {
      setIsCompanyLoading(false);
    }
  }, [companyOptions.length, extractCompanyList, normalizeCompanies]);

  const handleCompanySearch = useCallback(async (query) => {
    if (!query) {
      // If query is cleared, reload initial companies
      await loadInitialCompanies();
      return;
    }

    setIsCompanyLoading(true);
    try {
      const response = await fetch(`http://localhost:5050/api/v1/companies/search?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          accept: 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error?.message || errorData?.message || 'Gagal mencari perusahaan';
        throw new Error(message);
      }

      const data = await response.json();
      const candidates = extractCompanyList(data);
      const normalized = normalizeCompanies(candidates);
      setCompanyOptions(normalized);
    } catch (error) {
      console.error('Company search error:', error);
      toastService.error(error.message || 'Gagal mencari perusahaan');
      setCompanyOptions([]);
    } finally {
      setIsCompanyLoading(false);
    }
  }, [extractCompanyList, normalizeCompanies, loadInitialCompanies]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(formData.username, formData.password, formData.companyId);
      
      if (result.success) {
        // Redirect to dashboard or intended page
        const intendedPath = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
        navigate(intendedPath, { replace: true });
      } else {
        // Handle specific error cases
        const errorMessage = result.error || '';
        if (/invalid username or password/i.test(errorMessage)) {
          setErrors({
            general: 'Username atau password salah'
          });
        } else if (/company not found/i.test(errorMessage)) {
          setErrors({
            companyId: 'Perusahaan tidak ditemukan',
            general: 'Perusahaan tidak ditemukan'
          });
        } else if (/validation error/i.test(errorMessage)) {
          setErrors({
            general: 'Data yang dimasukkan tidak valid'
          });
        } else {
          setErrors({
            general: errorMessage || 'Gagal melakukan login'
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: 'Terjadi kesalahan saat login. Silakan coba lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, login, navigate]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      password: '',
      companyId: ''
    });
    setErrors({});
    setCompanyOptions([]);
  }, []);

  // Clear specific error
  const clearError = useCallback((field) => {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  }, []);

  return {
    formData,
    errors,
    isLoading,
    companyOptions,
    isCompanyLoading,
    handleCompanySearch,
    handleCompanyFocus: loadInitialCompanies,
    handleInputChange,
    handleSubmit,
    resetForm,
    clearError,
    validateForm
  };
};

export default useLogin;
