import React, { useState } from 'react';
import useParentGroupCustomersPage from '@/hooks/useParentGroupCustomersPage';
import useParentGroupCustomerOperations from '@/hooks/useParentGroupCustomerOperations';
import ParentGroupCustomerTable from '@/components/parentGroupCustomers/ParentGroupCustomerTable';
import ParentGroupCustomerSearch from '@/components/parentGroupCustomers/ParentGroupCustomerSearch';
import AddParentGroupCustomerModal from '@/components/parentGroupCustomers/AddParentGroupCustomerModal';
import ParentGroupCustomerDetailCard from '@/components/parentGroupCustomers/ParentGroupCustomerDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { parentGroupCustomerService } from '../services/parentGroupCustomerService';
import toastService from '../services/toastService';

const ParentGroupCustomers = () => {
    const {
        parentGroupCustomers,
        setParentGroupCustomers,
        pagination,
        loading,
        error,
        searchQuery,
        searchLoading,
        handleSearchChange,
        handlePageChange,
        handleLimitChange,
        deleteParentGroupCustomerConfirmation,
        fetchEntities,
        handleAuthError
    } = useParentGroupCustomersPage();

    const { getParentGroupCustomerById, loading: detailLoading } = useParentGroupCustomerOperations();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedParentGroupCustomerForDetail, setSelectedParentGroupCustomerForDetail] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [showExportConfirmation, setShowExportConfirmation] = useState(false);

    const openAddModal = () => setShowAddModal(true);
    const closeAddModal = () => setShowAddModal(false);

    const confirmExportExcel = async () => {
        try {
            setShowExportConfirmation(false);
            setExportLoading(true);
            await parentGroupCustomerService.exportExcel(searchQuery);
            toastService.success('Data berhasil diexport ke Excel');
        } catch (err) {
            console.error('Export failed:', err);
            toastService.error(err.message || 'Gagal mengexport data');
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportExcel = () => {
        setShowExportConfirmation(true);
    };

    const handleViewDetail = async (parentGroupCustomer) => {
        try {
            // Fetch detail data using GET /:id endpoint
            const detailData = await getParentGroupCustomerById(parentGroupCustomer.id);
            setSelectedParentGroupCustomerForDetail(detailData);
        } catch (err) {
            // If fetch fails, fallback to list data
            console.warn('Failed to fetch parent group customer details, using list data:', err.message);
            setSelectedParentGroupCustomerForDetail(parentGroupCustomer);
        }
    };

    const handleCloseDetail = () => {
        setSelectedParentGroupCustomerForDetail(null);
    };

    const handleParentGroupCustomerAdded = () => {
        fetchEntities();
        closeAddModal();
    };

    if (error) {
        return (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <p className='text-red-800'>Error: {error}</p>
                <button
                    onClick={() => fetchEntities()}
                    className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className='bg-white shadow rounded-lg overflow-hidden'>
                <div className='p-3'>
                    <div className='mb-2 flex justify-between items-center'>
                        <h3 className='text-sm font-semibold text-gray-900'>Parent Group Customer List</h3>
                        <div className='flex gap-2'>
                            <button
                                onClick={handleExportExcel}
                                disabled={exportLoading}
                                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50'
                            >
                                {exportLoading ? (
                                    <>
                                        <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5'></div>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownTrayIcon className='h-4 w-4 mr-1.5' />
                                        Export Excel
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className='inline-flex items-center px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700'
                            >
                                <PlusIcon className='h-4 w-4 mr-1.5' />
                                Add Parent Group
                            </button>
                        </div>
                    </div>

                    <ParentGroupCustomerSearch
                        searchQuery={searchQuery}
                        handleSearchChange={handleSearchChange}
                        searchLoading={searchLoading}
                    />

                    {loading && !searchLoading ? (
                        <div className='flex justify-center items-center h-64'>
                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                        </div>
                    ) : (
                        <ParentGroupCustomerTable
                            parentGroupCustomers={parentGroupCustomers}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                            onDelete={deleteParentGroupCustomerConfirmation.showDeleteConfirmation}
                            onViewDetail={handleViewDetail}
                            selectedParentGroupCustomerId={selectedParentGroupCustomerForDetail?.id}
                            searchQuery={searchQuery}
                        />
                    )}
                </div>
            </div>

            <AddParentGroupCustomerModal
                show={showAddModal}
                onClose={closeAddModal}
                onParentGroupCustomerAdded={handleParentGroupCustomerAdded}
                handleAuthError={handleAuthError}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                show={deleteParentGroupCustomerConfirmation.showConfirm}
                onClose={deleteParentGroupCustomerConfirmation.hideDeleteConfirmation}
                onConfirm={deleteParentGroupCustomerConfirmation.confirmDelete}
                title={deleteParentGroupCustomerConfirmation.title}
                message={deleteParentGroupCustomerConfirmation.message}
                type="danger"
                confirmText="Hapus"
                cancelText="Batal"
                loading={deleteParentGroupCustomerConfirmation.loading}
            />

            {/* Export Confirmation Dialog */}
            <ConfirmationDialog
                show={showExportConfirmation}
                onClose={() => setShowExportConfirmation(false)}
                onConfirm={confirmExportExcel}
                title="Konfirmasi Export"
                message="Apakah Anda yakin ingin mengexport data ini ke Excel?"
                type="info"
                confirmText="Ya, Export"
                cancelText="Batal"
                loading={exportLoading}
            />

            {/* Parent Group Customer Detail Card */}
            {selectedParentGroupCustomerForDetail && (
                <ParentGroupCustomerDetailCard
                    parentGroupCustomer={selectedParentGroupCustomerForDetail}
                    onClose={handleCloseDetail}
                    onUpdate={() => {
                        fetchEntities();
                        handleViewDetail(selectedParentGroupCustomerForDetail);
                    }}
                    loading={detailLoading}
                />
            )}
        </div>
    );
};

export default ParentGroupCustomers;
