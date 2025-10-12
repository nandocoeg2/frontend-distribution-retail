/**
 * Modal Utilities
 * Common utility functions used across modal components
 */

import { formatDate } from './formatUtils';

/**
 * Expose shared formatting helpers
 */
export { formatDateTime, formatDate, formatCurrency } from './formatUtils';

/**
 * Format date for Indonesian locale (short format)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
  return formatDate(date);
};

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (!number && number !== 0) return 'N/A';
  return new Intl.NumberFormat('id-ID').format(number);
};

/**
 * Resolve status badge color variant based on status text
 * Standardized color scheme:
 * - Complete = Hijau (success)
 * - Failed = Merah (danger)
 * - Processed = Biru (primary)
 * - Processing/In Progress = Kuning (warning)
 * - Pending/Draft = Abu-abu (secondary)
 *
 * @param {string} status - Status text
 * @returns {string} Color variant name
 */
export const resolveStatusVariant = (status) => {
  const value = typeof status === 'string' ? status.toLowerCase() : '';

  if (!value) {
    return 'secondary';
  }

  // Complete = Hijau
  if (
    value.includes('complete') ||
    value.includes('completed') ||
    value.includes('selesai') ||
    value.includes('success') ||
    value.includes('approve') ||
    value.includes('approved') ||
    value.includes('delivered')
  ) {
    return 'success';
  }

  // Failed = Merah
  if (
    value.includes('failed') ||
    value.includes('fail') ||
    value.includes('error') ||
    value.includes('reject') ||
    value.includes('rejected') ||
    value.includes('cancel') ||
    value.includes('cancelled') ||
    value.includes('batal')
  ) {
    return 'danger';
  }

  // Processed = Biru (check processed but not processing)
  if (
    (value.includes('processed') && !value.includes('processing')) ||
    value.includes('ready') ||
    value.includes('ready_to_ship') ||
    value.includes('packed') ||
    value.includes('shipped')
  ) {
    return 'primary';
  }

  // Processing/In Progress = Kuning
  if (
    value.includes('processing') ||
    value.includes('proses') ||
    value.includes('in progress') ||
    value.includes('in_progress') ||
    value.includes('shipping')
  ) {
    return 'warning';
  }

  // Pending/Draft = Netral/Abu-abu
  if (
    value.includes('pending') ||
    value.includes('menunggu') ||
    value.includes('waiting') ||
    value.includes('draft')
  ) {
    return 'secondary';
  }

  return 'default';
};

/**
 * Alias for resolveStatusVariant for backward compatibility
 * @deprecated Use resolveStatusVariant instead
 */
export const getStatusVariant = resolveStatusVariant;

/**
 * Get stock status and variant based on current and minimum stock
 * @param {number} currentStock - Current stock amount
 * @param {number} minStock - Minimum stock threshold
 * @returns {object} Object with status and variant
 */
export const getStockStatus = (currentStock, minStock) => {
  if (currentStock <= minStock) {
    return { status: 'Low Stock', variant: 'danger' };
  } else if (currentStock <= minStock * 1.5) {
    return { status: 'Warning', variant: 'warning' };
  }
  return { status: 'In Stock', variant: 'success' };
};

/**
 * Modal theme configurations for different entity types
 */
export const modalThemes = {
  customer: {
    gradientFrom: 'from-green-50',
    gradientTo: 'to-emerald-50',
    iconBgColor: 'bg-green-100',
    icon: 'ðŸ‘¤'
  },
  supplier: {
    gradientFrom: 'from-purple-50',
    gradientTo: 'to-indigo-50',
    iconBgColor: 'bg-purple-100',
    icon: 'ðŸ¢'
  },
  inventory: {
    gradientFrom: 'from-orange-50',
    gradientTo: 'to-amber-50',
    iconBgColor: 'bg-orange-100',
    icon: 'ðŸ“¦'
  },
  invoice: {
    gradientFrom: 'from-indigo-50',
    gradientTo: 'to-blue-50',
    iconBgColor: 'bg-indigo-100',
    icon: 'ðŸ§¾'
  },
  suratJalan: {
    gradientFrom: 'from-teal-50',
    gradientTo: 'to-cyan-50',
    iconBgColor: 'bg-teal-100',
    icon: 'ðŸšš'
  },
  purchaseOrder: {
    gradientFrom: 'from-emerald-50',
    gradientTo: 'to-green-50',
    iconBgColor: 'bg-emerald-100',
    icon: 'ðŸ›’'
  },
  packing: {
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-50',
    iconBgColor: 'bg-blue-100',
    icon: 'ðŸ“¦'
  }
};

/**
 * Get theme configuration for a specific entity type
 * @param {string} entityType - Type of entity
 * @returns {object} Theme configuration
 */
export const getModalTheme = (entityType) => {
  return modalThemes[entityType] || modalThemes.customer;
};

/**
 * Toggle section expansion state
 * @param {object} sections - Current sections state
 * @param {string} sectionKey - Key of section to toggle
 * @returns {object} Updated sections state
 */
export const toggleSection = (sections, sectionKey) => ({
  ...sections,
  [sectionKey]: !sections[sectionKey]
});

/**
 * Create initial expanded sections state
 * @param {array} sectionKeys - Array of section keys
 * @param {string} defaultExpanded - Key of section that should be expanded by default
 * @returns {object} Initial sections state
 */
export const createInitialSections = (sectionKeys, defaultExpanded = null) => {
  const sections = {};
  sectionKeys.forEach(key => {
    sections[key] = key === defaultExpanded;
  });
  return sections;
};

/**
 * Get action icon for audit trail
 * @param {string} action - Action type
 * @returns {string} Emoji icon
 */
export const getActionIcon = (action) => {
  const iconMap = {
    'CREATE': 'âœ¨',
    'UPDATE': 'ðŸ“',
    'DELETE': 'ðŸ—‘ï¸',
    'APPROVE': 'âœ…',
    'REJECT': 'âŒ',
    'SUBMIT': 'ðŸ“¤',
    'PROCESS': 'âš™ï¸',
    'COMPLETE': 'ðŸŽ‰',
    'DEFAULT': 'ðŸ”„'
  };
  return iconMap[action?.toUpperCase()] || iconMap.DEFAULT;
};

/**
 * Get action color for audit trail
 * @param {string} action - Action type
 * @returns {string} CSS class for background color
 */
export const getActionColor = (action) => {
  const colorMap = {
    'CREATE': 'bg-green-100',
    'UPDATE': 'bg-blue-100',
    'DELETE': 'bg-red-100',
    'APPROVE': 'bg-emerald-100',
    'REJECT': 'bg-red-100',
    'SUBMIT': 'bg-purple-100',
    'PROCESS': 'bg-orange-100',
    'COMPLETE': 'bg-green-100',
    'DEFAULT': 'bg-gray-100'
  };
  return colorMap[action?.toUpperCase()] || colorMap.DEFAULT;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * Validate if data exists and is not empty
 * @param {any} data - Data to validate
 * @returns {boolean} Validation result
 */
export const validateModalData = (data) => {
  return data && typeof data === 'object' && Object.keys(data).length > 0;
};

/**
 * Safe data accessor that returns fallback value
 * @param {object} obj - Object to access
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @param {any} fallback - Fallback value
 * @returns {any} Value or fallback
 */
export const safeGet = (obj, path, fallback = 'N/A') => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
    }
    return result || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

