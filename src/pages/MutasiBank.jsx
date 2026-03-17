import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  MutasiBankTableServerSide,
  MutasiBankUploadModal,
  MutasiBankDetailModal,
  MutasiBankValidateModal,
  MutasiBankAssignDocumentModal,
} from '../components/mutasiBank';
import useMutasiBankPage from '../hooks/useMutasiBankPage';
import toastService from '../services/toastService';

const resolveMutationId = (mutation) => {
  if (!mutation) {
    return null;
  }
  return mutation.id ?? mutation.mutationId ?? mutation.uuid ?? mutation._id ?? mutation.transactionId ?? mutation.bankMutationId ?? null;
};

const MutasiBank = () => {
  const queryClient = useQueryClient();

  const {
    uploadMutationFile,
    uploading,
    fetchMutationDetail,
    detailLoading,
    validateMutation,
    validating,
    assignDocument,
    assigning,
    unassignDocument,
    unassigning,
  } = useMutasiBankPage();

  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [validationTarget, setValidationTarget] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

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

  const handleOpenAssignModal = useCallback((mutation, mutationId) => {
    const targetId = mutationId || resolveMutationId(mutation);
    if (!targetId) {
      toastService.error('Mutasi bank tidak memiliki ID yang valid.');
      return;
    }

    setAssignTarget({
      id: targetId,
      mutation,
    });
    setAssignModalOpen(true);
  }, []);

  const handleCloseAssignModal = useCallback(() => {
    setAssignModalOpen(false);
    setAssignTarget(null);
  }, []);

  const handleSubmitAssign = useCallback(
    async (payload) => {
      if (!assignTarget?.id) {
        return;
      }

      try {
        await assignDocument(assignTarget.id, payload);
        invalidateMutations();
        handleCloseAssignModal();
      } catch (error) {
        console.error('Gagal mengaitkan dokumen:', error);
      }
    },
    [
      invalidateMutations,
      assignDocument,
      assignTarget,
      handleCloseAssignModal,
    ]
  );

  const handleUnassignDocument = useCallback(
    async (mutation, mutationId) => {
      const targetId = mutationId || resolveMutationId(mutation);
      if (!targetId) {
        toastService.error('Mutasi bank tidak memiliki ID yang valid.');
        return;
      }

      try {
        await unassignDocument(targetId);
        invalidateMutations();
      } catch (error) {
        console.error('Gagal melepas dokumen:', error);
      }
    },
    [unassignDocument, invalidateMutations]
  );

  return (
    <div>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>Mutasi Bank</h3>
            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => setUploadModalOpen(true)}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                <PlusIcon className='w-4 h-4 mr-1.5' />
                Upload
              </button>
              <button
                type='button'
                onClick={invalidateMutations}
                className='inline-flex items-center justify-center px-2.5 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded hover:border-gray-300 hover:bg-gray-50'
              >
                <ArrowPathIcon className='w-4 h-4 mr-1.5' />
                Refresh
              </button>
            </div>
          </div>

          <MutasiBankTableServerSide
            onViewMutation={handleViewMutation}
            onValidateMutation={handleOpenValidateModal}
            onAssignDocument={handleOpenAssignModal}
            onUnassignDocument={handleUnassignDocument}
            isValidating={validating}
            isAssigning={assigning}
            isUnassigning={unassigning}
          />
        </div>
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
        initialStatus={(() => {
          const currentStatus =
            validationTarget?.mutation?.validation_status ||
            validationTarget?.mutation?.validationStatus;
          // Only allow 'VALID' or 'INVALID', default to 'VALID' for any other status
          return currentStatus === 'VALID' || currentStatus === 'INVALID'
            ? currentStatus
            : 'VALID';
        })()}
        selectedCount={1}
      />

      <MutasiBankAssignDocumentModal
        open={assignModalOpen}
        onClose={handleCloseAssignModal}
        onSubmit={handleSubmitAssign}
        loading={assigning}
        mutation={assignTarget?.mutation}
      />
    </div>
  );
};

export default MutasiBank;
