import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../../services/notificationService.js';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, notification: null });
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Setup SSE connection for real-time notifications
  useEffect(() => {
    const connectSSE = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Note: EventSource doesn't support custom headers, so we'll use a workaround
      // We'll pass token as query param (backend should support this)
      const sseUrl = `${process.env.BACKEND_BASE_URL}api/v1/notifications/stream`;

      // Create EventSource with fetch polyfill for auth support
      const eventSource = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NEW_NOTIFICATION') {
            // Add new notification to the list
            setNotifications((prev) => [data.data, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast for BULK_PO_COMPLETE notifications
            if (data.data?.type === 'BULK_PO_COMPLETE') {
              const hasError = data.data.title?.includes('gagal');
              if (hasError) {
                toast.warning(data.data.title, {
                  autoClose: 8000,
                  onClick: () => setShowDropdown(true),
                });
              } else {
                toast.success(data.data.title, {
                  autoClose: 5000,
                  onClick: () => setShowDropdown(true),
                });
              }
            }

            // Show toast for DUPLICATE_UPLOAD notifications
            if (data.data?.type === 'DUPLICATE_UPLOAD') {
              toast.warning(data.data.title, {
                autoClose: 8000,
                onClick: () => setShowDropdown(true),
              });
            }
          } else if (data.type === 'NEW_ALERTS') {
            // New alerts were created, refresh the list
            fetchNotifications();
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setSseConnected(false);
        eventSource.close();

        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch notifications from your actual API
      const response = await notificationService.getAllNotifications();

      // Handle your specific API response structure
      const notificationsData = response?.data || [];

      // Since your alerts are the same as notifications, use just the notifications
      const allNotifications = Array.isArray(notificationsData)
        ? notificationsData
        : [];

      setNotifications(allNotifications);
      const unread = allNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications only when bell is clicked
  const handleBellClick = async () => {
    const newShowState = !showDropdown;
    setShowDropdown(newShowState);

    // Fetch notifications when opening the dropdown
    if (newShowState) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleRefreshNotifications = async () => {
    await fetchNotifications();
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);

      // Remove notification from list
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleOpenDetail = (notification) => {
    setDetailModal({ open: true, notification });
  };

  const handleCloseDetail = () => {
    setDetailModal({ open: false, notification: null });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return (
          <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-orange-600'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'OUT_OF_STOCK':
        return (
          <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-red-600'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'BULK_PO_COMPLETE':
        return (
          <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-green-600'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'DUPLICATE_UPLOAD':
        return (
          <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-yellow-600'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
              <path
                fillRule='evenodd'
                d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className='relative'>
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className='relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'
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
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
          />
        </svg>
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold'>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className='fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] max-h-96 overflow-hidden'
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '384px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <div className='p-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Notifications
              </h3>

              <div className='flex items-center gap-2'>
                {/* SSE status indicator */}
                <span
                  className={`text-xs ${sseConnected ? 'text-green-600' : 'text-gray-400'}`}
                  title={sseConnected ? 'Real-time updates active' : 'Real-time updates inactive'}
                >
                  {sseConnected ? '● Live' : '○ Offline'}
                </span>
                {/* refresh notification */}
                <button
                  onClick={handleRefreshNotifications}
                  className='text-sm text-gray-600 hover:text-gray-700 font-medium'
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className='max-h-80 overflow-y-auto'>
            {loading ? (
              <div className='p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
                <p className='mt-2 text-sm text-gray-600'>
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className='p-8 text-center'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    />
                  </svg>
                </div>
                <p className='text-gray-600'>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className='flex items-start space-x-3'>
                    {getNotificationIcon(notification.type)}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900'>
                            {notification.title}
                          </p>
                          <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                            {notification.message}
                          </p>
                        </div>
                        <div className='flex items-center gap-1 ml-2'>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                            >
                              Read
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className='p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors'
                            title='Delete notification'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className='text-xs text-gray-500 mt-2'>
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                      {/* Detail button for notifications with long messages */}
                      {notification.message && notification.message.length > 100 && (
                        <button
                          onClick={() => handleOpenDetail(notification)}
                          className='mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1'
                        >
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                          </svg>
                          Lihat Detail
                        </button>
                      )}
                      {notification.type === 'LOW_STOCK' &&
                        notification.inventory && (
                          <div className='mt-2 text-xs text-gray-600'>
                            {(() => {
                              const inventoryInfo = notification.inventory;
                              const itemStocks = inventoryInfo.itemStock || inventoryInfo.itemStocks || {};
                              const stokQuantity =
                                itemStocks.stok_quantity ??
                                inventoryInfo.stok_quantity ??
                                inventoryInfo.stok_barang ??
                                0;
                              const minStock =
                                itemStocks.min_stok ??
                                inventoryInfo.min_stok ??
                                0;

                              return (
                                <>
                                  <span className='font-medium'>Current stock:</span>{' '}
                                  {stokQuantity}
                                  <span className='ml-2'>•</span>
                                  <span className='ml-2 font-medium'>
                                    Min stock:
                                  </span>{' '}
                                  {minStock}
                                </>
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.open && detailModal.notification && (
        <div className='fixed inset-0 z-[10000] flex items-center justify-center'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black bg-opacity-50'
            onClick={handleCloseDetail}
          />
          {/* Modal Content */}
          <div className='relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-200'>
              <div className='flex items-center gap-3'>
                {getNotificationIcon(detailModal.notification.type)}
                <h3 className='text-lg font-semibold text-gray-900'>
                  Detail Notifikasi
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className='p-4 overflow-y-auto max-h-[60vh]'>
              <p className='text-sm font-medium text-gray-900 mb-2'>
                {detailModal.notification.title}
              </p>
              <p className='text-xs text-gray-500 mb-4'>
                {formatRelativeTime(detailModal.notification.createdAt)}
              </p>
              <div className='bg-gray-50 rounded-lg p-4'>
                <pre className='text-sm text-gray-700 whitespace-pre-wrap font-sans'>
                  {detailModal.notification.message}
                </pre>
              </div>
            </div>
            {/* Footer */}
            <div className='flex justify-end gap-2 p-4 border-t border-gray-200'>
              {!detailModal.notification.isRead && (
                <button
                  onClick={() => {
                    handleMarkAsRead(detailModal.notification.id);
                    handleCloseDetail();
                  }}
                  className='px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors'
                >
                  Tandai Sudah Dibaca
                </button>
              )}
              <button
                onClick={handleCloseDetail}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors'
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
