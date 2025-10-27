import React, { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BanknotesIcon,
  ArrowPathIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import HeroIcon from '../components/atoms/HeroIcon.jsx';
import {
  MutasiBankTableServerSide,
  MutasiBankUploadModal,
  MutasiBankDetailModal,
  MutasiBankValidateModal,
  MutasiBankMatchModal,
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
    fetchMatchSuggestions,
    matchMutation,
    matching,
    unmatchMutation,
    unmatching,
    validateMutation,
    validating,
    bulkValidateMutations,
    bulkValidating,
  } = useMutasiBankPage();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedMutationIds, setSelectedMutationIds] = useState([]);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [validationTarget, setValidationTarget] = useState(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchTarget, setMatchTarget] = useState(null);
  const [matchSuggestions, setMatchSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const hasSelection = selectedMutationIds.length > 0;

  const invalidateMutations = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mutasiBank'] });
  }, [queryClient]);

  const handleUploadFile = useCallback(
    async (file) => {
      try {
        const response = await uploadMutationFile(file);
        if (response) {
          setUploadModalOpen(false);
        }
        invalidateMutations();
      } catch (error) {
        console.error('Upload mutasi bank gagal:', error);
      }
    },
    [uploadMutationFile, invalidateMutations]
  );

  const handleSelectMutation = useCallback((mutationId, checked) => {
    if (!mutationId) {
      return;
    }

    setSelectedMutationIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(mutationId);
      } else {
        next.delete(mutationId);
      }
      return Array.from(next);
    });
  }, []);

  const handleSelectAllMutations = useCallback((currentIds = [], selectAll) => {
    setSelectedMutationIds((prev) => {
      const next = new Set(prev);
      currentIds.forEach((id) => {
        if (!id) {
          return;
        }
        if (selectAll) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return Array.from(next);
    });
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSelectedMutationIds([]);
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

  const fetchSuggestions = useCallback(
    async (mutationId) => {
      setSuggestionsLoading(true);
      try {
        const response = await fetchMatchSuggestions(mutationId);
        setMatchSuggestions(response);
      } catch (error) {
        console.error('Gagal memuat saran dokumen mutasi bank:', error);
        setMatchSuggestions(null);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    [fetchMatchSuggestions]
  );

  const handleOpenMatchModal = useCallback(
    async (mutation, mutationId) => {
      const targetId = mutationId || resolveMutationId(mutation);
      if (!targetId) {
        toastService.error('Mutasi bank tidak memiliki ID yang valid.');
        return;
      }

      setMatchTarget({ id: targetId, mutation });
      setMatchModalOpen(true);
      await fetchSuggestions(targetId);
    },
    [fetchSuggestions]
  );

  const handleCloseMatchModal = useCallback(() => {
    setMatchModalOpen(false);
    setMatchTarget(null);
    setMatchSuggestions(null);
  }, []);

  const handleMatchMutation = useCallback(
    async ({ type, invoiceId }) => {
      if (!matchTarget?.id) {
        toastService.error('Mutasi bank tidak ditemukan.');
        return;
      }

      try {
        await matchMutation(matchTarget.id, {
          type,
          invoiceId,
        });
        handleCloseMatchModal();
        invalidateMutations();
      } catch (error) {
        console.error('Gagal melakukan match mutasi bank:', error);
      }
    },
    [matchMutation, matchTarget, handleCloseMatchModal, invalidateMutations]
  );

  const handleUnmatchMutation = useCallback(
    async (mutation, mutationId) => {
      const targetId = mutationId || resolveMutationId(mutation);
      if (!targetId) {
        toastService.error('Mutasi bank tidak memiliki ID yang valid.');
        return;
      }

      try {
        await unmatchMutation(targetId);
        invalidateMutations();
      } catch (error) {
        console.error('Gagal melakukan unmatch mutasi bank:', error);
      }
    },
    [unmatchMutation, invalidateMutations]
  );

  const handleOpenValidateModal = useCallback((mutation, mutationId) => {
    const targetId = mutationId || resolveMutationId(mutation);
    if (!targetId && !hasSelection) {
      toastService.error('Pilih mutasi bank yang ingin divalidasi.');
      return;
    }

    if (targetId) {
      setValidationTarget({
        mode: 'single',
        id: targetId,
        mutation,
      });
    } else {
      setValidationTarget({
        mode: 'bulk',
        mutationIds: selectedMutationIds,
      });
    }

    setValidateModalOpen(true);
  }, [hasSelection, selectedMutationIds]);

  const handleCloseValidateModal = useCallback(() => {
    setValidateModalOpen(false);
    setValidationTarget(null);
  }, []);

  const handleSubmitValidation = useCallback(
    async ({ status, notes }) => {
      if (!validationTarget) {
        return;
      }

      try {
        if (validationTarget.mode === 'bulk') {
          await bulkValidateMutations({
            mutationIds: validationTarget.mutationIds,
            status,
            notes,
          });
          setSelectedMutationIds([]);
        } else if (validationTarget.id) {
          await validateMutation(validationTarget.id, { status, notes });
        }
        invalidateMutations();
        handleCloseValidateModal();
      } catch (error) {
        console.error('Gagal memvalidasi mutasi bank:', error);
      }
    },
    [
      bulkValidateMutations,
      invalidateMutations,
      validateMutation,
      validationTarget,
      handleCloseValidateModal,
    ]
  );

  useEffect(() => {
    setSelectedMutationIds([]);
  }, [activeTab]);

  const bulkValidateSelected = useCallback(() => {
    if (!hasSelection) {
      toastService.warning('Pilih mutasi bank terlebih dahulu.');
      return;
    }
    setValidationTarget({
      mode: 'bulk',
      mutationIds: selectedMutationIds,
    });
    setValidateModalOpen(true);
  }, [hasSelection, selectedMutationIds]);

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
                {hasSelection ? (
                  <span className='inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600'>
                    {selectedMutationIds.length} mutasi dipilih
                  </span>
                ) : null}
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
              onClick={bulkValidateSelected}
              disabled={!hasSelection || validating || bulkValidating}
              className='inline-flex items-center rounded-md bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50'
            >
              <ShieldCheckIcon className='mr-2 h-4 w-4' />
              Validasi Terpilih
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
            selectedMutationIds={selectedMutationIds}
            onSelectMutation={handleSelectMutation}
            onSelectAllMutations={handleSelectAllMutations}
            onViewMutation={handleViewMutation}
            onMatchMutation={handleOpenMatchModal}
            onUnmatchMutation={handleUnmatchMutation}
            onValidateMutation={handleOpenValidateModal}
            isMatching={matching}
            isUnmatching={unmatching}
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
        loading={validating || bulkValidating}
        mutation={validationTarget?.mutation}
        initialStatus={
          validationTarget?.mutation?.validation_status ||
          validationTarget?.mutation?.validationStatus ||
          'VALID'
        }
        selectedCount={
          validationTarget?.mode === 'bulk'
            ? validationTarget?.mutationIds?.length || 0
            : 1
        }
      />

      <MutasiBankMatchModal
        open={matchModalOpen}
        onClose={handleCloseMatchModal}
        suggestions={matchSuggestions}
        loading={suggestionsLoading}
        onMatch={handleMatchMutation}
        onRefresh={() => {
          if (matchTarget?.id) {
            fetchSuggestions(matchTarget.id);
          }
        }}
        isMatching={matching}
      />
    </div>
  );
};

export default MutasiBank;
