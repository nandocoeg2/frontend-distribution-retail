import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from './useDeleteConfirmation';

const useEntity = ({
  entityName,
  entityNamePlural,
  getAllService,
  searchService,
  deleteService,
  createService,
  updateService,
  getByIdService,
}) => {
  const [entities, setEntities] = useState([]);
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

  const normalizePagination = (paginationData) => {
    if (!paginationData) return { page: 1, totalPages: 1, total: 0, limit: 10 };
    return {
      page: paginationData.currentPage || paginationData.page || 1,
      totalPages: paginationData.totalPages || 1,
      total: paginationData.totalItems || paginationData.total || 0,
      limit: paginationData.itemsPerPage || paginationData.limit || 10,
    };
  };

  const fetchEntities = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllService(page, limit);

      if (result.success !== false) {
        // Handle different response structures
        const data = result.data?.data || result.data || [];
        const paginationData = result.data?.pagination || result.meta || result.pagination;

        setEntities(data);
        setPagination(normalizePagination(paginationData));
      } else {
        throw new Error(`Failed to fetch ${entityNamePlural}`);
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAllService, handleAuthError, entityNamePlural]);

  const searchEntities = useCallback(async (query, page = 1, limit = 10) => {
    if (!query.trim()) {
      fetchEntities(page, limit);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      const result = await searchService(query, page, limit);

      if (result.success !== false) {
        const data = result.data?.data || result.data || [];
        const paginationData = result.data?.pagination || result.meta || result.pagination;

        setEntities(data);
        setPagination(normalizePagination(paginationData));
      } else {
        throw new Error(`Failed to search ${entityNamePlural}`);
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      setError(err.message);
      toastService.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [searchService, fetchEntities, handleAuthError, entityNamePlural]);

  const createEntity = async (entityData) => {
    if (!createService) return;
    try {
      const result = await createService(entityData);

      if (result.success !== false) {
        toastService.success(`${entityName} berhasil dibuat`);
        fetchEntities(pagination.page, pagination.limit);
        return result.data || result;
      } else {
        throw new Error(`Failed to create ${entityName}`);
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
      throw err;
    }
  };

  const updateEntity = async (id, entityData) => {
    if (!updateService) return;
    try {
      const result = await updateService(id, entityData);

      if (result.success !== false) {
        toastService.success(`${entityName} berhasil diperbarui`);
        setEntities(entities.map(entity =>
          entity.id === id ? (result.data || result) : entity
        ));
        return result.data || result;
      } else {
        throw new Error(`Failed to update ${entityName}`);
      }
    } catch (err) {
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
      throw err;
    }
  };

  const deleteEntityFunction = async (id) => {
    if (!deleteService) return;
    try {
      console.log(`Deleting ${entityName} with ID:`, id);
      const result = await deleteService(id);
      console.log('Delete result:', result);

      if (result.success !== false) {
        toastService.success(`${entityName} berhasil dihapus`);

        const newTotal = pagination.total - 1;
        const newTotalPages = Math.ceil(newTotal / pagination.limit);

        console.log('Refreshing data after delete...');
        if (entities.length === 1 && pagination.page > 1) {
          // If it's the last item on a page that is not the first page, go to the previous page
          fetchEntities(pagination.page - 1, pagination.limit);
        } else if (pagination.page > newTotalPages && newTotalPages > 0) {
          // If current page is now out of bounds, go to the new last page
          fetchEntities(newTotalPages, pagination.limit);
        } else {
          // Otherwise, just refetch the current page
          fetchEntities(pagination.page, pagination.limit);
        }
      } else {
        throw new Error(`Failed to delete ${entityName}`);
      }
    } catch (err) {
      console.error(`Delete ${entityName} error:`, err);
      if (err.message === 'Unauthorized') {
        handleAuthError();
        return;
      }
      toastService.error(err.message);
    }
  };

  const deleteConfirmation = useDeleteConfirmation(
    deleteEntityFunction,
    `Apakah Anda yakin ingin menghapus ${entityName.toLowerCase()} ini?`,
    `Hapus ${entityName}`
  );

  const deleteEntity = deleteConfirmation.showDeleteConfirmation;

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      searchEntities(query, 1, pagination.limit);
    }, 500);

    setDebounceTimeout(timeout);
  };

  const handlePageChange = (newPage) => {
    if (searchQuery.trim()) {
      searchEntities(searchQuery, newPage, pagination.limit);
    } else {
      fetchEntities(newPage, pagination.limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    setPagination(p => ({ ...p, limit: newLimit, page: 1 }));
    if (searchQuery.trim()) {
      searchEntities(searchQuery, 1, newLimit);
    } else {
      fetchEntities(1, newLimit);
    }
  };

  useEffect(() => {
    fetchEntities(pagination.page, pagination.limit);

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [fetchEntities]);

  return {
    entities,
    setEntities,
    pagination,
    setPagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    createEntity,
    updateEntity,
    deleteEntity,
    deleteConfirmation,
    fetchEntities,
    handleAuthError,
  };
};

export default useEntity;
