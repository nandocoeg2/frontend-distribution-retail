import React, { useState } from 'react';
import useCompaniesPage from '@/hooks/useCompaniesPage';
import CompanyTable from '@/components/companies/CompanyTable';
import CompanySearch from '@/components/companies/CompanySearch';
import AddCompanyModal from '@/components/companies/AddCompanyModal';
import CompanyDetailCard from '@/components/companies/CompanyDetailCard';
import { createCompany, updateCompany, exportExcel } from '@/services/companyService';
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
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      await exportExcel(searchQuery);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewDetail = (company) => {
    setSelectedCompanyForDetail(company);
  };

  const handleCloseDetail = () => {
    setSelectedCompanyForDetail(null);
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
            <div className='flex gap-2'>
              <button
                onClick={handleExportExcel}
                disabled={exportLoading}
                className='inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {exportLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <HeroIcon name='arrow-down-tray' className='w-5 h-5 mr-2' />
                    Export Excel
                  </>
                )}
              </button>
              <button
                onClick={openAddModal}
                className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                <HeroIcon name='plus' className='w-5 h-5 mr-2' />
                Add Company
              </button>
            </div>
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
            onDelete={deleteCompany} 
            onViewDetail={handleViewDetail}
            selectedCompanyId={selectedCompanyForDetail?.id}
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

      {/* Company Detail Card */}
      {selectedCompanyForDetail && (
        <CompanyDetailCard
          company={selectedCompanyForDetail}
          onClose={handleCloseDetail}
          updateCompany={updateCompany}
          onUpdate={() => {
            fetchCompanies(pagination.currentPage, pagination.itemsPerPage);
            handleViewDetail(selectedCompanyForDetail);
          }}
        />
      )}

    </div>
  );
};

export default Companies;

