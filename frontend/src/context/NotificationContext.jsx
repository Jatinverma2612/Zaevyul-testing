import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const NotificationContext = createContext();

export function notifyDataChanged() {
  window.dispatchEvent(new Event('admin-data-updated'));
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const report = await api.reports.get();
      const lowStock = report?.stats?.lowStockCount || 0;
      const outOfStock = report?.stats?.outOfStockCount || 0;
      const pending = report?.stats?.pendingOrders || 0;

      const list = [];

      if (outOfStock > 0) {
        list.push({
          id: 'out-of-stock',
          title: 'Out of Stock Alert',
          message: `${outOfStock} product${outOfStock > 1 ? 's' : ''} completely out of stock`,
          detail: 'Click to update product stock on Inventory page',
          time: 'Live alert',
          path: '/admin/products',
        });
      }

      if (lowStock > 0) {
        list.push({
          id: 'low-stock',
          title: 'Low Stock Alert',
          message: `${lowStock} product${lowStock > 1 ? 's' : ''} low on stock`,
          detail: 'Click to adjust stock levels on Inventory page',
          time: 'Live alert',
          path: '/admin/products',
        });
      }

      if (pending > 0) {
        list.push({
          id: 'pending-orders',
          title: 'Pending Orders',
          message: `${pending} order${pending > 1 ? 's' : ''} awaiting fulfillment`,
          detail: 'Click to view & update order status on Orders page',
          time: 'Live alert',
          path: '/admin/orders',
        });
      }

      if (list.length === 0) {
        list.push({
          id: 'all-clear',
          title: 'System Operational',
          message: 'All inventory & orders up to date',
          detail: 'No pending alerts at this time',
          time: 'Just now',
          path: '/admin/dashboard',
          isClearItem: true,
        });
      }

      setNotifications(list);
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleDataUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('admin-data-updated', handleDataUpdate);
    const interval = setInterval(fetchNotifications, 3000);

    return () => {
      window.removeEventListener('admin-data-updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback((id) => {
    setReadIds(prev => new Set(prev).add(id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(new Set(notifications.map(n => n.id)));
  }, [notifications]);

  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    if (notification.path) {
      navigate(notification.path);
    }
  }, [markAsRead, navigate]);

  const activeNotifications = notifications.map(n => ({
    ...n,
    read: n.isClearItem ? true : readIds.has(n.id),
  }));

  const unreadCount = activeNotifications.filter(n => !n.read && !n.isClearItem).length;
  const hasAlerts = activeNotifications.some(n => !n.isClearItem);

  return (
    <NotificationContext.Provider
      value={{
        notifications: activeNotifications,
        unreadCount,
        hasAlerts,
        markAsRead,
        markAllAsRead,
        handleNotificationClick,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
