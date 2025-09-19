import { useCallback } from 'react';
import supplierService from '@/services/supplierService';
import useSearch from './useSearch';

const useSupplierSearch = (options = {}) => {
  const searchHook = useSearch(supplierService.searchSuppliers, options);

  const getSearchSuggestions = useCallback(async (query, limit = 5) => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    try {
      const result = await supplierService.searchSuppliers(query, 1, limit);
      if (result.success) {
        return (result.data?.data || []).map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          code: supplier.code,
          address: supplier.address
        }));
      }
    } catch (err) {
      console.error('Error getting search suggestions:', err);
    }
    
    return [];
  }, []);

  return {
    ...searchHook,
    isSearching: searchHook.loading,
    getSearchSuggestions,
  };
};

export default useSupplierSearch;
