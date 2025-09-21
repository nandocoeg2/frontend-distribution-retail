import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { getCompanies, searchCompanies, deleteCompany } from '../services/companyService';

const useCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
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
    toastService.error('Session expired. Please login again.');
  }, [navigate]);

  const fetchCompanies = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCompanies(page, limit);
      
      if (response.success) {
        let companiesData = response.data?.data || response.data?.companies || response.data || [];
        
        // Ensure companiesData is always an array
        if (!Array.isArray(companiesData)) {
          console.warn('Companies data is not an array:', companiesData);
          companiesData = [];
        }
        
        const paginationData = response.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10
        };
        setCompanies(companiesData);
        setPagination(paginationData);
      } else {
        throw new Error(response.error?.message || 'Failed to load companies');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to load companies');
      }
      // Set fallback values on error
      setCompanies([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  const searchCompaniesCallback = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchCompanies(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const response = await searchCompanies(query, page, limit);
      
      if (response.success) {
        let companiesData = response.data?.data || response.data?.companies || response.data || [];
        
        // Ensure companiesData is always an array
        if (!Array.isArray(companiesData)) {
          console.warn('Search companies data is not an array:', companiesData);
          companiesData = [];
        }
        
        setCompanies(companiesData);
        setPagination(response.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10
        });
      } else {
        throw new Error(response.error?.message || 'Failed to search companies');
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to search companies');
      }
      // Set fallback values on error
      setCompanies([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } finally {
      setSearchLoading(false);
    }
  }, [fetchCompanies, handleAuthError]);

  const handleDeleteCompany = async (id) => {
    try {
      await deleteCompany(id);
      toastService.success('Company deleted successfully');
      
      // Determine the page to fetch after deletion
      const companiesArray = Array.isArray(companies) ? companies : [];
      const newPage = (companiesArray.length === 1 && pagination.currentPage > 1)
        ? pagination.currentPage - 1
        : pagination.currentPage;

      // Refresh the list based on whether a search is active
      if (searchQuery.trim()) {
        searchCompaniesCallback(searchQuery, newPage, pagination.itemsPerPage);
      } else {
        fetchCompanies(newPage, pagination.itemsPerPage);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
        handleAuthError();
      } else {
        setError(err.message);
        toastService.error(err.message || 'Failed to delete company');
      }
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchCompaniesCallback(query, 1, pagination.itemsPerPage);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchCompaniesCallback(searchQuery, newPage, pagination.itemsPerPage);
    } else {
      fetchCompanies(newPage, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (searchQuery.trim()) {
      searchCompaniesCallback(searchQuery, 1, newLimit);
    } else {
      fetchCompanies(1, newLimit);
    }
  };

  useEffect(() => {
    fetchCompanies(1, pagination.itemsPerPage);

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
    deleteCompany: handleDeleteCompany,
    fetchCompanies,
    handleAuthError
  };
};

export default useCompaniesPage;
