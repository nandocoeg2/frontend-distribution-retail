import React, { useState } from 'react';
import { formatDate } from '@/utils/formatUtils';
import { StatusBadge } from '../ui/Badge.jsx';
import ViewPurchaseOrderModal from '../purchaseOrders/ViewPurchaseOrderModal';
import purchaseOrderService from '../../services/purchaseOrderService';

const resolveStatusText = (s) => !s ? null : typeof s === 'string' ? s : s.status_name || s.status_code || null;

const resolveStatusVariant = (status, def = 'secondary') => {
  if (!status) return def;
  // Use status_name for matching (more consistent)
  const name = (typeof status === 'string' ? status : status.status_name || '').trim().toUpperCase();
  if (!name) return def;
  // Gray - Draft/inactive
  if (['DRAFT', 'INACTIVE', 'NEW'].includes(name)) return 'secondary';
  // Red - Cancelled/failed
  if (['VOID', 'CANCELLED', 'CANCELED', 'REJECTED', 'FAILED', 'EXPIRED'].includes(name)) return 'danger';
  // Yellow - Pending/processing
  if (['PENDING', 'WAITING', 'IN_PROGRESS', 'UNPAID', 'PROCESSING', 'ON_PROCESS'].includes(name)) return 'warning';
  // Blue - Ready/shipped
  if (['SENT', 'SHIPPED', 'IN_TRANSIT', 'DELIVERING', 'READY TO SHIP', 'READY'].includes(name)) return 'info';
  // Green - Completed/paid
  if (['PAID', 'SETTLED', 'COMPLETED', 'DELIVERED', 'RECEIVED', 'DONE', 'SUCCESS'].includes(name)) return 'success';
  return def;
};

const renderStatus = (status, hint) => {
  const text = resolveStatusText(status);
  return !text ? <span className='text-xs text-gray-400'>-</span> : <StatusBadge status={text} variant={resolveStatusVariant(status, hint)} size='xs' dot />;
};

const renderDate = (v) => <span className='text-xs text-gray-700'>{v ? formatDate(v) : '-'}</span>;

const createDefaultColumnGroups = (onClick) => [
  { id: 'po-number', label: 'No PO', showSubHeader: false, headerClassName: 'bg-gray-100 text-gray-600', align: 'center',
    columns: [{ id: 'po_number', label: 'No PO', align: 'center', render: (o) => <button onClick={() => onClick(o)} className='text-xs font-semibold text-indigo-700 hover:underline'>{o.po_number || '-'}</button> }] },
  { id: 'shipping-status', label: 'Kirim', headerClassName: 'bg-gray-100 text-gray-600', align: 'center',
    columns: [
      { id: 'status_pengiriman', label: 'Status', align: 'center', render: (o) => renderStatus(o.status_pengiriman, 'info') },
      { id: 'tanggal_pengiriman', label: 'Tanggal', align: 'center', render: (o) => renderDate(o.tanggal_pengiriman) },
    ] },
  { id: 'receiving-status', label: 'Penerimaan', headerClassName: 'bg-gray-100 text-gray-600', align: 'center',
    columns: [
      { id: 'tanggal_penerimaan_barang', label: 'LPB', align: 'center', render: (o) => renderDate(o.tanggal_penerimaan_barang) },
      { id: 'tanggal_invoice', label: 'Invoice', align: 'center', render: (o) => renderDate(o.tanggal_invoice) },
      { id: 'tanggal_expired', label: 'Expired', align: 'center', render: (o) => renderDate(o.tanggal_expired) },
    ] },
  { id: 'billing-status', label: 'Tagihan', headerClassName: 'bg-gray-100 text-gray-600', align: 'center',
    columns: [
      { id: 'status_tagihan', label: 'Status', align: 'center', render: (o) => renderStatus(o.status_tagihan, 'warning') },
      { id: 'tanggal_tagihan', label: 'Tanggal', align: 'center', render: (o) => renderDate(o.tanggal_tagihan) },
      { id: 'status_ttf', label: 'TTF', align: 'center', render: (o) => renderStatus(o.tanda_terima_faktur?.status, 'warning') },
      { id: 'tanggal_ttf', label: 'Tanggal TTF', align: 'center', render: (o) => renderDate(o.tanda_terima_faktur?.tanggal) },
    ] },
  { id: 'payment-status', label: 'Bayar', headerClassName: 'bg-gray-100 text-gray-600', align: 'center',
    columns: [
      { id: 'status_pembayaran', label: 'Status', align: 'center', render: (o) => renderStatus(o.status_pembayaran, 'success') },
      { id: 'tanggal_pembayaran', label: 'Tanggal', align: 'center', render: (o) => renderDate(o.tanggal_pembayaran) },
    ] },
];

