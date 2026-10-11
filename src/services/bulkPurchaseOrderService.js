import { get, post } from './apiService';

const bulkPurchaseOrderService = {
  getAll: (params) => get('/bulk-purchase-order/bulk/files', params || {}),
  getStatus: (bulkId) => get('/bulk-purchase-order/bulk/status/' + bulkId),
  getFileById: (fileId) => get('/bulk-purchase-order/bulk/file/' + fileId),
  retryFile: (fileId, data) => post('/bulk-purchase-order/bulk/file/' + fileId + '/retry', data || {}),
  retryFileTextExtraction: (fileId) => post('/bulk-purchase-order/bulk/file/' + fileId + '/retry-text-extraction', {}),
  // Jawaban popup Indikasi PO Pengganti: confirm=true (Iya) / false (Tidak)
  resolveIndikasiPengganti: (fileId, confirm) => post('/bulk-purchase-order/bulk/file/' + fileId + '/indikasi-pengganti', { confirm }),
};

export default bulkPurchaseOrderService;
