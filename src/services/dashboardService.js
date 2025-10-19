import { get } from './apiService';

const DASHBOARD_SUMMARY_ENDPOINT = '/dashboard/summary';

export const getPurchaseOrderSummary = (params = {}) => {
  return get(DASHBOARD_SUMMARY_ENDPOINT, params);
};

export default {
  getPurchaseOrderSummary,
};
