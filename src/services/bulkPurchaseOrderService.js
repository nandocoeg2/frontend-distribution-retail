import { get, post } from './apiService';

const bulkPurchaseOrderService = {
  getAll: (params) => get('/bulk-purchase-order/bulk/files', params || {}),
  getStatus: (bulkId) => get('/bulk-purchase-order/bulk/status/' + bulkId),
  getFileById: (fileId) => get('/bulk-purchase-order/bulk/file/' + fileId),
  retryFile: (fileId, data) => post('/bulk-purchase-order/bulk/file/' + fileId + '/retry', data || {}),
};

export default bulkPurchaseOrderService;