const PurchaseOrderStatusTable = ({ title, subtitle, orders = [], columnGroups, emptyMessage = 'Belum ada data PO.', loading = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handlePoNumberClick = async (order) => {
    const poId = order.po_id || order.id;
    if (!poId) return console.error('No PO ID');
    setIsModalOpen(true); setModalLoading(true); setSelectedOrder(null);
    try {
      const res = await purchaseOrderService.getPurchaseOrderById(poId);
      setSelectedOrder(res?.data || res);
    } catch (e) { console.error('Failed to fetch PO:', e); setIsModalOpen(false); }
    finally { setModalLoading(false); }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setSelectedOrder(null); };

  const cols = columnGroups || createDefaultColumnGroups(handlePoNumberClick);
  const totalCols = cols.reduce((t, g) => t + g.columns.length, 0);
  const align = (a) => a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

  const HeaderRow = () => (
    <tr>
      {cols.map((g) => (
        <th key={g.id} colSpan={g.showSubHeader === false ? 1 : g.columns.length} rowSpan={g.showSubHeader === false ? 2 : 1}
          className={`border border-gray-200 px-2 py-1.5 text-[10px] font-semibold uppercase ${g.headerClassName} ${align(g.align)}`}>{g.label}</th>
      ))}
    </tr>
  );

  const SubHeaderRow = () => {
    const cells = cols.filter((g) => g.showSubHeader !== false).flatMap((g) => g.columns.map((c) => (
      <th key={`${g.id}-${c.id}`} className={`border border-gray-200 bg-gray-50 px-2 py-1 text-[9px] font-semibold uppercase text-gray-600 ${align(c.align)}`}>{c.label}</th>
    )));
    return cells.length ? <tr>{cells}</tr> : null;
  };

  const EmptyRow = () => <tr><td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'>{emptyMessage}</td></tr>;
  const LoadingRow = () => <tr><td colSpan={totalCols} className='px-2 py-4 text-center text-xs text-gray-500'><div className='flex items-center justify-center gap-1'><div className='h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent' /><span>Memuat...</span></div></td></tr>;

  const Cell = ({ order, group, column, rowKey }) => (
    <td key={`${rowKey}-${group.id}-${column.id}`} className={`border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 ${align(column.align)} ${column.cellClassName || ''}`}>
      {column.render ? column.render(order) : order[column.id] || '-'}
    </td>
  );

  return (
    <div>
      {(title || subtitle) && (
        <div className='pb-2'>
          {title && <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>}
          {subtitle && <p className='text-xs text-gray-500'>{subtitle}</p>}
        </div>
      )}
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 text-xs'>
          <thead className='bg-white'><HeaderRow /><SubHeaderRow /></thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {loading ? <LoadingRow /> : orders.length === 0 ? <EmptyRow /> : orders.map((o, i) => {
              const rk = o.__rowKey || o.po_id || `${o.po_number || 'po'}-${i}`;
              return <tr key={rk} className='hover:bg-gray-50'>{cols.flatMap((g) => g.columns.map((c) => <Cell key={`${rk}-${g.id}-${c.id}`} order={o} group={g} column={c} rowKey={rk} />))}</tr>;
            })}
          </tbody>
        </table>
      </div>
      <ViewPurchaseOrderModal isOpen={isModalOpen} onClose={handleCloseModal} order={selectedOrder} loading={modalLoading} onProcessed={handleCloseModal} />
    </div>
  );
};

export default PurchaseOrderStatusTable;


