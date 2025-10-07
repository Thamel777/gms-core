'use client';

import { useState } from 'react';
import InventorySidebar from './InventorySidebar';
import InventoryDashboard from './InventoryDashboard';
import InventoryBatteryManagement from './InventoryBatteryManagement';
import InventoryChargerManagement from './InventoryChargerManagement';
import InventoryGatePassManagement from './InventoryGatePassMaagement';
import InventoryIssueTriage from './InventoryIssueTriage';
import InventoryInventoryReports from './InventoryInventoryReports';
import InventoryNotifications from './InventoryNotifications';

interface InventoryMainDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

export default function InventoryMainDashboard({ onLogout, userRole = 'inventory' }: InventoryMainDashboardProps) {
  const [currentPage, setCurrentPage] = useState('Dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <InventoryDashboard onNavigate={handleNavigate} />;
      case 'Battery Management':
        return <InventoryBatteryManagement onNavigate={handleNavigate} />;
      case 'Charger Management':
        return <InventoryChargerManagement onNavigate={handleNavigate} />;
      case 'Gate Pass Management':
        return <InventoryGatePassManagement onNavigate={handleNavigate} />;
      case 'Issue Triage':
        return <InventoryIssueTriage onNavigate={handleNavigate} />;
      case 'Inventory Reports':
        return <InventoryInventoryReports onNavigate={handleNavigate} />;
      case 'Notifications':
        return <InventoryNotifications onNavigate={handleNavigate} />;
      default:
        return <InventoryDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <InventorySidebar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onLogout={onLogout}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">
        {renderCurrentPage()}
      </main>
    </div>
  );
}