'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import OperatorSidebar from '@/components/operator/OperatorSidebar';
import OperatorGenerators from '@/components/operator/OperatorGenerators';
import OperatorBatteries from '@/components/operator/OperatorBatteries';
import OperatorReports from '@/components/operator/OperatorReports';
import OperatorNotifications from '@/components/operator/OperatorNotifications';

export default function OperatorPanel() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const router = useRouter();

  const renderContent = () => {
    switch (currentPage) {
      case 'Generators':
        return <OperatorGenerators onNavigate={setCurrentPage} />;
      case 'Batteries':
        return <OperatorBatteries onNavigate={setCurrentPage} />;
      case 'Reports':
        return <OperatorReports onNavigate={setCurrentPage} />;
      case 'Notifications':
        return <OperatorNotifications onNavigate={setCurrentPage} />;
      default:
        return (
          <div className="flex-1 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {currentPage}
                </h1>
                <p className="text-gray-600 text-base md:text-lg">
                  Operator {currentPage} page content will be implemented here.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Operator Panel</h3>
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
        <OperatorSidebar
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
