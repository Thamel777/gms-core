'use client';

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { auth, db } from "../../firebaseConfig";
import { FaTools, FaBatteryFull, FaChartBar, FaBell } from "react-icons/fa";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  timestamp: string;
  read: boolean;
}

// 🔹 Icon selector
const getIcon = (type: string) => {
  switch (type) {
    case "task-reminder":
    case "new-task":
      return <FaTools className="text-2xl text-gray-700" />;
    case "battery-return":
      return <FaBatteryFull className="text-2xl text-gray-700" />;
    case "service-due":
    case "service-overdue":
      return <FaChartBar className="text-2xl text-gray-700" />;
    case "repair-completed":
      return <FaChartBar className="text-2xl text-gray-700" />;
    default:
      return <FaBell className="text-2xl text-gray-700" />;
  }
};

interface TechnicianNotificationsProps {
  onNavigate?: (page: string) => void;
}

export default function TechnicianNotifications({ onNavigate }: TechnicianNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔹 Load notifications from Firebase realtime
  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const notifRef = ref(db(), `notifications/technician/${uid}`);
    const unsub = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      const arr: Notification[] = (Object.values(data) as Record<string, unknown>[]).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        title: n.title as string,
        description: n.body as string,
        type: n.type as string,
        icon: getIcon(n.type as string),
        timestamp: new Date(n.createdAt as string | number).toLocaleString(),
        read: n.read as boolean,
      }));
      setNotifications(
        arr.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
      );
    });

    return () => unsub();
  }, []);

  // 🔹 Mark notification(s) as read
  const setRead = async (id: string | null) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    if (id === null) {
      // Mark all as read
      const updates: Promise<void>[] = notifications
        .filter((n) => !n.read)
        .map((n) =>
          update(ref(db(), `notifications/technician/${uid}/${n.id}`), {
            read: true,
          })
        );
      await Promise.all(updates);
    } else {
      await update(ref(db(), `notifications/technician/${uid}/${id}`), {
        read: true,
      });
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              View technician alerts and notifications
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FaBell className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Notifications container */}
      <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700 text-sm font-medium">
            {notifications.length} notifications
          </span>
          <button
            className="text-red-500 text-sm font-semibold hover:underline"
            onClick={() => setRead(null)}
            disabled={notifications.length === 0}
          >
            Mark All As Read
          </button>
        </div>
        <div className="space-y-6">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center">
              No notifications available.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`border border-blue-200 rounded-lg p-4 flex items-start gap-4 ${
                  notif.read ? "bg-gray-50" : "bg-orange-50"
                }`}
              >
                <div className="mt-1">{notif.icon}</div>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg text-gray-900 mb-1">
                    {notif.title}
                  </h2>
                  <p className="text-gray-700 text-sm mb-2">
                    {notif.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {notif.timestamp}
                    </span>
                    {!notif.read && (
                      <button
                        className="text-sm text-orange-600 hover:text-orange-800"
                        onClick={() => setRead(notif.id)}
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
    </div>
  );
}
