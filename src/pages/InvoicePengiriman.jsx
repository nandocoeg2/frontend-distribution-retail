import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import { InvoicePengirimanTableServerSide } from '@/components/invoicePengiriman';
import InvoicePengirimanDetailCard from '@/components/invoicePengiriman/InvoicePengirimanDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import GenerateInvoicePenagihanDialog from '@/components/invoicePengiriman/GenerateInvoicePenagihanDialog';
import invoicePengirimanService from '@/services/invoicePengirimanService';
import toastService from '@/services/toastService';

const InvoicePengirimanPage = () => {
  const queryClient = useQueryClient();

  const { handleAuthError } = useInvoicePengiriman();

  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [exportFilters, setExportFilters] = useState({});
  const [generateConfirmation, setGenerateConfirmation] = useState({
    show: false,
    invoiceIds: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInvoiceDetail = useCallback(
    async (id) => {
      try {
        const response =
          await invoicePengirimanService.getInvoicePengirimanById(id);
        if (response?.success === false) {
          throw new Error(
            response?.error?.message || 'Gagal memuat detail invoice pengiriman'
          );
        }
        return response?.data ?? response;
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleAuthError();
          return null;
        }
        throw err;
      }
    },
    [handleAuthError]
  );

  const handleViewDetail = useCallback(
    async (invoice) => {
      if (!invoice?.id) {
        console.error('Invoice ID tidak ditemukan untuk detail view');
        return;
      }

      setDetailLoading(true);
      try {
        // Fetch detail data using GET /:id endpoint
        const detailData = await fetchInvoiceDetail(invoice.id);
        setSelectedInvoiceForDetail(detailData);
      } catch (err) {
        // If fetch fails, fallback to list data
        console.warn('Failed to fetch invoice details, using list data:', err.message);
        setSelectedInvoiceForDetail(invoice);
      } finally {
        setDetailLoading(false);
      }
    },
    [fetchInvoiceDetail]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedInvoiceForDetail(null);
  }, []);

  const handleInvoiceUpdated = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['invoicePengiriman'] });

    if (!selectedInvoiceForDetail?.id) {
      return;
    }

    try {
      const updatedDetail = await fetchInvoiceDetail(selectedInvoiceForDetail.id);
      if (updatedDetail) {
        setSelectedInvoiceForDetail(updatedDetail);
      }
    } catch (error) {
      console.warn('Failed to refresh invoice detail after update:', error);
    }
  }, [fetchInvoiceDetail, queryClient, selectedInvoiceForDetail?.id]);

  const handleSelectInvoice = useCallback((invoiceId) => {
    setSelectedInvoices((prev) => {
      if (prev.includes(invoiceId)) {
        return prev.filter((id) => id !== invoiceId);
      }
      return [...prev, invoiceId];
    });
  }, []);

  const handleSelectAllInvoices = useCallback((currentInvoices) => {
    if (selectedInvoices.length === currentInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(currentInvoices.map((invoice) => invoice.id));
    }
  }, [selectedInvoices.length]);

  const hasSelectedInvoices = selectedInvoices.length > 0;

  const handleBulkDeleteSuccess = useCallback(
    async ({ deletedIds = [], failedIds = [] } = {}) => {
      setSelectedInvoices(failedIds);

      if (
        selectedInvoiceForDetail?.id &&
        deletedIds.includes(selectedInvoiceForDetail.id)
      ) {
        setSelectedInvoiceForDetail(null);
      }

      await queryClient.invalidateQueries({ queryKey: ['invoicePengiriman'] });
    },
    [queryClient, selectedInvoiceForDetail?.id]
  );

  // Convert column filters (array format) to backend query params (object format)
  const convertFiltersToParams = useCallback((columnFilters) => {
    if (!columnFilters || !Array.isArray(columnFilters) || columnFilters.length === 0) {
      return {};
    }

    const params = {};
    for (const filter of columnFilters) {
      const { id, value } = filter;
      if (value === undefined || value === null || value === '') continue;

      // Handle date range filters
      if (id === 'tanggal' && typeof value === 'object' && (value.from || value.to)) {
        if (value.from) params.tanggal_start = value.from;
        if (value.to) params.tanggal_end = value.to;
      }
      // Handle print date range filters
      else if (id === 'print_date' && typeof value === 'object' && (value.from || value.to)) {
        if (value.from) params.print_date_start = value.from;
        if (value.to) params.print_date_end = value.to;
      }
      // Handle grand total range filters
      else if (id === 'grand_total' && typeof value === 'object' && (value.min || value.max)) {
        if (value.min) params.grand_total_min = value.min;
        if (value.max) params.grand_total_max = value.max;
      }
      // Handle array filters (customerIds, status_codes)
      else if (Array.isArray(value) && value.length > 0) {
        params[id] = value;
      }
      // Handle simple string/boolean values
      else if (typeof value === 'string' || typeof value === 'boolean') {
        params[id] = value;
      }
    }
    return params;
  }, []);

  const handleExportExcel = useCallback((columnFilters) => {
    const params = convertFiltersToParams(columnFilters);
    setExportFilters(params);
    setShowExportConfirmation(true);
  }, [convertFiltersToParams]);

  const confirmExportExcel = useCallback(async () => {
    setShowExportConfirmation(false);
    setExportLoading(true);
    try {
      await invoicePengirimanService.exportExcel(exportFilters);
      toastService.success('Data berhasil diexport ke Excel');
    } catch (err) {
      console.error('Export failed:', err);
      toastService.error(err.message || 'Gagal mengexport data');
    } finally {
      setExportLoading(false);
    }
  }, [exportFilters]);

  const openGenerateDialog = useCallback((invoiceIds) => {
    if (!invoiceIds || invoiceIds.length === 0) {
      toastService.error('Tidak ada invoice yang dipilih');
      return;
    }
    setGenerateConfirmation({
      show: true,
      invoiceIds,
    });
  }, []);

  const closeGenerateDialog = useCallback(() => {
    setGenerateConfirmation({
      show: false,
      invoiceIds: [],
    });
  }, []);

  const handleGenerateConfirm = useCallback(async (tanggalDokumen) => {
    const invoiceIds = generateConfirmation.invoiceIds;

    if (!invoiceIds || invoiceIds.length === 0) {
      closeGenerateDialog();
      return;
    }

    setIsGenerating(true);
    try {
      toastService.info(`Memproses ${invoiceIds.length} invoice (membuat 3 dokumen per invoice)...`);

      let successCount = 0;
      let failCount = 0;

      // Loop through selected invoices and generate invoice penagihan
      for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];

        try {
          const response = await invoicePengirimanService.generateInvoicePenagihan(invoiceId, {
            tanggal_dokumen: tanggalDokumen,
          });

          if (response?.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error generating invoice penagihan for ${invoiceId}:`, error);
        }

        // Small delay between requests to prevent overwhelming the server
        if (i < invoiceIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Show results with enhanced messaging
      if (successCount > 0 && failCount === 0) {
        toastService.success(`✅ Berhasil membuat semua dokumen untuk ${successCount} invoice (Invoice Penagihan + Kwitansi + Faktur Pajak)`);
      } else if (successCount > 0 && failCount > 0) {
        toastService.warning(`✅ Berhasil membuat semua dokumen untuk ${successCount} invoice. ${failCount} gagal.`);
      } else {
        toastService.error('❌ Gagal membuat dokumen invoice');
      }

      // Clear selection and refresh data
      setSelectedInvoices([]);
      await queryClient.invalidateQueries({ queryKey: ['invoicePengiriman'] });
      closeGenerateDialog();
    } catch (error) {
      console.error('Error in bulk generate:', error);
      toastService.error(error.message || 'Gagal membuat dokumen invoice');
    } finally {
      setIsGenerating(false);
    }
  }, [generateConfirmation.invoiceIds, closeGenerateDialog, queryClient]);

  return (
    <div>
      <div className='overflow-hidden bg-white rounded-lg shadow'>
        <div className='px-3 py-3 space-y-2'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold text-gray-900'>Invoice Pengiriman</h3>
          </div>

          <InvoicePengirimanTableServerSide
            onBulkDelete={handleBulkDeleteSuccess}
            selectedInvoices={selectedInvoices}
            onSelectInvoice={handleSelectInvoice}
            onSelectAllInvoices={handleSelectAllInvoices}
            hasSelectedInvoices={hasSelectedInvoices}
            onViewDetail={handleViewDetail}
            selectedInvoiceId={selectedInvoiceForDetail?.id}
            onExportExcel={handleExportExcel}
            exportLoading={exportLoading}
            onOpenGenerateDialog={openGenerateDialog}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {selectedInvoiceForDetail && (
        <InvoicePengirimanDetailCard invoice={selectedInvoiceForDetail} onClose={handleCloseDetail} loading={detailLoading} onUpdate={handleInvoiceUpdated} />
      )}

      <ConfirmationDialog
        show={showExportConfirmation}
        onClose={() => setShowExportConfirmation(false)}
        onConfirm={confirmExportExcel}
        title='Konfirmasi Export'
        message='Apakah Anda yakin ingin mengexport data ini ke Excel?'
        type='info'
        confirmText='Ya, Export'
        cancelText='Batal'
        loading={exportLoading}
      />

      <GenerateInvoicePenagihanDialog
        show={generateConfirmation.show}
        onClose={closeGenerateDialog}
        onConfirm={handleGenerateConfirm}
        invoiceCount={generateConfirmation.invoiceIds.length}
        loading={isGenerating}
      />
    </div>
  );
};

export default InvoicePengirimanPage;
