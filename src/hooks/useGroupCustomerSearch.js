import { groupCustomerService } from '../services/groupCustomerService';
import useSearch from './useSearch';

const useGroupCustomerSearch = (options = {}) => {
  return useSearch(groupCustomerService.searchGroupCustomers, options);
};

export default useGroupCustomerSearch;
