'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import InventorySidebar from '@/components/inventory/InventorySidebar';
import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import InventoryBatteryManagement from '@/components/inventory/InventoryBatteryManagement';
import InventoryGatePassManagement from '@/components/inventory/InventoryGatePassMaagement';
import InventoryChargerManagement from '@/components/inventory/InventoryChargerManagement';
import InventoryIssueTriage from '@/components/inventory/InventoryIssueTriage';
import InventoryInventoryReports from '@/components/inventory/InventoryInventoryReports';
import InventoryNotifications from '@/components/inventory/InventoryNotifications';

export default function InventoryPanel() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const router = useRouter();

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <InventoryDashboard onNavigate={setCurrentPage} />;
      case 'Battery Management':
        return <InventoryBatteryManagement />;
      case 'Gate Pass Management':
        return <InventoryGatePassManagement />;
      case 'Charger Management':
        return <InventoryChargerManagement />;
      case 'Issue Triage':
        return <InventoryIssueTriage onNavigate={setCurrentPage} />;
      case 'Inventory Reports':
        return <InventoryInventoryReports onNavigate={setCurrentPage} />;
      case 'Notifications':
        return <InventoryNotifications onNavigate={setCurrentPage} />;
      default:
        return (
          <div className="flex-1 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {currentPage}
                </h1>
                <p className="text-gray-600 text-base md:text-lg">
                  Inventory {currentPage} page content will be implemented here.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Panel</h3>
                  <p className="text-gray-500">This section is under development.</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-shrink-0">
        <InventorySidebar
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          onLogout={async () => {
            try {
              if (typeof window !== 'undefined') {
                await signOut(auth());
              }
            } catch (e) {
              console.error('Logout error', e);
            }
            router.push('/');
          }}
        />
      </div>
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
