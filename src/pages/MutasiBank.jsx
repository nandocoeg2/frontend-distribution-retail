import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BanknotesIcon,
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import {
  MutasiBankTableServerSide,
  MutasiBankUploadModal,
  MutasiBankDetailModal,
  MutasiBankValidateModal,
} from '../components/mutasiBank';
import useMutasiBankPage from '../hooks/useMutasiBankPage';
import toastService from '../services/toastService';

const resolveMutationId = (mutation) => {
  if (!mutation) {
    return null;
  }

  return (
    mutation.id ??
    mutation.mutationId ??
    mutation.uuid ??
    mutation._id ??
    mutation.transactionId ??
    mutation.bankMutationId ??
    null
  );
};

const TAB_DEFINITIONS = [
  { id: 'all', label: 'Semua', description: 'Seluruh mutasi bank' },
  { id: 'pending', label: 'Pending', description: 'Menunggu pencocokan' },
  { id: 'matched', label: 'Matched', description: 'Sudah terhubung ke dokumen' },
  { id: 'unmatched', label: 'Unmatched', description: 'Belum memiliki dokumen' },
  { id: 'valid', label: 'Valid', description: 'Telah divalidasi' },
  { id: 'invalid', label: 'Invalid', description: 'Perlu tindak lanjut manual' },
  { id: 'reconciled', label: 'Reconciled', description: 'Rekonsiliasi selesai' },
];

const MutasiBank = () => {
  const queryClient = useQueryClient();

  const {
    uploadMutationFile,
    uploading,
    fetchMutationDetail,
    detailLoading,
    validateMutation,
    validating,
  } = useMutasiBankPage();

  const [activeTab, setActiveTab] = useState('all');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [validationTarget, setValidationTarget] = useState(null);

  const invalidateMutations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mutasiBank'] });
  }, [queryClient]);

  const handleUploadFile = useCallback(
    async (file) => {
      try {
        await uploadMutationFile(file);
        setUploadModalOpen(false);
        invalidateMutations();
      } catch (error) {
        console.error('Upload mutasi bank gagal:', error);
      }
    },
    [uploadMutationFile, invalidateMutations]
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleViewMutation = useCallback(
    async (mutation, mutationId) => {
      const targetId = mutationId || resolveMutationId(mutation);
      if (!targetId) {
        toastService.error('Mutasi bank tidak memiliki ID yang valid.');
        return;
      }

      setDetailModalOpen(true);
      setDetailData(mutation);

      try {
        const response = await fetchMutationDetail(targetId);
        if (response) {
          setDetailData(response);
        }
      } catch (error) {
        console.error('Gagal memuat detail mutasi bank:', error);
      }
    },
    [fetchMutationDetail]
  );

  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setDetailData(null);
  }, []);

  const handleOpenValidateModal = useCallback((mutation, mutationId) => {
    const targetId = mutationId || resolveMutationId(mutation);
    if (!targetId) {
      toastService.error('Mutasi bank tidak memiliki ID yang valid.');
      return;
    }

    setValidationTarget({
      id: targetId,
      mutation,
    });
    setValidateModalOpen(true);
  }, []);

  const handleCloseValidateModal = useCallback(() => {
    setValidateModalOpen(false);
    setValidationTarget(null);
  }, []);

  const handleSubmitValidation = useCallback(
    async ({ status, notes }) => {
      if (!validationTarget?.id) {
        return;
      }

      try {
        await validateMutation(validationTarget.id, { status, notes });
        invalidateMutations();
        handleCloseValidateModal();
      } catch (error) {
        console.error('Gagal memvalidasi mutasi bank:', error);
      }
    },
    [
      invalidateMutations,
      validateMutation,
      validationTarget,
      handleCloseValidateModal,
    ]
  );

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <header className='flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center'>
          <div className='flex items-center gap-4'>
            <HeroIcon icon={BanknotesIcon} className='h-12 w-12 text-blue-600' />
            <div>
              <h1 className='text-2xl font-semibold text-gray-900'>
                Mutasi Bank
              </h1>
              <p className='text-sm text-gray-600'>
                Kelola mutasi bank untuk proses rekonsiliasi pembayaran dan validasi dokumen penagihan.
              </p>
              <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500'>
                <span className='inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600'>
                  <ArrowPathIcon className='mr-1 h-4 w-4' />
                  {TAB_DEFINITIONS.find((tab) => tab.id === activeTab)?.label || 'Semua'}
                </span>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <button
              type='button'
              onClick={() => setUploadModalOpen(true)}
              className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              Unggah Mutasi
            </button>
            <button
              type='button'
              onClick={invalidateMutations}
              className='inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <ArrowPathIcon className='mr-2 h-4 w-4' />
              Segarkan Data
            </button>
          </div>
        </header>

        <section>
          <MutasiBankTableServerSide
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onViewMutation={handleViewMutation}
            onValidateMutation={handleOpenValidateModal}
            isValidating={validating}
            onManualRefresh={invalidateMutations}
          />
        </section>
      </div>

      <MutasiBankUploadModal
        open={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUploadFile}
        uploading={uploading}
      />

      <MutasiBankDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        mutation={detailData}
        loading={detailLoading}
      />

      <MutasiBankValidateModal
        open={validateModalOpen}
        onClose={handleCloseValidateModal}
        onSubmit={handleSubmitValidation}
        loading={validating}
        mutation={validationTarget?.mutation}
        initialStatus={
          validationTarget?.mutation?.validation_status ||
          validationTarget?.mutation?.validationStatus ||
          'VALID'
        }
        selectedCount={1}
      />
    </div>
  );
};

export default MutasiBank;
