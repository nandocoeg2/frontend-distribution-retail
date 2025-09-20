import React, { useState } from 'react';
import useSuratJalanPage from '../hooks/useSuratJalanPage';
import SuratJalanTable from '../components/suratJalan/SuratJalanTable';
import SuratJalanSearch from '../components/suratJalan/SuratJalanSearch';
import AddSuratJalanModal from '../components/suratJalan/AddSuratJalanModal';
import EditSuratJalanModal from '../components/suratJalan/EditSuratJalanModal';
import ViewSuratJalanModal from '../components/suratJalan/ViewSuratJalanModal';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const SuratJalan = () => {
  const {
    suratJalan,
    setSuratJalan,
    pagination,
    loading,
    error,
    searchQuery,
    searchField,
    searchLoading,
    handleSearchChange,
    handleSearchFieldChange,
    handlePageChange,
    handleLimitChange,
    deleteSuratJalan,
    fetchSuratJalan,
    handleAuthError
  } = useSuratJalanPage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingSuratJalan, setEditingSuratJalan] = useState(null);
  const [viewingSuratJalan, setViewingSuratJalan] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (suratJalanItem) => {
    setEditingSuratJalan(suratJalanItem);
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setEditingSuratJalan(null);
    setShowEditModal(false);
  };

  const openViewModal = (suratJalanItem) => {
    setViewingSuratJalan(suratJalanItem);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setViewingSuratJalan(null);
    setShowViewModal(false);
  };

  const handleSuratJalanAdded = (newSuratJalan) => {
    setSuratJalan([...suratJalan, newSuratJalan]);
    closeAddModal();
  };

  const handleSuratJalanUpdated = (updatedSuratJalan) => {
    setSuratJalan(
      suratJalan.map((item) =>
        item.id === updatedSuratJalan.id ? updatedSuratJalan : item
      )
    );
    closeEditModal();
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
          onClick={fetchSuratJalan}
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
            <h3 className='text-lg font-medium text-gray-900'>Surat Jalan List</h3>
            {/* <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <HeroIcon name='plus' className='w-5 h-5 mr-2' />
              Add Surat Jalan
            </button> */}
          </div>

          <SuratJalanSearch
            searchQuery={searchQuery}
            searchField={searchField}
            handleSearchChange={handleSearchChange}
            handleSearchFieldChange={handleSearchFieldChange}
            searchLoading={searchLoading}
          />

          <SuratJalanTable
            suratJalan={suratJalan}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onEdit={openEditModal}
            onDelete={deleteSuratJalan}
            onView={openViewModal}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      <AddSuratJalanModal
        show={showAddModal}
        onClose={closeAddModal}
        onSuratJalanAdded={handleSuratJalanAdded}
        handleAuthError={handleAuthError}
      />

      <EditSuratJalanModal
        show={showEditModal}
        onClose={closeEditModal}
        suratJalan={editingSuratJalan}
        onSuratJalanUpdated={handleSuratJalanUpdated}
        handleAuthError={handleAuthError}
      />

      <ViewSuratJalanModal
        show={showViewModal}
        onClose={closeViewModal}
        suratJalan={viewingSuratJalan}
      />
    </div>
  );
};

export default SuratJalan;
