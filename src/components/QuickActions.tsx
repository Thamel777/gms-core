'use client';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  page: string; // Added to map to specific pages
}

const quickActions: QuickAction[] = [
  {
    id: 'breakdown',
    title: 'Breakdown Management',
    subtitle: 'Register new generator',
    icon: '📋',
    page: 'Generators' // Maps to "generators" page
  },
  {
    id: 'assign',
    title: 'Assign Task',
    subtitle: 'Create new task',
    icon: '📝',
    page: 'Tasks' // Maps to "tasks" page
  },
  {
    id: 'reports',
    title: 'View Reports',
    subtitle: 'Generate reports',
    icon: '📊',
    page: 'Reports' // Maps to "report" page
  }
];

export default function QuickActions({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const handleAction = (page: string) => {
    onNavigate?.(page); // Safely trigger navigation to the specified page
  };

  return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Frequently used operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
              <button
                  key={action.id}
                  onClick={() => handleAction(action.page)}
                  className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-left transition-colors border border-blue-200 hover:border-blue-300"
              >
                <div className="text-2xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.subtitle}</p>
              </button>
          ))}
        </div>
      </div>
  );
}