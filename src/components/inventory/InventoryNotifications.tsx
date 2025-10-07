'use client';

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { auth, db } from "../../firebaseConfig";

interface InventoryNotification {
  id: string;
  status: string;
  issue: string;
  details: string;
  technician: string;
  cost: string;
  date: string;
  battery?: string;
  charger?: string;
  read: boolean;
  createdAt: number;
}

interface InventoryNotificationsProps {
  onNavigate?: (page: string) => void;
}

export default function InventoryNotifications({ onNavigate }: InventoryNotificationsProps) {
  const [notifications, setNotifications] = useState<InventoryNotification[]>([]);
  const [counts, setCounts] = useState({
    unread: 0,
    actionRequired: 0,
    highPriority: 0,
    today: 0,
  });

  // 🔹 Load notifications realtime
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const notifRef = ref(db(), `notifications/inventory/${uid}`);
    const unsub = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      const arr: InventoryNotification[] = (Object.values(data) as Record<string, unknown>[]).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        status: (n.status as string) ?? "Pending Review",
        issue: (n.title as string) ?? "Unknown Issue",
        details: (n.body as string) ?? "",
        technician: (n.technician as string) ?? "N/A",
        cost: (n.cost as string) ?? "N/A",
        date: (n.date as string) ?? new Date((n.createdAt as number) || Date.now()).toLocaleDateString(),
        battery: (n.battery as string) ?? "N/A",
        charger: (n.charger as string) ?? "N/A",
        read: (n.read as boolean) ?? false,
        createdAt: (n.createdAt as number) ?? Date.now(),
      }));

      // sort latest → oldest
      arr.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(arr);

      // summary counts
      const todayStr = new Date().toLocaleDateString();
      setCounts({
        unread: arr.filter((n) => !n.read).length,
        actionRequired: arr.filter((n) => n.status === "Pending Review" || n.status === "Investigating").length,
        highPriority: arr.filter((n) => n.status === "High Priority").length,
        today: arr.filter((n) => new Date(n.date).toLocaleDateString() === todayStr).length,
      });
    });

    return () => unsub();
  }, []);

  // 🔹 Mark single notification as read
  const setRead = async (id: string) => {
    const uid = auth().currentUser?.uid;
    if (!uid || !id) return;

    await update(ref(db(), `notifications/inventory/${uid}/${id}`), { read: true });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Notifications</h1>
            <p className="text-gray-600">Manage alerts, approvals, and system notifications</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
            Auto-Assign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Unread</p>
          <p className="text-2xl font-semibold text-blue-600">{counts.unread}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Action Required</p>
          <p className="text-2xl font-semibold text-orange-600">{counts.actionRequired}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">High Priority</p>
          <p className="text-2xl font-semibold text-red-600">{counts.highPriority}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Today</p>
          <p className="text-2xl font-semibold text-green-600">{counts.today}</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Latest Notifications</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications available.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                notification.read ? "bg-white" : "bg-orange-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {notification.issue}
                  </h3>
                  <p className="text-gray-600 mb-3">{notification.details}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Technician:</span>{" "}
                      {notification.technician}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span> {notification.cost}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {notification.date}
                    </div>
                    <div>
                      <span className="font-medium">Battery:</span>{" "}
                      {notification.battery}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="font-medium">Charger:</span>{" "}
                      {notification.charger}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {notification.status}
                  </span>
                  {!notification.read && (
                    <button
                      className="mt-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
                      onClick={() => setRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
