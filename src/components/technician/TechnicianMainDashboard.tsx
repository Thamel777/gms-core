'use client';

import { useState } from 'react';
import TechnicianSidebar from './TechnicianSidebar';
import TechnicianTasks from './TechnicianTasks';
import TechnicianServicesLogging from './TechnicianSevicesLogging';
import TechnicianIssueReporting from './TechnicianIssuesReporting';
import TechnicianAssignedGenerators from './TechnicianAssignedGenerators';
import {TechnicianNotifications} from "@/components/technician/index";
import TechnicianIssuesReporting from './TechnicianIssuesReporting';

interface TechnicianMainDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

export default function TechnicianMainDashboard({ onLogout, userRole = 'technician' }: TechnicianMainDashboardProps) {
  const [currentPage, setCurrentPage] = useState('Reports');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Reports':
        return <TechnicianIssuesReporting onNavigate={setCurrentPage} />;
      case 'Tasks':
        return <TechnicianTasks onNavigate={setCurrentPage} />;
      case 'Services':
        return <TechnicianServicesLogging onNavigate={setCurrentPage} />;
      case 'Generators':
        return <TechnicianAssignedGenerators onNavigate={setCurrentPage} />;
      case 'Notifications':
        return <TechnicianNotifications onNavigate={setCurrentPage} />;
      default:
        return <TechnicianIssuesReporting onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <TechnicianSidebar
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