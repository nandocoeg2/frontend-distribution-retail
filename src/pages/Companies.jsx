import React, { useState } from 'react';
import useCompaniesPage from '@/hooks/useCompaniesPage';
import CompanyTable from '@/components/companies/CompanyTable';
import CompanySearch from '@/components/companies/CompanySearch';
import AddCompanyModal from '@/components/companies/AddCompanyModal';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import ViewCompanyModal from '@/components/companies/ViewCompanyModal';
import { createCompany, updateCompany } from '@/services/companyService';
import toastService from '@/services/toastService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const Companies = () => {
  const {
    companies,
    setCompanies,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    handleSearchChange,
    handlePageChange,
    handleLimitChange,
    deleteCompany,
    fetchCompanies,
    handleAuthError
  } = useCompaniesPage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (company) => {
    setEditingCompany(company);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingCompany(null);
    setShowEditModal(false);
  };

  const openViewModal = (company) => {
    setViewingCompany(company);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingCompany(null);
    setShowViewModal(false);
  };

  const handleCompanyAdded = async (companyData) => {
    try {
      const response = await createCompany(companyData);
      if (response.success) {
        toastService.success('Company created successfully');
        closeAddModal();
        fetchCompanies(1, pagination.itemsPerPage);
      }
    } catch (error) {
      toastService.error(error.message || 'Failed to create company');
    }
  };

  const handleCompanyUpdated = async (id, companyData) => {
    try {
      const response = await updateCompany(id, companyData);
      if (response.success) {
        toastService.success('Company updated successfully');
        closeEditModal();
        fetchCompanies(pagination.currentPage, pagination.itemsPerPage);
      }
    } catch (error) {
      toastService.error(error.message || 'Failed to update company');
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchCompanies}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900'>Company List</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Company
            </button>
          </div>

          <CompanySearch 
            searchQuery={searchQuery} 
            handleSearchChange={handleSearchChange} 
            searchLoading={searchLoading} 
          />

          <CompanyTable 
            companies={companies} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal} 
            onDelete={deleteCompany} 
            onView={openViewModal}
            searchQuery={searchQuery}
            loading={loading}
          />
        </div>
      </div>

      <AddCompanyModal 
        show={showAddModal} 
        onClose={closeAddModal} 
        onCompanyAdded={handleCompanyAdded}
        handleAuthError={handleAuthError}
      />

      <EditCompanyModal 
        show={showEditModal} 
        onClose={closeEditModal} 
        company={editingCompany}
        onCompanyUpdated={handleCompanyUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewCompanyModal 
        show={showViewModal} 
        onClose={closeViewModal} 
        company={viewingCompany} 
      />

    </div>
  );
};

export default Companies;

