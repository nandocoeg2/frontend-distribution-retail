import { get } from './apiService';

const bulkPurchaseOrderService = {
  getAll: (params) => get('/bulk-purchase-order/bulk/files', params || {}),
  getStatus: (id) => get('/bulk-purchase-order/bulk/status/' + id),
};

export default bulkPurchaseOrderService;
