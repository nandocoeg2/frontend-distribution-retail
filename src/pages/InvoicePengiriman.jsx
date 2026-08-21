import React, { useCallback, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useInvoicePengiriman from '@/hooks/useInvoicePengirimanPage';
import { InvoicePengirimanTableServerSide } from '@/components/invoicePengiriman';
import InvoicePengirimanDetailCard from '@/components/invoicePengiriman/InvoicePengirimanDetailCard';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { TableFooterCell } from '@/components/table';
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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [localFilters, setLocalFilters] = useState({
    no_invoice: '',
    po: '',
    customer: '',
    tanggal_invoice: '',
    top: '',
    status: '',
    plu: '',
    nama_barang: '',
    quantity: '',
    harga: '',
    potongan_a: '',
    harga_after_potongan_a: '',
    potongan_b: '',
    harga_after_potongan_b: '',
    total: '',
    sub_total: '',
    total_discount: '',
    ppn_percentage: '',
    grand_total: '',
  });

  const filteredPreviewData = useMemo(() => {
    if (!previewData?.data) return [];
    return previewData.data.filter(row => {
      return (
        String(row.no_invoice || '').toLowerCase().includes(localFilters.no_invoice.toLowerCase()) &&
        String(row.po || '').toLowerCase().includes(localFilters.po.toLowerCase()) &&
        String(row.customer || '').toLowerCase().includes(localFilters.customer.toLowerCase()) &&
        String(row.tanggal_invoice || '').toLowerCase().includes(localFilters.tanggal_invoice.toLowerCase()) &&
        String(row.top || '').toLowerCase().includes(localFilters.top.toLowerCase()) &&
        String(row.status || '').toLowerCase().includes(localFilters.status.toLowerCase()) &&
        String(row.plu || '').toLowerCase().includes(localFilters.plu.toLowerCase()) &&
        String(row.nama_barang || '').toLowerCase().includes(localFilters.nama_barang.toLowerCase()) &&
        String(row.quantity ?? '').toLowerCase().includes(localFilters.quantity.toLowerCase()) &&
        String(row.harga ?? '').toLowerCase().includes(localFilters.harga.toLowerCase()) &&
        String(row.potongan_a ?? '').toLowerCase().includes(localFilters.potongan_a.toLowerCase()) &&
        String(row.harga_after_potongan_a ?? '').toLowerCase().includes(localFilters.harga_after_potongan_a.toLowerCase()) &&
        String(row.potongan_b ?? '').toLowerCase().includes(localFilters.potongan_b.toLowerCase()) &&
        String(row.harga_after_potongan_b ?? '').toLowerCase().includes(localFilters.harga_after_potongan_b.toLowerCase()) &&
        String(row.total ?? '').toLowerCase().includes(localFilters.total.toLowerCase()) &&
        String(row.sub_total ?? '').toLowerCase().includes(localFilters.sub_total.toLowerCase()) &&
        String(row.total_discount ?? '').toLowerCase().includes(localFilters.total_discount.toLowerCase()) &&
        String(row.ppn_percentage ?? '').toLowerCase().includes(localFilters.ppn_percentage.toLowerCase()) &&
        String(row.grand_total ?? '').toLowerCase().includes(localFilters.grand_total.toLowerCase())
      );
    });
  }, [previewData, localFilters]);


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

  const handlePreviewExcel = useCallback(async (columnFilters) => {
    setPreviewLoading(true);
    setShowPreviewModal(true);
    setLocalFilters({
      no_invoice: '',
      po: '',
      customer: '',
      tanggal_invoice: '',
      top: '',
      status: '',
      plu: '',
      nama_barang: '',
      quantity: '',
      harga: '',
      potongan_a: '',
      harga_after_potongan_a: '',
      potongan_b: '',
      harga_after_potongan_b: '',
      total: '',
      sub_total: '',
      total_discount: '',
      ppn_percentage: '',
      grand_total: '',
    });

    try {
      const params = convertFiltersToParams(columnFilters);
      const response = await invoicePengirimanService.previewExportExcel(params);
      const resData = response?.success ? response.data : response;
      setPreviewData(resData);
    } catch (err) {
      console.error('Preview failed:', err);
      toastService.error(err.message || 'Gagal memuat preview data');
      setShowPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [convertFiltersToParams]);



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
            onPreviewExcel={handlePreviewExcel}
            previewLoading={previewLoading}
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



      {/* Excel Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" onClick={() => setShowPreviewModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full border border-gray-100">
              <div className="bg-white px-6 pt-6 pb-4 sm:pb-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                    <span className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Preview Hasil Export Excel (Invoice Pengiriman)
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Menyiapkan preview data...</p>
                  </div>
                ) : !previewData || previewData.data?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-semibold text-gray-900">Tidak ada data untuk diexport</p>
                    <p className="text-xs text-gray-500 mt-1">Silakan sesuaikan filter pencarian Anda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh] border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          {previewData.headers?.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-100/50">
                          {Object.keys(localFilters).map((key) => (
                            <th key={key} className="px-3 py-1.5 border-b border-gray-200 min-w-[120px]">
                              <input
                                type="text"
                                value={localFilters[key]}
                                onChange={(e) => setLocalFilters({ ...localFilters, [key]: e.target.value })}
                                placeholder={`Filter ${key.replace('_', ' ')}...`}
                                className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-normal bg-white"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredPreviewData.length === 0 ? (
                          <tr>
                            <td colSpan={previewData.headers?.length || 15} className="px-4 py-8 text-center text-gray-500 font-medium bg-gray-50/50">
                              Tidak ada data yang cocok dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-gray-50/70 transition-colors odd:bg-white even:bg-gray-50/30">
                              <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{row.no_invoice}</td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{row.po}</td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-medium">{row.customer}</td>
                              <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{row.tanggal_invoice}</td>
                              <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap font-mono">{row.top}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${row.status?.includes('LUNAS') || row.status?.includes('PAID')
                                  ? 'bg-green-50 text-green-700'
                                  : row.status?.includes('POSTED')
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap font-mono">{row.plu}</td>
                              <td className="px-4 py-2.5 text-gray-800 font-medium max-w-xs truncate" title={row.nama_barang}>{row.nama_barang}</td>
                              <td className="px-4 py-2.5 text-gray-900 font-semibold text-right pr-6">{row.quantity}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{row.harga.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{(row.potongan_a ?? 0)}%</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{(row.harga_after_potongan_a ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{(row.potongan_b ?? 0)}%</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{(row.harga_after_potongan_b ?? 0).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-900 font-medium text-right pr-6">{row.total.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{row.sub_total.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{row.total_discount.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-2.5 text-gray-700 text-right pr-6">{row.ppn_percentage}%</td>
                              <td className="px-4 py-2.5 text-gray-900 font-bold text-right pr-6">{row.grand_total.toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredPreviewData.length > 0 && (
                        <tfoot className="bg-gray-100 font-bold sticky bottom-0 border-t border-gray-300 z-10">
                          <tr>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'no_invoice' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'po' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'customer' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'tanggal_invoice' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'top' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'status' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'plu' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'nama_barang' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'quantity' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'harga' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'potongan_a' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'harga_after_potongan_a' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'potongan_b' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'harga_after_potongan_b' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'total' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'sub_total' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'total_discount' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300 border-r border-gray-200">
                              <TableFooterCell column={{ id: 'ppn_percentage' }} data={filteredPreviewData} />
                            </td>
                            <td className="px-3 py-1.5 text-xs border-t border-gray-300">
                              <TableFooterCell column={{ id: 'grand_total' }} data={filteredPreviewData} />
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors sm:w-auto"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePengirimanPage;
