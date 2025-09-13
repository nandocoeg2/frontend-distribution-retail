import React from 'react';
import usePackingsPage from '../hooks/usePackingsPage';
import {
  PackingTable,
  PackingSearch,
  ViewPackingModal,
  Pagination
} from '../components/packings';

const Packings = () => {
  const {
    packings,
    pagination,
    loading,
    error,
    searchQuery,
    searchLoading,
    viewingPacking,
    isViewModalOpen,
    handleSearchChange,
    handlePageChange,
    openViewModal,
    closeViewModal,
  } = usePackingsPage();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Packing Management</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <PackingSearch 
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchLoading={searchLoading}
          />

          {loading && <p className="text-center text-gray-500">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {!loading && !error && (
            <>
              <PackingTable 
                packings={packings} 
                onViewById={openViewModal} 
              />
              <Pagination 
                pagination={pagination} 
                onPageChange={handlePageChange} 
              />
            </>
          )}
        </div>

        {isViewModalOpen && (
          <ViewPackingModal 
            packing={viewingPacking} 
            onClose={closeViewModal} 
          />
        )}
      </div>
    </div>
  );
};

export default Packings;

