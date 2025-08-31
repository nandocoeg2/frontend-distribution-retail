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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value) || 0 : value 
    }));
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

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

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

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    PO Number
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Supplier ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Customer ID
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
                {purchaseOrders.map((order) => (
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
                ))}
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
                  className='text-gray-400 hover:text-gray-500 text-2xl'
                >
                  ×
                </button>
              </div>
            </div>

            <div className='p-6'>
              {viewLoading ? (
                <div className='flex justify-center items-center h-64'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                </div>
              ) : viewingOrder ? (
                <div className='grid grid-cols-2 gap-6'>
                  {/* Left Column - Basic Information */}
                  <div className='space-y-6'>
                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>Basic Information</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>PO Number</label>
                          <p className='mt-1 text-sm text-gray-900'>{viewingOrder.po_number}</p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>ID</label>
                          <p className='mt-1 text-sm text-gray-900 font-mono'>{viewingOrder.id}</p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>Type</label>
                          <p className='mt-1 text-sm text-gray-900'>{viewingOrder.po_type}</p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>Order Date</label>
                          <p className='mt-1 text-sm text-gray-900'>
                            {new Date(viewingOrder.tanggal_order).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>Total Items</label>
                          <p className='mt-1 text-sm text-gray-900'>{viewingOrder.total_items} items</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>Customer Information</h4>
                      <div className='space-y-3'>
                        {viewingOrder.customer ? (
                          <>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Customer Name</label>
                              <p className='mt-1 text-sm text-gray-900'>{viewingOrder.customer.name}</p>
                            </div>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Email</label>
                              <p className='mt-1 text-sm text-gray-900'>{viewingOrder.customer.email}</p>
                            </div>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Phone</label>
                              <p className='mt-1 text-sm text-gray-900'>{viewingOrder.customer.phoneNumber}</p>
                            </div>
                            {viewingOrder.customer.address && (
                              <div>
                                <label className='block text-sm font-medium text-gray-500'>Address</label>
                                <p className='mt-1 text-sm text-gray-900'>{viewingOrder.customer.address}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className='text-sm text-gray-500 italic'>No customer data</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Status & Files */}
                  <div className='space-y-6'>
                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>Status</h4>
                      <div className='space-y-3'>
                        {viewingOrder.status ? (
                          <>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Status Code</label>
                              <p className='mt-1 text-sm text-gray-900'>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  viewingOrder.status.status_code === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  viewingOrder.status.status_code === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  viewingOrder.status.status_code === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {viewingOrder.status.status_code}
                                </span>
                              </p>
                            </div>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Status Name</label>
                              <p className='mt-1 text-sm text-gray-900'>{viewingOrder.status.status_name}</p>
                            </div>
                            <div>
                              <label className='block text-sm font-medium text-gray-500'>Description</label>
                              <p className='mt-1 text-sm text-gray-900'>{viewingOrder.status.status_description}</p>
                            </div>
                          </>
                        ) : (
                          <p className='text-sm text-gray-500 italic'>No status data</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>System Information</h4>
                      <div className='space-y-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>Created At</label>
                          <p className='mt-1 text-sm text-gray-900'>
                            {new Date(viewingOrder.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-500'>Updated At</label>
                          <p className='mt-1 text-sm text-gray-900'>
                            {new Date(viewingOrder.updatedAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {viewingOrder.files && viewingOrder.files.length > 0 && (
                      <div>
                        <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>Files</h4>
                        <div className='space-y-2'>
                          {viewingOrder.files.map((file, index) => (
                            <div key={index} className='bg-gray-50 p-3 rounded-md'>
                              <p className='text-sm font-medium text-gray-900'>{file.name || 'File'}</p>
                              <p className='text-xs text-gray-500'>{file.type || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className='text-lg font-medium text-gray-900 mb-3 border-b pb-2'>Document Links</h4>
                      <div className='space-y-3'>
                        {viewingOrder.suratJalan && (
                          <div>
                            <label className='block text-sm font-medium text-gray-500'>Surat Jalan</label>
                            <a href={viewingOrder.suratJalan} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800 text-sm'>
                              View Document
                            </a>
                          </div>
                        )}
                        {viewingOrder.invoicePengiriman && (
                          <div>
                            <label className='block text-sm font-medium text-gray-500'>Invoice Pengiriman</label>
                            <a href={viewingOrder.invoicePengiriman} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800 text-sm'>
                              View Document
                            </a>
                          </div>
                        )}
                        {viewingOrder.suratPO && (
                          <div>
                            <label className='block text-sm font-medium text-gray-500'>Surat PO</label>
                            <a href={viewingOrder.suratPO} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800 text-sm'>
                              View Document
                            </a>
                          </div>
                        )}
                        {viewingOrder.suratPenagihan && (
                          <div>
                            <label className='block text-sm font-medium text-gray-500'>Surat Penagihan</label>
                            <a href={viewingOrder.suratPenagihan} target='_blank' rel='noopener noreferrer' className='text-blue-600 hover:text-blue-800 text-sm'>
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className='text-gray-500 text-center py-8'>No order details available</p>
              )}
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex justify-end'>
              <button
                onClick={closeViewModal}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
