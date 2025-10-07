'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from "firebase/database";
import { auth, db } from "../../firebaseConfig";

interface Notification {
  id: string;
  type: 'service-due' | 'battery-return' | 'task-reminder' | 'repair-completed' | 'service-overdue' | 'new-task' | 'invoice-created' | 'invoice-updated' | 'invoice-paid';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  isRead: boolean;
  hasIndicator?: boolean;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');

  // 🔹 Load notifications from Firebase in real-time
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const notifRef = ref(db(), `notifications/${uid}`);
    const unsub = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      const arr: Notification[] = Object.entries<Record<string, unknown>>(data).map(([id, n]) => {
        const notification = n as {
          type?: string;
          title?: string;
          message?: string;
          body?: string;
          priority?: string;
          createdAt?: string | number;
          read?: boolean;
          hasIndicator?: boolean;
        };
        return {
          id,
          type: (notification.type || 'new-task') as Notification['type'],
          title: notification.title || '',
          message: notification.message || notification.body || "",
          priority: (notification.priority as 'high' | 'medium' | 'low') ?? 'low',
          timestamp: typeof notification.createdAt === 'number' ? notification.createdAt : (notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now()),
          isRead: notification.read ?? false,
          hasIndicator: notification.hasIndicator ?? false,
        };
      });
      // Sort by createdAt descending
      setNotifications(arr.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsub();
  }, []);

  // 🔹 Firebase actions
  const markAsRead = async (id: string) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const notifRef = ref(db(), `notifications/${uid}/${id}`);
    await update(notifRef, { read: true });
  };

  const deleteNotification = async (id: string) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const notifRef = ref(db(), `notifications/${uid}/${id}`);
    await remove(notifRef);
  };

  const markAllAsRead = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = (() => {
    switch (filter) {
      case 'all': return notifications;
      case 'unread': return notifications.filter(n => !n.isRead);
      case 'task-reminders': return notifications.filter(n => n.type === 'task-reminder' || n.type === 'new-task');
      case 'service-alerts': return notifications.filter(n => n.type === 'service-due' || n.type === 'service-overdue');
      case 'battery-warnings': return notifications.filter(n => n.type === 'battery-return');
      case 'repair-updates': return notifications.filter(n => n.type === 'repair-completed');
      case 'invoice-alerts': return notifications.filter(n => n.type === 'invoice-created' || n.type === 'invoice-updated' || n.type === 'invoice-paid');
      default: return notifications;
    }
  })();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service-due': case 'service-overdue': return <span>⚠️</span>;
      case 'battery-return': return <span>🔋</span>;
      case 'task-reminder': case 'new-task': return <span>📝</span>;
      case 'repair-completed': return <span>✅</span>;
      case 'invoice-created': return <span>📄</span>;
      case 'invoice-updated': return <span>📝</span>;
      case 'invoice-paid': return <span>💰</span>;
      default: return <span>🔔</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">Notification Center</h1>
            <p className="text-gray-600 text-base md:text-lg">Manage your system notifications and alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{unreadCount} unread</span>
            <button onClick={markAllAsRead} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
              Mark All Read
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm border border-blue-200 p-6 h-fit">
            <h3 className="text-sm font-medium text-blue-700 mb-3">Filters</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-lg text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 cursor-pointer pr-10"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="task-reminders">Task Reminders</option>
              <option value="service-alerts">Service Alerts</option>
              <option value="battery-warnings">Battery Warnings</option>
              <option value="repair-updates">Repair Updates</option>
              <option value="invoice-alerts">Invoice Alerts</option>
            </select>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-blue-200">
              <div className="p-6 border-b border-blue-200">
                <h2 className="text-lg font-semibold text-blue-900">Notifications</h2>
                <p className="text-sm text-gray-500">{filteredNotifications.length} notifications</p>
              </div>
              <div className="p-6 space-y-3">
                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">You&apos;re all caught up! No new notifications at this time.</p>
                  </div>
                )}

                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${notification.isRead
                      ? 'bg-white border-blue-200'
                      : 'bg-blue-50 border-blue-300'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-1 rounded ${getPriorityColor(notification.priority)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-blue-900">{notification.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                              notification.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {notification.priority}
                            </span>
                            {notification.hasIndicator && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Mark as read"
                          >✔️</button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete notification"
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
