import authService from './authService';

const API_BASE_URL = `${process.env.BACKEND_BASE_URL}api/v1/inventory-control`;

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${authService.getToken()}`,
});

const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

/**
 * Fetch monthly inventory control recap.
 * @param {string|object} startDateOrParams - YYYY-MM-DD string or params object
 * @param {string} endDate - YYYY-MM-DD string
 * @param {number} page
 * @param {number} limit
 * @param {string} q - search term (item name / PLU)
 */
export const getInventoryControl = async (
  startDateOrParams, endDate, page = 1, limit = 20, q = ''
) => {
  let params = {};
  if (typeof startDateOrParams === 'object' && startDateOrParams !== null) {
    params = startDateOrParams;
  } else if (typeof startDateOrParams === 'number') {
    // Legacy support if fromYear was passed as first arg
    const [fromYear, fromMonth, toYear, toMonth, p, l, search] = arguments;
    params = { fromYear, fromMonth, toYear, toMonth, page: p || 1, limit: l || 20, q: search || '' };
  } else {
    params = { startDate: startDateOrParams, endDate, page, limit, q };
  }

  const query = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}${query}`, { headers: buildHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal memuat data inventory control');
  }
  return res.json();
};

/**
 * Download inventory control recap as Excel.
 */
export const exportInventoryControlExcel = async (
  startDateOrParams, endDate, q = ''
) => {
  let params = {};
  if (typeof startDateOrParams === 'object' && startDateOrParams !== null) {
    params = startDateOrParams;
  } else if (typeof startDateOrParams === 'number') {
    const [fromYear, fromMonth, toYear, toMonth, search] = arguments;
    params = { fromYear, fromMonth, toYear, toMonth, q: search || '' };
  } else {
    params = { startDate: startDateOrParams, endDate, q };
  }

  const query = buildQuery(params);
  const res = await fetch(`${API_BASE_URL}/export-excel${query}`, { headers: buildHeaders() });
  if (!res.ok) throw new Error('Gagal export Excel');

  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = 'Inventory_Control.xlsx';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return { success: true, filename };
};

export default { getInventoryControl, exportInventoryControlExcel };
