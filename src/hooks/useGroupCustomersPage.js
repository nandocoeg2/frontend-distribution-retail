import useEntity from './useEntity';
import { groupCustomerService } from '../services/groupCustomerService';

const useGroupCustomersPage = () => {
  const {
    entities: groupCustomers,
    setEntities: setGroupCustomers,
    deleteEntity: deleteGroupCustomer,
    deleteConfirmation: deleteGroupCustomerConfirmation,
    ...rest
  } = useEntity({
    entityName: 'Group Customer',
    entityNamePlural: 'group customers',
    getAllService: groupCustomerService.getAll,
    searchService: groupCustomerService.search,
    deleteService: groupCustomerService.delete,
  });

  return {
    groupCustomers,
    setGroupCustomers,
    deleteGroupCustomer,
    deleteGroupCustomerConfirmation,
    ...rest,
  };
};

export default useGroupCustomersPage;
