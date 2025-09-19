import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { companyService } from '../services/companyService';

const useCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const navigate = useNavigate();

  const handleAuthError = useCallback(() => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Sesi telah berakhir. Silakan login kembali.');
  }, [navigate]);

  const fetchCompanies = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await companyService.getAllCompanies(page, limit);
      
      if (result.success) {
        setCompanies(result.data);
        setPagination(result.meta || {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      } else {
        throw new Error('Failed to fetch companies');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error(`Gagal memuat data perusahaan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchCompanies = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchCompanies(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const result = await companyService.searchCompanies(query, page, limit);
      
      if (result.success) {
        setCompanies(result.data);
        setPagination(result.meta || {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        });
      } else {
        throw new Error('Failed to search companies');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error(`Gagal mencari perusahaan: ${err.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [fetchCompanies, handleAuthError]);

  const createCompany = async (companyData) => {
    try {
      const result = await companyService.createCompany(companyData);
      
      if (result.success) {
        toastService.success('Perusahaan berhasil dibuat');
        // Refresh the current page to show the new company
        fetchCompanies(pagination.page, pagination.limit);
        return result.data;
      } else {
        throw new Error('Failed to create company');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(`Gagal membuat perusahaan: ${err.message}`);
      throw err;
    }
  };

  const updateCompany = async (id, companyData) => {
    try {
      const result = await companyService.updateCompany(id, companyData);
      
      if (result.success) {
        toastService.success('Perusahaan berhasil diperbarui');
        // Update the company in the current list
        setCompanies(companies.map(company => 
          company.id === id ? result.data : company
        ));
        return result.data;
      } else {
        throw new Error('Failed to update company');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(`Gagal memperbarui perusahaan: ${err.message}`);
      throw err;
    }
  };

  const deleteCompany = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus perusahaan ini?'))
      return;

    try {
      const result = await companyService.deleteCompany(id);
      
      if (result.success) {
        setCompanies(companies.filter((company) => company.id !== id));
        toastService.success('Perusahaan berhasil dihapus');
        
        // Refresh current page if it becomes empty
        const currentPage = pagination.page;
        const remainingItems = companies.length - 1;
        const itemsPerPage = pagination.limit;
        const newTotalPages = Math.ceil(remainingItems / itemsPerPage);
        
        if (currentPage > newTotalPages && newTotalPages > 0) {
          fetchCompanies(newTotalPages, pagination.limit);
        }
      } else {
        throw new Error('Failed to delete company');
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(`Gagal menghapus perusahaan: ${err.message}`);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchCompanies(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchCompanies(searchQuery, newPage, pagination.limit);
    } else {
      fetchCompanies(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const newPagination = {
      ...pagination,
      limit: newLimit
    };
    setPagination(newPagination);
    
    if (searchQuery.trim()) {
      searchCompanies(searchQuery, 1, newLimit);
    } else {
      fetchCompanies(1, newLimit);
    }
  };

  useEffect(() => {
    fetchCompanies(1, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchCompanies]);

  return {
    companies,
    setCompanies,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    createCompany,
    updateCompany,
    deleteCompany,
    fetchCompanies,
    handleAuthError
  };
};

export default useCompaniesPage;

