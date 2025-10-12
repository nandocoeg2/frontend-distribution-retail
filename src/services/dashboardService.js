import { get } from './apiService';

const OPERATIONAL_ENDPOINT = '/dashboard/operational';
const FINANCIAL_ENDPOINT = '/dashboard/financial';
const INVENTORY_ENDPOINT = '/dashboard/inventory';

const buildParams = ({ period, startDate, endDate }) => {
  const params = {};
  if (period) {
    params.period = period;
  }
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }
  return params;
};

export const getOperationalDashboard = (filters = {}) => {
  return get(OPERATIONAL_ENDPOINT, buildParams(filters));
};

export const getFinancialDashboard = (filters = {}) => {
  return get(FINANCIAL_ENDPOINT, buildParams(filters));
};

export const getInventoryDashboard = () => {
  return get(INVENTORY_ENDPOINT);
};

export default {
  getOperationalDashboard,
  getFinancialDashboard,
  getInventoryDashboard,
};
