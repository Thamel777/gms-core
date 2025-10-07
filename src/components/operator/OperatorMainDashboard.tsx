'use client';

import { useState } from 'react';
import OperatorSidebar from './OperatorSidebar';
import OperatorIssueReporting from './OperatorIssueReporting';
import OperatorGenerators from './OperatorGenerators';
import OperatorBatteries from './OperatorBatteries';
import OperatorReports from './OperatorReports';
import OperatorNotifications from './OperatorNotifications';

interface OperatorMainDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

export default function OperatorMainDashboard({ onLogout, userRole = 'operator' }: OperatorMainDashboardProps) {
  const [currentPage, setCurrentPage] = useState('Issue Reporting');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Issue Reporting':
        return <OperatorIssueReporting onNavigate={handleNavigate} />;
      case 'Generators':
        return <OperatorGenerators onNavigate={handleNavigate} />;
      case 'Batteries':
        return <OperatorBatteries onNavigate={handleNavigate} />;
      case 'Reports':
        return <OperatorReports onNavigate={handleNavigate} />;
      case 'Notifications':
        return <OperatorNotifications onNavigate={handleNavigate} />;
      default:
        return <OperatorIssueReporting onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <OperatorSidebar
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