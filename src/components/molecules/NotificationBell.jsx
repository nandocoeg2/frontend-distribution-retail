import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../../services/notificationService.js';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Set up interval to refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
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

  const fetchNotifications = async () => {
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
  };

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
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
    try {
      setLoading(true);

      // Call both alerts endpoint and getAll notifications
      const [alertsResponse, notificationsResponse] = await Promise.all([
        fetch('http://localhost:5050/api/v1/notifications/alerts'),
        notificationService.getAllNotifications(),
      ]);

      let allNotifications = [];

      // Process alerts from API
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        const alerts = Array.isArray(alertsData) ? alertsData : [];

        const formattedAlerts = alerts.map((alert) => ({
          id: alert.id || `alert-${Date.now()}-${Math.random()}`,
          title: alert.title || 'Alert',
          message: alert.message || alert.body || 'New notification',
          type: alert.type || 'ALERT',
          isRead: alert.isRead || alert.read || false,
          createdAt:
            alert.createdAt || alert.timestamp || new Date().toISOString(),
          inventory: alert.inventory || null,
        }));

        allNotifications = [...formattedAlerts];
      }

      // Process notifications from service
      const notificationsData = notificationsResponse?.data || [];
      const serviceNotifications = Array.isArray(notificationsData)
        ? notificationsData
        : [];

      // Merge notifications and remove duplicates based on ID
      const mergedNotifications = [...allNotifications];

      serviceNotifications.forEach((notification) => {
        const exists = mergedNotifications.find(
          (n) =>
            n.id === notification.id ||
            (notification.title &&
              n.title === notification.title &&
              n.message === notification.message)
        );
        if (!exists) {
          mergedNotifications.push({
            ...notification,
            id: notification.id || `notif-${Date.now()}-${Math.random()}`,
          });
        }
      });

      // Sort by createdAt (newest first)
      mergedNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(mergedNotifications);
      const unread = mergedNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Fallback to single fetch if combined call fails
      await fetchNotifications();
    } finally {
      setLoading(false);
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

              <div>
                {/* refresh notification */}
                <button
                  onClick={handleRefreshNotifications}
                  className='text-sm text-gray-600 hover:text-gray-700 font-medium'
                >
                  Refresh
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
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
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
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className='text-xs text-blue-600 hover:text-blue-700 font-medium ml-2'
                          >
                            Read
                          </button>
                        )}
                      </div>
                      <p className='text-xs text-gray-500 mt-2'>
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                      {notification.type === 'LOW_STOCK' &&
                        notification.inventory && (
                          <div className='mt-2 text-xs text-gray-600'>
                            <span className='font-medium'>Current stock:</span>{' '}
                            {notification.inventory.stok_barang}
                            <span className='ml-2'>•</span>
                            <span className='ml-2 font-medium'>
                              Min stock:
                            </span>{' '}
                            {notification.inventory.min_stok}
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
    </div>
  );
};

export default NotificationBell;
