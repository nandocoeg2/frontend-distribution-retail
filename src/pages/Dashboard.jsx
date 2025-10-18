import React, { useMemo } from 'react';
import PurchaseOrderStatusTable from '../components/dashboard/PurchaseOrderStatusTable.jsx';

const Dashboard = () => {
  const purchaseOrders = useMemo(() => [
    {
      poNumber: '11',
      shipping: {
        status: 'Terkirim',
        date: '08/08/2025',
      },
      receiving: {
        expiredDate: '',
        lpbDate: '10/08/2025',
        invoiceDate: '10/08/2025',
      },
      billingSubmission: 'Diajukan',
      billing: {
        status: 'Diterima',
        date: '12/08/2025',
      },
      payment: {
        status: 'Lunas',
        date: '15/08/2025',
      },
    },
    {
      poNumber: '22',
      shipping: {
        status: 'Belum Terkirim',
        date: '',
      },
      receiving: {
        expiredDate: '05/08/2025',
        lpbDate: '',
        invoiceDate: '',
      },
      billingSubmission: null,
      billing: {
        status: 'Belum Diajukan',
        date: '',
      },
      payment: {
        status: 'Belum Lunas',
        date: '',
      },
    },
    {
      poNumber: '33',
      shipping: {
        status: 'Terkirim',
        date: '09/08/2025',
      },
      receiving: {
        expiredDate: '',
        lpbDate: '',
        invoiceDate: '',
      },
      billingSubmission: null,
      billing: {
        status: 'Belum Diajukan',
        date: '',
      },
      payment: {
        status: 'Belum Lunas',
        date: '',
      },
    },
    {
      poNumber: '44',
      shipping: {
        status: 'Diterima',
        date: '11/08/2025',
      },
      receiving: {
        expiredDate: '',
        lpbDate: '',
        invoiceDate: '',
      },
      billingSubmission: null,
      billing: {
        status: 'Belum Diajukan',
        date: '',
      },
      payment: {
        status: 'Belum Lunas',
        date: '15/08/2025',
      },
    },
  ], []);

  return (
    <div className='space-y-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold text-gray-900'>Dashboard PO Tracking</h1>
        <p className='text-sm text-gray-600'>
          Lihat perkembangan pesanan mulai dari pengiriman hingga pembayaran.
        </p>
      </header>

      <PurchaseOrderStatusTable orders={purchaseOrders} />
    </div>
  );
};

export default Dashboard;
