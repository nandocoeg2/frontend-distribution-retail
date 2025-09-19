import { searchInventories } from '../services/inventoryService';
import useSearch from './useSearch';

const useInventorySearch = (options = {}) => {
  return useSearch(searchInventories, options);
};

export default useInventorySearch;
