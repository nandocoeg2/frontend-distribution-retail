import React, { useMemo } from 'react';
import {
  ClipboardDocumentListIcon,
  TruckIcon,
  DocumentCheckIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { StatCard } from '../ui/Card.jsx';

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const PurchaseOrderSummary = ({ orders = [] }) => {
  const stats = useMemo(() => {
    const total = orders.length;

    if (total === 0) {
      return [];
    }

    const shippedCount = orders.filter((order) => {
      const shippingStatus = normalize(order?.shipping?.status);
      return shippingStatus === 'terkirim' || shippingStatus === 'diterima';
    }).length;

    const receivingCompleted = orders.filter((order) => {
      const lpbDate = normalize(order?.receiving?.lpbDate);
      const invoiceDate = normalize(order?.receiving?.invoiceDate);
      return lpbDate !== '' && invoiceDate !== '';
    }).length;

    const billingAccepted = orders.filter((order) => {
      const billingStatus = normalize(order?.billing?.status);
      return billingStatus === 'diterima';
    }).length;

    const paidCount = orders.filter((order) => {
      const paymentStatus = normalize(order?.payment?.status);
      return paymentStatus === 'lunas';
    }).length;

    const getPercentage = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return [
      {
        id: 'total',
        title: 'Total Purchase Order',
        value: total,
        change: 'Data aktif yang sedang dipantau',
        changeType: 'positive',
        icon: <ClipboardDocumentListIcon className='h-6 w-6 text-indigo-600' />,
        variant: 'light',
      },
      {
        id: 'shipping',
        title: 'Pengiriman Selesai',
        value: shippedCount,
        change: `${getPercentage(shippedCount)}% dari total PO`,
        changeType: shippedCount === 0 ? 'neutral' : 'positive',
        icon: <TruckIcon className='h-6 w-6 text-blue-600' />,
        variant: 'primary',
      },
      {
        id: 'billing',
        title: 'Tagihan Diterima',
        value: billingAccepted,
        change: `${getPercentage(billingAccepted)}% penagihan selesai`,
        changeType: billingAccepted === 0 ? 'neutral' : 'primary',
        icon: <DocumentCheckIcon className='h-6 w-6 text-purple-600' />,
        variant: 'light',
      },
      {
        id: 'payment',
        title: 'Pembayaran Lunas',
        value: paidCount,
        change: `${getPercentage(paidCount)}% pembayaran selesai`,
        changeType: paidCount === 0 ? 'neutral' : 'success',
        icon: <BanknotesIcon className='h-6 w-6 text-emerald-600' />,
        variant: 'success',
      },
    ];
  }, [orders]);

  if (stats.length === 0) {
    return (
      <div className='rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500'>
        Belum ada data purchase order untuk diringkas.
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          variant={stat.variant}
          size='sm'
        />
      ))}
    </div>
  );
};

export default PurchaseOrderSummary;
