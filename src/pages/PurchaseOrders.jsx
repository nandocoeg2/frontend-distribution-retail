import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import Sidebar from '../components/Sidebar.jsx';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [purchaseOrders] = useState([
    {
      id: 'PO-2024-001',
      vendor: 'Tech Solutions Inc.',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      amount: 12500.0,
      status: 'pending',
      items: 15,
      description: 'Office equipment and software licenses',
    },
    {
      id: 'PO-2024-002',
      vendor: 'Office Supplies Co.',
      date: '2024-01-14',
      dueDate: '2024-02-14',
      amount: 3750.5,
      status: 'approved',
      items: 8,
      description: 'Monthly office supplies and stationery',
    },
    {
      id: 'PO-2024-003',
      vendor: 'Industrial Equipment Ltd.',
      date: '2024-01-13',
      dueDate: '2024-03-13',
      amount: 85000.0,
      status: 'pending',
      items: 3,
      description: 'Manufacturing equipment upgrade',
    },
    {
      id: 'PO-2024-004',
      vendor: 'Service Providers Inc.',
      date: '2024-01-12',
      dueDate: '2024-02-12',
      amount: 5200.0,
      status: 'delivered',
      items: 12,
      description: 'Maintenance and support services',
    },
    {
      id: 'PO-2024-005',
      vendor: 'Digital Marketing Agency',
      date: '2024-01-11',
      dueDate: '2024-02-11',
      amount: 7800.0,
      status: 'cancelled',
      items: 6,
      description: 'Marketing campaign and advertising',
    },
  ]);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load menus
    const userMenus = authService.getMenus();
    setMenus(userMenus);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const tabs = [
    { id: 'all', name: 'All Orders', count: purchaseOrders.length },
    {
      id: 'pending',
      name: 'Pending',
      count: purchaseOrders.filter((po) => po.status === 'pending').length,
    },
    {
      id: 'approved',
      name: 'Approved',
      count: purchaseOrders.filter((po) => po.status === 'approved').length,
    },
    {
      id: 'delivered',
      name: 'Delivered',
      count: purchaseOrders.filter((po) => po.status === 'delivered').length,
    },
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      approved: '✅',
      delivered: '📦',
      cancelled: '❌',
    };
    return icons[status] || '📄';
  };

  const filteredOrders =
    activeTab === 'all'
      ? purchaseOrders
      : purchaseOrders.filter((po) => po.status === activeTab);

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 to-gray-100'>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        menus={menus}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/60 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-1'>
                Purchase Orders 📋
              </h1>
              <p className='text-gray-600'>
                Manage purchase orders, approvals, and vendor relationships
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              <span>Create PO</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-7xl mx-auto space-y-8'>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>
                      Total Orders
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>
                      {purchaseOrders.length}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-2xl'>📋</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>
                      Total Value
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>
                      ${totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-2xl'>💰</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>
                      Pending
                    </p>
                    <p className='text-3xl font-bold text-yellow-600'>
                      {
                        purchaseOrders.filter((po) => po.status === 'pending')
                          .length
                      }
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <span className='text-2xl'>⏳</span>
                  </div>
                </div>
              </div>

              <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600 mb-1'>
                      Delivered
                    </p>
                    <p className='text-3xl font-bold text-green-600'>
                      {
                        purchaseOrders.filter((po) => po.status === 'delivered')
                          .length
                      }
                    </p>
                  </div>
                  <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                    <span className='text-2xl'>📦</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden'>
              {/* Tabs */}
              <div className='border-b border-gray-200 bg-gray-50/80'>
                <div className='flex space-x-8 px-6'>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.name}</span>
                      <span className='bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full'>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Orders List */}
              <div className='p-6'>
                <div className='space-y-4'>
                  {filteredOrders.map((po) => (
                    <div
                      key={po.id}
                      className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-start space-x-4'>
                          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <span className='text-2xl'>
                              {getStatusIcon(po.status)}
                            </span>
                          </div>
                          <div>
                            <h3 className='text-lg font-semibold text-gray-900'>
                              {po.id}
                            </h3>
                            <p className='text-gray-600'>{po.vendor}</p>
                            <p className='text-sm text-gray-500'>
                              {po.description}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(po.status)}`}
                          >
                            {po.status.charAt(0).toUpperCase() +
                              po.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                        <div>
                          <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                            Order Date
                          </p>
                          <p className='text-sm text-gray-900'>
                            {new Date(po.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                            Due Date
                          </p>
                          <p className='text-sm text-gray-900'>
                            {new Date(po.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                            Amount
                          </p>
                          <p className='text-sm font-semibold text-gray-900'>
                            ${po.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-1'>
                            Items
                          </p>
                          <p className='text-sm text-gray-900'>
                            {po.items} items
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                        <div className='flex items-center space-x-4 text-sm text-gray-600'>
                          <span>
                            Created {new Date(po.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{po.items} items total</span>
                        </div>
                        <div className='flex space-x-2'>
                          <button className='text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 hover:bg-blue-50 rounded'>
                            View Details
                          </button>
                          {po.status === 'pending' && (
                            <>
                              <button className='text-green-600 hover:text-green-700 text-sm font-medium px-3 py-1 hover:bg-green-50 rounded'>
                                Approve
                              </button>
                              <button className='text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded'>
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredOrders.length === 0 && (
                  <div className='text-center py-12'>
                    <div className='text-6xl mb-4'>📋</div>
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No purchase orders found
                    </h3>
                    <p className='text-gray-600'>
                      {activeTab === 'all'
                        ? 'Create your first purchase order to get started.'
                        : `No purchase orders with "${activeTab}" status.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add PO Modal (Placeholder) */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Create Purchase Order
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <p className='text-gray-600 mb-6'>
              Feature under development. Purchase order creation functionality
              will be implemented soon.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className='w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
