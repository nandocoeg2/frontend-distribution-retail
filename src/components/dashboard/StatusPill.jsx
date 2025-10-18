import React from 'react';
import { StatusBadge } from '../ui/Badge.jsx';

const defaultVariantMap = {
  terkirim: 'info',
  'belum terkirim': 'danger',
  diterima: 'success',
  diajukan: 'warning',
  'belum diajukan': 'danger',
  lunas: 'success',
  'belum lunas': 'danger',
  pending: 'warning',
  draft: 'secondary',
};

const normalizeStatus = (status) => {
  if (typeof status !== 'string') {
    return '';
  }

  return status.trim().toLowerCase();
};

const StatusPill = ({
  status,
  variant,
  size = 'sm',
  dot = true,
  className = '',
  map = defaultVariantMap,
}) => {
  const normalized = normalizeStatus(status);
  const resolvedVariant = variant || map[normalized] || 'secondary';

  if (!status) {
    return (
      <span className='text-xs font-medium text-gray-400 italic'>Tidak ada status</span>
    );
  }

  return (
    <StatusBadge
      status={status}
      variant={resolvedVariant}
      size={size}
      dot={dot}
      className={className}
    />
  );
};

export default StatusPill;
