'use client';

import { FaBell } from "react-icons/fa";

interface OperatorNotificationsProps {
  onNavigate?: (page: string) => void;
}

export default function OperatorNotifications({ }: OperatorNotificationsProps) {
  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Notifications</h1>
            <p className="text-gray-600 text-lg">View system alerts and notifications</p>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FaBell className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Notifications container */}
      <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FaBell className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-500">You don&apos;t have any notifications at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">New notifications will appear here when available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
