'use client';

import { useState } from 'react';

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
  userRole?: string;
}

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Breakdowns'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Tasks'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Services Logging'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Assigned Generators'
  },
  {
    icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.649-.824a1 1 0 01.894 1.79l-1.301.65 1.06 1.415a1 1 0 11-1.615 1.174l-1.06-1.415-1.648.824v1.477a1 1 0 01-2 0v-1.477l-1.648-.824-1.06 1.415a1 1 0 01-1.615-1.174l1.06-1.415-1.301-.65a1 1 0 01.894-1.79l1.649.824L9 4.323V3a1 1 0 011-1zm0 16a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
    ),
    label: 'Notifications'
  },
];

export default function Sidebar({ onNavigate, currentPage, onLogout, userRole = 'admin' }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleItemClick = (itemLabel: string) => {
    // Map sidebar labels to the correct page names used in the technician page
    const pageMapping: Record<string, string> = {
      'Breakdowns': 'Reports',
      'Tasks': 'Tasks',
      'Services Logging': 'Services',
      'Assigned Generators': 'Generators',
      'Notifications': 'Notifications'
    };
    
    const targetPage = pageMapping[itemLabel] || itemLabel;
    onNavigate(targetPage);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

   // Map current page back to sidebar labels for highlighting
  const getActivePage = (page: string) => {
    const reverseMapping: Record<string, string> = {
      'Reports': 'Breakdowns',
      'Tasks': 'Tasks',
      'Services': 'Services Logging',
      'Generators': 'Assigned Generators',
      'Notifications': 'Notifications',
      'GeneratorDetails': 'Assigned Generators', // Detail page highlights parent menu
    };
    return reverseMapping[page] || page;
  };


  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header/Logo Section */}
      <div className="px-4 py-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-600">Technician Dashbaord</h1>
            <p className="text-xs text-gray-500">Generator Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => handleItemClick(item.label)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  getActivePage(currentPage) === item.label
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogoutClick}
          className="flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors w-full"
        >
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span className="truncate">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to logout? You will need to sign in again to access the system.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Yes, Logout
              </button>
              <button
                onClick={cancelLogout}
                className="flex-1 bg-white/80 backdrop-blur-sm text-gray-800 py-2 px-4 rounded-lg hover:bg-white transition-all duration-200 text-sm font-medium border border-gray-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}