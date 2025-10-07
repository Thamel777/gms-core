'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import Sidebar from '@/components/admin/Sidebar';
import NotificationCenter from '@/components/admin/NotificationCenter';
import Dashboard from '@/components/admin/Dashboard';
import Generators from '@/components/admin/Generators';
import Batteries from '@/components/admin/Batteries';
import Tasks from '@/components/admin/Tasks';
import Services from '@/components/admin/Services';
import Shops from '@/components/admin/Shops';
import Invoices from '@/components/Invoices';
import CreateInvoice from '@/components/admin/CreateInvoice';
import Reports from '@/components/admin/Reports';
import Users from '@/components/admin/Users';
import GeneratorDetails from '@/components/admin/GeneratorDetails';

function AdminPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPage = (searchParams?.get('page') as string) || 'Dashboard';
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string | null>(null);

  // Keep URL in sync when navigating inside admin
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage);
    window.history.replaceState({}, '', url.toString());
  }, [currentPage]);

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'Generators':
        return <Generators onNavigate={setCurrentPage} onSelectGenerator={setSelectedGeneratorId}/>;
      case 'Batteries':
        return <Batteries onNavigate={setCurrentPage} />;
      case 'Tasks':
        return <Tasks />;
      case 'Services':
        return <Services />;
      case 'Shops':
        return <Shops />;
      case 'Invoices':
        return <Invoices onNavigate={setCurrentPage} />;
      case 'CreateInvoice':
        return <CreateInvoice onBack={() => setCurrentPage('Invoices')} />;
      case 'Reports':
        return <Reports />;
      case 'Users':
        return <Users />;
      case 'Notifications':
        return <NotificationCenter />;
      case 'GeneratorDetails':
        return <GeneratorDetails onNavigate={setCurrentPage} generatorId={selectedGeneratorId ?? ''} />;
      default:
        return (
          <div className="flex-1 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {currentPage}
                </h1>
                <p className="text-gray-600 text-base md:text-lg">
                  {currentPage} page content will be implemented here.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
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
        <Sidebar
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
          userRole="admin"
        />
      </div>
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AdminPanelContent />
    </Suspense>
  );
}
