import React from 'react';
import { StatusBadge } from '@/components/ui/Badge';

const STATUS_VARIANT_MAP = {
  PENDING: 'warning',
  RESTOCKED: 'success',
  REJECTED: 'danger',
};

const normalizeStatus = (status) => {
  if (!status) {
    return '';
  }
  return String(status).toUpperCase();
};

const ReturnStatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);
  const variant = STATUS_VARIANT_MAP[normalizedStatus] || 'secondary';

  if (!normalizedStatus) {
    return <StatusBadge status='Unknown' variant='secondary' dot />;
  }

  return (
    <StatusBadge status={normalizedStatus} variant={variant} dot />
  );
};

export default ReturnStatusBadge;
