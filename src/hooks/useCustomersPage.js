import useEntity from './useEntity';
import customerService from '../services/customerService';

const useCustomersPage = () => {
  const {
    entities: customers,
    setEntities: setCustomers,
    deleteEntity: deleteCustomer,
    deleteConfirmation: deleteCustomerConfirmation,
    ...rest
  } = useEntity({
    entityName: 'Customer',
    entityNamePlural: 'customers',
    getAllService: customerService.getAll,
    searchService: customerService.search,
    deleteService: customerService.delete,
  });

  return {
    customers,
    setCustomers,
    deleteCustomer,
    deleteCustomerConfirmation,
    ...rest,
  };
};

// The original hook was named useCustomers, so we export that name
// to avoid having to refactor the components that use it.
export default useCustomersPage;
