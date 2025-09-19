import useEntity from './useEntity';
import companyService from '../services/companyService';

const useCompaniesPage = () => {
  const {
    entities: companies,
    setEntities: setCompanies,
    ...rest
  } = useEntity({
    entityName: 'Perusahaan',
    entityNamePlural: 'perusahaan',
    getAllService: companyService.getAll,
    searchService: companyService.search,
    deleteService: companyService.delete,
    createService: companyService.create,
    updateService: companyService.update,
  });

  return {
    companies,
    setCompanies,
    ...rest,
  };
};

export default useCompaniesPage;
