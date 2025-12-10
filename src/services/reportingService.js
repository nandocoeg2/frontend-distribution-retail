import { get } from './apiService';

const OPERATIONAL_ENDPOINT = '/reporting/operational';
const FINANCIAL_ENDPOINT = '/reporting/financial';
const INVENTORY_ENDPOINT = '/reporting/items';

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

export const getOperationalReporting = (filters = {}) => {
  return get(OPERATIONAL_ENDPOINT, buildParams(filters));
};

export const getFinancialReporting = (filters = {}) => {
  return get(FINANCIAL_ENDPOINT, buildParams(filters));
};

export const getItemReporting = () => {
  return get(INVENTORY_ENDPOINT);
};

export default {
  getOperationalReporting,
  getFinancialReporting,
  getItemReporting,
};
