const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const JAKARTA_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

const toDateInstance = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toJakartaDate = (value) => {
  const sourceDate = toDateInstance(value);
  if (!sourceDate) return null;

  const utcTimestamp =
    sourceDate.getTime() + sourceDate.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTimestamp + JAKARTA_UTC_OFFSET_MS);
};

const pad2 = (value) => value.toString().padStart(2, '0');

export const formatDateTime = (value) => {
  const jakartaDate = toJakartaDate(value);
  if (!jakartaDate) return 'N/A';

  const dayName = DAYS[jakartaDate.getDay()];
  const dayOfMonth = jakartaDate.getDate();
  const monthName = MONTHS[jakartaDate.getMonth()];
  const year = jakartaDate.getFullYear();
  const hours = pad2(jakartaDate.getHours());
  const minutes = pad2(jakartaDate.getMinutes());

  return `${dayName}, ${dayOfMonth} ${monthName} ${year}, ${hours}:${minutes} WIB`;
};

export const formatDate = (value, { withDayName = false } = {}) => {
  const jakartaDate = toJakartaDate(value);
  if (!jakartaDate) return 'N/A';

  const dayName = DAYS[jakartaDate.getDay()];
  const dayOfMonth = jakartaDate.getDate();
  const monthName = MONTHS[jakartaDate.getMonth()];
  const year = jakartaDate.getFullYear();

  const base = `${dayOfMonth} ${monthName} ${year}`;
  return withDayName ? `${dayName}, ${base}` : base;
};

export const formatDateForInput = (value) => {
  const jakartaDate = toJakartaDate(value);
  if (!jakartaDate) return '';

  const year = jakartaDate.getFullYear();
  const month = pad2(jakartaDate.getMonth() + 1);
  const day = pad2(jakartaDate.getDate());

  return `${year}-${month}-${day}`;
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return 'N/A';
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '0';
  }
  return num.toLocaleString('id-ID');
};

export const compareDates = (a, b) => {
  const parse = (val) => {
    if (!val || val === '-') return 0;
    if (val instanceof Date) return val.getTime();
    const str = String(val).trim();
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return new Date(parts[0], parts[1] - 1, parts[2]).getTime() || 0;
      }
      // DD/MM/YYYY
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime() || 0;
    }
    const t = new Date(str).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return parse(a) - parse(b);
};

export const dateSortingFn = (rowA, rowB, columnId) => {
  return compareDates(rowA.getValue(columnId), rowB.getValue(columnId));
};

