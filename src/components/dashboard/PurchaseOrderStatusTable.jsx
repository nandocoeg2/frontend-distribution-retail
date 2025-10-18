import React from 'react';
import Card, { CardHeader } from '../ui/Card.jsx';
import StatusPill from './StatusPill.jsx';
import InlineDateInput from './InlineDateInput.jsx';

const defaultColumnGroups = [
  {
    id: 'po-number',
    label: 'No PO',
    showSubHeader: false,
    headerClassName: 'bg-gradient-to-r from-indigo-600 to-indigo-500',
    columns: [
      {
        id: 'poNumber',
        label: 'No PO',
        align: 'center',
        render: (order) => (
          <span className='text-sm font-semibold text-indigo-700'>{order.poNumber}</span>
        ),
      },
    ],
  },
  {
    id: 'shipping-status',
    label: 'Status Pengiriman',
    headerClassName: 'bg-gradient-to-r from-indigo-600 to-blue-600',
    columns: [
      {
        id: 'shippingStatus',
        label: 'Status',
        render: (order) => (
          <StatusPill status={order.shipping.status} />
        ),
      },
      {
        id: 'shippingDate',
        label: 'Tanggal',
        render: (order) => (
          <InlineDateInput value={order.shipping.date} />
        ),
      },
    ],
  },
  {
    id: 'receiving-status',
    label: 'Status Penerimaan Barang',
    headerClassName: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    columns: [
      {
        id: 'receivingExpire',
        label: 'Tanggal Expired',
        render: (order) => (
          <InlineDateInput value={order.receiving.expiredDate} />
        ),
      },
      {
        id: 'receivingLpb',
        label: 'Tanggal LPB',
        render: (order) => (
          <InlineDateInput value={order.receiving.lpbDate} />
        ),
      },
      {
        id: 'receivingInvoice',
        label: 'Tanggal Invoice',
        render: (order) => (
          <InlineDateInput value={order.receiving.invoiceDate} />
        ),
      },
    ],
  },
  {
    id: 'billing-submission',
    label: 'Penagihan Diajukan',
    headerClassName: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    columns: [
      {
        id: 'billingSubmission',
        label: 'Status',
        render: (order) => (
          order.billingSubmission
            ? <StatusPill status={order.billingSubmission} dot={false} />
            : <span className='text-sm text-gray-400'>-</span>
        ),
      },
    ],
  },
  {
    id: 'billing-status',
    label: 'Status Tagihan',
    headerClassName: 'bg-gradient-to-r from-purple-600 to-violet-600',
    columns: [
      {
        id: 'billingStatus',
        label: 'Status',
        render: (order) => (
          <StatusPill status={order.billing.status} />
        ),
      },
      {
        id: 'billingDate',
        label: 'Tanggal',
        render: (order) => (
          <InlineDateInput value={order.billing.date} />
        ),
      },
    ],
  },
  {
    id: 'payment-status',
    label: 'Pembayaran',
    headerClassName: 'bg-gradient-to-r from-violet-600 to-purple-600',
    columns: [
      {
        id: 'paymentStatus',
        label: 'Status',
        render: (order) => (
          <StatusPill status={order.payment.status} />
        ),
      },
      {
        id: 'paymentDate',
        label: 'Tanggal',
        render: (order) => (
          <InlineDateInput value={order.payment.date} />
        ),
      },
    ],
  },
];

const PurchaseOrderStatusTable = ({
  title = 'Status Purchase Order',
  subtitle = 'Pantau status pengiriman hingga pembayaran untuk setiap PO',
  orders = [],
  columnGroups = defaultColumnGroups,
}) => {
  const renderHeaderRow = () => (
    <tr>
      {columnGroups.map((group) => (
        <th
          key={group.id}
          colSpan={group.showSubHeader === false ? 1 : group.columns.length}
          rowSpan={group.showSubHeader === false ? 2 : 1}
          className={`border border-indigo-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white ${group.headerClassName}`}
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
          className='border border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-indigo-900'
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
        Belum ada data purchase order untuk ditampilkan.
      </td>
    </tr>
  );

  const renderCell = (order, group, column) => {
    const key = `${order.poNumber}-${group.id}-${column.id}`;
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
        className={`border border-indigo-50 bg-white px-4 py-3 text-sm text-gray-700 ${alignmentClass} ${column.cellClassName || ''}`}
      >
        {content}
      </td>
    );
  };

  return (
    <Card padding='lg' className='shadow-sm'>
      <CardHeader title={title} subtitle={subtitle} />

      <div className='overflow-x-auto'>
        <table className='min-w-full border-collapse rounded-lg text-sm'>
          <thead>
            {renderHeaderRow()}
            {renderSubHeaderRow()}
          </thead>
          <tbody>
            {orders.length === 0
              ? renderEmptyState()
              : orders.map((order) => (
                <tr
                  key={order.poNumber}
                  className='even:bg-indigo-50/40'
                >
                  {columnGroups.flatMap((group) =>
                    group.columns.map((column) => renderCell(order, group, column)),
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default PurchaseOrderStatusTable;
