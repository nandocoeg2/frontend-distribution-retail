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
 * @param {number} fromYear
 * @param {number} fromMonth  1–12
 * @param {number} toYear
 * @param {number} toMonth    1–12
 * @param {number} page
 * @param {number} limit
 * @param {string} q          search term (item name / PLU)
 */
export const getInventoryControl = async (
  fromYear, fromMonth, toYear, toMonth,
  page = 1, limit = 20, q = ''
) => {
  const query = buildQuery({ fromYear, fromMonth, toYear, toMonth, page, limit, q });
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
  fromYear, fromMonth, toYear, toMonth, q = ''
) => {
  const query = buildQuery({ fromYear, fromMonth, toYear, toMonth, q });
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
