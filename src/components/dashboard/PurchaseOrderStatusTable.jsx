import React from 'react';
import { formatDate } from '@/utils/formatUtils';
import { StatusBadge } from '../ui/Badge.jsx';

const resolveStatusText = (status) => {
  if (!status) {
    return null;
  }

  if (typeof status === 'string') {
    return status;
  }

  return status.status_name || status.status_code || null;
};

const resolveStatusCode = (status) => {
  if (!status || typeof status === 'string') {
    return status ? String(status) : '';
  }

  return status.status_code || status.status_name || '';
};

const resolveStatusVariant = (status, defaultVariant = 'secondary') => {
  const code = resolveStatusCode(status).trim().toUpperCase();

  if (!code) {
    return defaultVariant;
  }

  if (['PAID', 'SETTLED', 'COMPLETED', 'DELIVERED', 'RECEIVED'].includes(code)) {
    return 'success';
  }

  if (['SENT', 'SHIPPED', 'IN_TRANSIT', 'DELIVERING'].includes(code)) {
    return 'info';
  }

  if (['PENDING', 'WAITING', 'IN_PROGRESS', 'UNPAID'].includes(code)) {
    return 'warning';
  }

  if (['VOID', 'CANCELLED', 'CANCELED', 'REJECTED', 'FAILED'].includes(code)) {
    return 'danger';
  }

  return defaultVariant;
};

const renderStatus = (status, variantHint) => {
  const statusText = resolveStatusText(status);

  if (!statusText) {
    return <span className='text-sm font-medium text-gray-400'>-</span>;
  }

  return (
    <StatusBadge
      status={statusText}
      variant={resolveStatusVariant(status, variantHint)}
      size='sm'
      dot
    />
  );
};

const renderDateDisplay = (value, placeholder = '-') => {
  const formatted = value ? formatDate(value) : null;

  return (
    <span className='block text-center text-sm font-medium text-gray-700'>
      {formatted || placeholder}
    </span>
  );
};

const defaultColumnGroups = [
  {
    id: 'po-number',
    label: 'No PO',
    showSubHeader: false,
    headerClassName: 'bg-gray-100 text-gray-600',
    align: 'center',
    columns: [
      {
        id: 'po_number',
        label: 'No PO',
        align: 'center',
        render: (order) => (
          <span className='text-sm font-semibold text-indigo-700'>{order.po_number || '-'}</span>
        ),
      },
    ],
  },
  {
    id: 'shipping-status',
    label: 'Pengiriman',
    headerClassName: 'bg-gray-100 text-gray-600',
    align: 'center',
    columns: [
      {
        id: 'status_pengiriman',
        label: 'Status',
        align: 'center',
        render: (order) => renderStatus(order.status_pengiriman, 'info'),
      },
      {
        id: 'tanggal_pengiriman',
        label: 'Tanggal',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_pengiriman),
      },
    ],
  },
  {
    id: 'receiving-status',
    label: 'Penerimaan Barang',
    headerClassName: 'bg-gray-100 text-gray-600',
    align: 'center',
    columns: [
      {
        id: 'tanggal_penerimaan_barang',
        label: 'Tanggal LPB',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_penerimaan_barang),
      },
      {
        id: 'tanggal_invoice',
        label: 'Tanggal Invoice',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_invoice),
      },
      {
        id: 'tanggal_expired',
        label: 'Tanggal Expired',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_expired),
      },
    ],
  },
  {
    id: 'billing-status',
    label: 'Tagihan',
    headerClassName: 'bg-gray-100 text-gray-600',
    align: 'center',
    columns: [
      {
        id: 'status_tagihan',
        label: 'Status',
        align: 'center',
        render: (order) => renderStatus(order.status_tagihan, 'warning'),
      },
      {
        id: 'tanggal_tagihan',
        label: 'Tanggal',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_tagihan),
      },
    ],
  },
  {
    id: 'payment-status',
    label: 'Pembayaran',
    headerClassName: 'bg-gray-100 text-gray-600',
    align: 'center',
    columns: [
      {
        id: 'status_pembayaran',
        label: 'Status',
        align: 'center',
        render: (order) => renderStatus(order.status_pembayaran, 'success'),
      },
      {
        id: 'tanggal_pembayaran',
        label: 'Tanggal',
        align: 'center',
        render: (order) => renderDateDisplay(order.tanggal_pembayaran),
      },
    ],
  },
];

const PurchaseOrderStatusTable = ({
  title = 'Status Purchase Order',
  subtitle = 'Pantau status pengiriman hingga pembayaran untuk setiap PO',
  orders = [],
  columnGroups = defaultColumnGroups,
  emptyMessage = 'Belum ada data purchase order untuk ditampilkan.',
  loading = false,
}) => {
  const renderHeaderRow = () => (
    <tr>
      {columnGroups.map((group) => (
        <th
          key={group.id}
          colSpan={group.showSubHeader === false ? 1 : group.columns.length}
          rowSpan={group.showSubHeader === false ? 2 : 1}
          className={`border border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${group.headerClassName} ${group.align === 'center' ? 'text-center' : group.align === 'right' ? 'text-right' : 'text-left'}`}
        >
          {group.label}
        </th>
      ))}
    </tr>
  );

  const renderSubHeaderRow = () => {
    const headerCells = columnGroups
      .filter((group) => group.showSubHeader !== false)
      .flatMap((group) => group.columns.map((column) => (
        <th
          key={`${group.id}-${column.id}`}
          className={`border border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
        >
          {column.label}
        </th>
      )));

    if (headerCells.length === 0) {
      return null;
    }

    return (
      <tr>
        {headerCells}
      </tr>
    );
  };

  const renderEmptyState = () => (
    <tr>
      <td
        colSpan={columnGroups.reduce((total, group) => total + group.columns.length, 0)}
        className='px-4 py-6 text-center text-sm text-gray-500'
      >
        {emptyMessage}
      </td>
    </tr>
  );

  const renderLoadingRow = () => (
    <tr>
      <td
        colSpan={columnGroups.reduce((total, group) => total + group.columns.length, 0)}
        className='px-4 py-6 text-center text-sm text-gray-500'
      >
        <div className='flex items-center justify-center gap-2'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' />
          <span>Memuat data purchase order...</span>
        </div>
      </td>
    </tr>
  );

  const renderCell = (order, group, column, rowKey) => {
    const key = `${rowKey}-${group.id}-${column.id}`;
    const content = column.render
      ? column.render(order)
      : order[column.id] || '-';

    const alignmentClass = column.align === 'center'
      ? 'text-center'
      : column.align === 'right'
        ? 'text-right'
        : 'text-left';

    return (
      <td
        key={key}
        className={`border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 ${alignmentClass} ${column.cellClassName || ''}`}
      >
        {content}
      </td>
    );
  };

  return (
    <div>
      <div className='flex flex-col gap-1 pb-3'>
        <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
        {subtitle && <p className='text-sm text-gray-500'>{subtitle}</p>}
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 text-sm'>
          <thead className='bg-white'>
            {renderHeaderRow()}
            {renderSubHeaderRow()}
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {loading
              ? renderLoadingRow()
              : orders.length === 0
              ? renderEmptyState()
              : orders.map((order, index) => {
                  const rowKey = order.__rowKey || order.po_id || `${order.po_number || 'po'}-${index}`;

                  return (
                    <tr
                      key={rowKey}
                      className='hover:bg-gray-50'
                    >
                      {columnGroups.flatMap((group) =>
                        group.columns.map((column) =>
                          renderCell(order, group, column, rowKey)
                        ),
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrderStatusTable;


