import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import HeroIcon from '../components/atoms/HeroIcon.jsx';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [purchaseOrders] = useState([
    {
      id: 'PO-2024-001',
      vendor: 'Tech Solutions Inc.',
      date: '2024-01-15',
      amount: 12500.0,
      status: 'pending',
    },
    {
      id: 'PO-2024-002',
      vendor: 'Office Supplies Co.',
      date: '2024-01-14',
      amount: 3750.5,
      status: 'approved',
    },
    {
      id: 'PO-2024-003',
      vendor: 'Industrial Equipment Ltd.',
      date: '2024-01-13',
      amount: 85000.0,
      status: 'pending',
    },
    {
      id: 'PO-2024-004',
      vendor: 'Service Providers Inc.',
      date: '2024-01-12',
      amount: 5200.0,
      status: 'delivered',
    },
    {
      id: 'PO-2024-005',
      vendor: 'Digital Marketing Agency',
      date: '2024-01-11',
      amount: 7800.0,
      status: 'cancelled',
    },
  ]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const tabs = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending' },
    { id: 'approved', name: 'Approved' },
    { id: 'delivered', name: 'Delivered' },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders =
    activeTab === 'all'
      ? purchaseOrders
      : purchaseOrders.filter((po) => po.status === activeTab);

  return (
    <>
      <header className='bg-white/80 p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold flex items-center'>
            Purchase Orders{' '}
            <HeroIcon name='document-text' className='w-8 h-8 ml-2' />
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center'
          >
            <HeroIcon name='plus' className='w-5 h-5 mr-2' />
            Create PO
          </button>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-white/90 rounded-2xl shadow-sm'>
            <div className='border-b px-6'>
              <div className='flex space-x-8'>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
            <div className='p-6'>
              <div className='space-y-4'>
                {filteredOrders.map((po) => (
                  <div key={po.id} className='bg-white border rounded-xl p-6'>
                    <div className='flex justify-between'>
                      <div>
                        <h3 className='font-semibold'>{po.id}</h3>
                        <p>{po.vendor}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(po.status)}`}
                      >
                        {po.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex justify-center items-center'>
          <div className='bg-white rounded-lg p-6'>
            <h3 className='text-lg font-semibold'>Create Purchase Order</h3>
            <p>Feature under development.</p>
            <button onClick={() => setShowAddModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseOrders;
