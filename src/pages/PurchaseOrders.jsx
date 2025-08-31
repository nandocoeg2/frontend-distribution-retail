import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toastService from '../services/toastService';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5050/api/v1';

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    po_number: '',
    total_items: 0,
    tanggal_order: '',
    po_type: 'Regular',
    statusId: '',
    suratJalan: '',
    invoicePengiriman: '',
    suratPO: '',
    suratPenagihan: ''
  });

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('customer_name');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const navigate = useNavigate();

  // Handle authentication errors
  const handleAuthError = () => {
    localStorage.clear();
    navigate('/login');
    toastService.error('Session expired. Please login again.');
  };

  // Fetch all purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch purchase orders');

      const data = await response.json();
      setPurchaseOrders(data);
    } catch (err) {
      setError(err.message);
      toastService.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Search purchase orders with advanced criteria
  const searchPurchaseOrders = async (query, field) => {
    if (!query.trim()) {
      fetchPurchaseOrders();
      return;
    }

    try {
      setSearchLoading(true);
      const accessToken = localStorage.getItem('token');
      
      let url = `${API_URL}/purchase-orders/search?`;
      
      switch (field) {
        case 'tanggal_order':
          url += `tanggal_order=${encodeURIComponent(query)}`;
          break;
        case 'customer_name':
          url += `customer_name=${encodeURIComponent(query)}`;
          break;
        case 'customerId':
          url += `customerId=${encodeURIComponent(query)}`;
          break;
        case 'suratPO':
          url += `suratPO=${encodeURIComponent(query)}`;
          break;
        case 'invoicePengiriman':
          url += `invoicePengiriman=${encodeURIComponent(query)}`;
          break;
        case 'po_number':
          url += `po_number=${encodeURIComponent(query)}`;
          break;
        case 'supplierId':
          url += `supplierId=${encodeURIComponent(query)}`;
          break;
        case 'statusId':
          url += `statusId=${encodeURIComponent(query)}`;
          break;
        default:
          url += `customer_name=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to search purchase orders');

      const data = await response.json();
      setPurchaseOrders(data);
    } catch (err) {
      toastService.error('Failed to search purchase orders');
    } finally {
      setSearchLoading(false);
    }
  };

  // Delete purchase order
  const deletePurchaseOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?'))
      return;

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to delete purchase order');

      setPurchaseOrders(purchaseOrders.filter((order) => order.id !== id));
      toastService.success('Purchase order deleted successfully');
    } catch (err) {
      toastService.error('Failed to delete purchase order');
    }
  };

  // Update purchase order
  const updatePurchaseOrder = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/purchase-orders/${editingOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to update purchase order');

      const updatedOrder = await response.json();
      setPurchaseOrders(
        purchaseOrders.map((order) =>
          order.id === editingOrder.id ? updatedOrder : order
        )
      );

      setShowEditModal(false);
      setEditingOrder(null);
      toastService.success('Purchase order updated successfully');
    } catch (err) {
      toastService.error('Failed to update purchase order');
    }
  };

  // Open view modal
  const openViewModal = async (order) => {
    setViewLoading(true);
    setShowViewModal(true);
    
    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch purchase order details');

      const orderData = await response.json();
      setViewingOrder(orderData);
    } catch (err) {
      toastService.error('Failed to load purchase order details');
      setShowViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingOrder(null);
  };

  // Open edit modal
  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      customerId: order.customerId || '',
      po_number: order.po_number || '',
      total_items: order.total_items || 0,
      tanggal_order: order.tanggal_order ? new Date(order.tanggal_order).toISOString().split('T')[0] : '',
      po_type: order.po_type || 'Regular',
      statusId: order.statusId || '',
      suratJalan: order.suratJalan || '',
      invoicePengiriman: order.invoicePengiriman || '',
      suratPO: order.suratPO || '',
      suratPenagihan: order.suratPenagihan || ''
    });
    setShowEditModal(true);
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      customerId: '',
      po_number: '',
      total_items: 0,
      tanggal_order: new Date().toISOString().split('T')[0],
      po_type: 'Regular',
      statusId: '',
      suratJalan: '',
      invoicePengiriman: '',
      suratPO: '',
      suratPenagihan: ''
    });
    setShowAddModal(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      customerId: '',
      po_number: '',
      total_items: 0,
      tanggal_order: '',
      po_type: 'Regular',
      statusId: '',
      suratJalan: '',
      invoicePengiriman: '',
      suratPO: '',
      suratPenagihan: ''
    });
  };

  // Create purchase order
  const createPurchaseOrder = async (e) => {
    e.preventDefault();

    try {
      const accessToken = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          tanggal_order: new Date(formData.tanggal_order).toISOString()
        }),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) throw new Error('Failed to create purchase order');

      const newOrder = await response.json();
      setPurchaseOrders([...purchaseOrders, newOrder]);

      closeAddModal();
      toastService.success('Purchase order created successfully');
    } catch (err) {
      toastService.error('Failed to create purchase order');
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
    setFormData({
      customerId: '',
      po_number: '',
      total_items: 0,
      tanggal_order: '',
      po_type: 'Regular',
      statusId: '',
      suratJalan: '',
      invoicePengiriman: '',
      suratPO: '',
      suratPenagihan: ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout for 500ms delay
    const timeout = setTimeout(() => {
      searchPurchaseOrders(query, searchField);
    }, 500);

    setDebounceTimeout(timeout);
  };

  // Handle search field change
  const handleSearchFieldChange = (e) => {
    const field = e.target.value;
    setSearchField(field);
    if (searchQuery.trim()) {
      searchPurchaseOrders(searchQuery, field);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-800'>Error: {error}</p>
        <button
          onClick={fetchPurchaseOrders}
          className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='mb-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900'>Purchase Orders</h3>
            <button
              onClick={openAddModal}
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              <PlusIcon className='h-5 w-5 mr-2' />
              Add Purchase Order
            </button>
          </div>

          {/* Advanced Search Section */}
          <div className='mb-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <select
                value={searchField}
                onChange={handleSearchFieldChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='customer_name'>Customer Name</option>
                <option value='tanggal_order'>Order Date (YYYY-MM-DD)</option>
                <option value='po_number'>PO Number</option>
                <option value='customerId'>Customer ID</option>
                <option value='supplierId'>Supplier ID</option>
                <option value='statusId'>Status ID</option>
                <option value='suratPO'>Surat PO</option>
                <option value='invoicePengiriman'>Invoice Pengiriman</option>
              </select>
            </div>
            <div className='relative md:col-span-2'>
              <input
                type='text'
                placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}...`}
                value={searchQuery}
                onChange={handleSearchChange}
                className='w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                <svg 
                  className='h-5 w-5 text-gray-400' 
                  fill='none' 
                  strokeLinecap='round' 
                  strokeLinejoin='round' 
                  strokeWidth='2' 
                  viewBox='0 0 24 24' 
                  stroke='currentColor'
                >
                  <path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                </svg>
              </div>
              {searchLoading && (
                <div className='flex items-center mt-2 text-sm text-gray-600'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                  Searching...
                </div>
              )}
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    PO Number
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Supplier
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Customer
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total Items
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className='px-6 py-4 text-center text-gray-500'>
                      {searchQuery ? 'No purchase orders found matching your search.' : 'No purchase orders available.'}
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((order) => (
                    <tr key={order.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {order.po_number}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.supplier?.name || '-'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.customer?.name || '-'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.total_items}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.tanggal_order ? new Date(order.tanggal_order).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.po_type}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.status?.status_name || '-'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <div className='flex space-x-2'>
                          <button
                            onClick={() => openViewModal(order)}
                            className='text-indigo-600 hover:text-indigo-900 p-1'
                            title='View'
                          >
                            <EyeIcon className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => openEditModal(order)}
                            className='text-indigo-600 hover:text-indigo-900 p-1'
                            title='Edit'
                          >
                            <PencilIcon className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => deletePurchaseOrder(order.id)}
                            className='text-red-600 hover:text-red-900 p-1'
                            title='Delete'
                          >
                            <TrashIcon className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Add New Purchase Order
            </h3>

            <form onSubmit={createPurchaseOrder}>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      PO Number *
                    </label>
                    <input
                      type='text'
                      name='po_number'
                      value={formData.po_number}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Customer ID *
                    </label>
                    <input
                      type='text'
                      name='customerId'
                      value={formData.customerId}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Total Items *
                    </label>
                    <input
                      type='number'
                      name='total_items'
                      value={formData.total_items}
                      onChange={handleInputChange}
                      required
                      min='0'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Order Date *
                    </label>
                    <input
                      type='date'
                      name='tanggal_order'
                      value={formData.tanggal_order}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      PO Type *
                    </label>
                    <select
                      name='po_type'
                      value={formData.po_type}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='Regular'>Regular</option>
                      <option value='Express'>Express</option>
                      <option value='Urgent'>Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status ID *
                    </label>
                    <input
                      type='text'
                      name='statusId'
                      value={formData.statusId}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat Jalan
                  </label>
                  <input
                    type='text'
                    name='suratJalan'
                    value={formData.suratJalan}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Invoice Pengiriman
                  </label>
                  <input
                    type='text'
                    name='invoicePengiriman'
                    value={formData.invoicePengiriman}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat PO
                  </label>
                  <input
                    type='text'
                    name='suratPO'
                    value={formData.suratPO}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat Penagihan
                  </label>
                  <input
                    type='text'
                    name='suratPenagihan'
                    value={formData.suratPenagihan}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={closeAddModal}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Add Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Edit Purchase Order
            </h3>

            <form onSubmit={updatePurchaseOrder}>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      PO Number *
                    </label>
                    <input
                      type='text'
                      name='po_number'
                      value={formData.po_number}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Customer ID *
                    </label>
                    <input
                      type='text'
                      name='customerId'
                      value={formData.customerId}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Total Items *
                    </label>
                    <input
                      type='number'
                      name='total_items'
                      value={formData.total_items}
                      onChange={handleInputChange}
                      required
                      min='0'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Order Date *
                    </label>
                    <input
                      type='date'
                      name='tanggal_order'
                      value={formData.tanggal_order}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      PO Type *
                    </label>
                    <select
                      name='po_type'
                      value={formData.po_type}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='Regular'>Regular</option>
                      <option value='Express'>Express</option>
                      <option value='Urgent'>Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status ID *
                    </label>
                    <input
                      type='text'
                      name='statusId'
                      value={formData.statusId}
                      onChange={handleInputChange}
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat Jalan
                  </label>
                  <input
                    type='text'
                    name='suratJalan'
                    value={formData.suratJalan}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Invoice Pengiriman
                  </label>
                  <input
                    type='text'
                    name='invoicePengiriman'
                    value={formData.invoicePengiriman}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat PO
                  </label>
                  <input
                    type='text'
                    name='suratPO'
                    value={formData.suratPO}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Surat Penagihan
                  </label>
                  <input
                    type='text'
                    name='suratPenagihan'
                    value={formData.suratPenagihan}
                    onChange={handleInputChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={closeEditModal}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <div className='flex justify-between items-center'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Purchase Order Details
                </h3>
                <button
                  onClick={closeViewModal}
                  className='text-gray-400 hover:text-gray-500'
                >
                  <span className='sr-only'>Close</span>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>
            <div className='p-6'>
              {viewLoading ? (
                <div className='flex justify-center items-center h-64'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                </div>
              ) : viewingOrder ? (
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3'>Order Information</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>PO Number</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.po_number}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>PO Type</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.po_type}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Order Date</label>
                          <p className='text-sm text-gray-900'>{new Date(viewingOrder.tanggal_order).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Total Items</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.total_items}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Status</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.status?.status_name}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3'>Customer Information</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Customer Name</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.customer?.name}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Customer Email</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.customer?.email}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Customer Phone</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.customer?.phoneNumber}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Customer Address</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.customer?.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3'>Supplier Information</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Supplier</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.supplier?.name || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3'>Documents</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Surat Jalan</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.suratJalan || 'N/A'}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Invoice Pengiriman</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.invoicePengiriman || 'N/A'}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Surat PO</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.suratPO || 'N/A'}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Surat Penagihan</label>
                          <p className='text-sm text-gray-900'>{viewingOrder.suratPenagihan || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='text-lg font-medium text-gray-900 mb-3'>Files</h4>
                    <div className='space-y-2'>
                      {viewingOrder.files && viewingOrder.files.length > 0 ? (
                        viewingOrder.files.map((file, index) => (
                          <div key={index} className='text-sm text-gray-900'>
                            <a href={file.url} className='text-blue-600 hover:text-blue-800' target='_blank' rel='noopener noreferrer'>
                              {file.file_name}
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className='text-sm text-gray-500'>No files attached</p>
                      )}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3'>Timestamps</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Created At</label>
                          <p className='text-sm text-gray-900'>{new Date(viewingOrder.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className='text-sm font-medium text-gray-500'>Updated At</label>
                          <p className='text-sm text-gray-900'>{new Date(viewingOrder.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className='text-center text-gray-500'>No order details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
