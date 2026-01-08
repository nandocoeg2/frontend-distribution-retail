import useEntity from './useEntity';
import { parentGroupCustomerService } from '../services/parentGroupCustomerService';

const useParentGroupCustomersPage = () => {
    const {
        entities: parentGroupCustomers,
        setEntities: setParentGroupCustomers,
        deleteEntity: deleteParentGroupCustomer,
        deleteConfirmation: deleteParentGroupCustomerConfirmation,
        ...rest
    } = useEntity({
        entityName: 'Parent Group Customer',
        entityNamePlural: 'parent group customers',
        getAllService: parentGroupCustomerService.getAll,
        searchService: parentGroupCustomerService.search,
        deleteService: parentGroupCustomerService.delete,
    });

    return {
        parentGroupCustomers,
        setParentGroupCustomers,
        deleteParentGroupCustomer,
        deleteParentGroupCustomerConfirmation,
        ...rest,
    };
};

export default useParentGroupCustomersPage;
