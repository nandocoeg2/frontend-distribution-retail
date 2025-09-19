import customerService from '../services/customerService';
import useSearch from './useSearch';

const useCustomerSearch = (options = {}) => {
  const search = (query, page, limit) => customerService.searchCustomers(query, page, limit);

  const customTransform = (res) => {
    return {
      data: res.data,
      pagination: res.pagination,
    };
  };

  return useSearch(search, { ...options, transformResponse: customTransform });
};

export default useCustomerSearch;
