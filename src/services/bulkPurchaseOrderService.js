import { get } from './apiService';

const bulkPurchaseOrderService = {
  getAll: (params) => get('/purchase-orders/bulk/all', params),
  getStatus: (id) => get(`/purchase-orders/bulk/status/${id}`),
};

export default bulkPurchaseOrderService;


