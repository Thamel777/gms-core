'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { useRouter } from 'next/navigation';

import { auth, db } from '@/firebaseConfig';

interface TechnicianAssignedGeneratorsProps {
  onNavigate?: (page: string) => void;
}

interface RawTask {
  generatorId?: string;
  assignedTo?: string;
}

interface RawGenerator {
  model?: string;
  location?: string;
  capacity?: string;
  runningHours?: string;
  nextServiceDate?: string;
  nextService?: string;
  status?: string;
  issues?: number;
  brand?: string;
  size?: string;
  runtimeHours?: string | number;
  id?: string;
}

interface GeneratorDetails {
  id: string;
  model: string;
  location: string;
  capacity: string;
  nextService: string;
  status: 'operational' | 'maintenance' | 'offline' | 'unknown';
  statusLabel: string;
  issues: number;
}

const normalize = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
};

const classifyStatus = (status?: string | null): { normalized: GeneratorDetails['status']; label: string } => {
  if (!status) {
    return { normalized: 'unknown', label: 'Unknown' };
  }

  const value = status.toLowerCase();

  if (value.includes('maint')) {
    return { normalized: 'maintenance', label: 'Maintenance' };
  }

  if (value.includes('down') || value.includes('inactive') || value.includes('unusable') || value.includes('repair')) {
    return { normalized: 'offline', label: status.trim() || 'Offline' };
  }

  if (value.includes('oper') || value.includes('active') || value.includes('ready')) {
    return { normalized: 'operational', label: status.trim() || 'Operational' };
  }

  return { normalized: 'unknown', label: status.trim() || 'Unknown' };
};

const getStatusColor = (status: GeneratorDetails['status']) => {
  switch (status) {
    case 'operational':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'offline':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
};

export default function TechnicianAssignedGenerators({ onNavigate }: TechnicianAssignedGeneratorsProps): React.JSX.Element {
  void onNavigate;

  const router = useRouter();
  const [assignmentIdentifiers, setAssignmentIdentifiers] = useState<string[]>([]);
  const [tasks, setTasks] = useState<RawTask[]>([]);
  const [generators, setGenerators] = useState<Record<string, RawGenerator>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [generatorsLoaded, setGeneratorsLoaded] = useState(false);

  useEffect(() => {
    const authInstance = auth();
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      if (!user) {
        setAssignmentIdentifiers([]);
        return;
      }

      const identifiers = new Set<string>();
      identifiers.add(user.uid);

      if (user.email) {
        identifiers.add(normalize(user.email) ?? '');
      }
      if (user.displayName) {
        identifiers.add(normalize(user.displayName) ?? '');
      }

      const dbInstance = db();
      const profileRef = ref(dbInstance, `users/${user.uid}`);
      const profileUnsub = onValue(profileRef, (snapshot) => {
        const data = snapshot.val() as { name?: string; email?: string } | null;
        if (data?.name) {
          identifiers.add(normalize(data.name) ?? '');
        }
        if (data?.email) {
          identifiers.add(normalize(data.email) ?? '');
        }
        identifiers.delete('');
        setAssignmentIdentifiers(Array.from(identifiers));
      });

      return () => profileUnsub();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbInstance = db();
    const tasksRef = ref(dbInstance, 'tasks');
    const generatorsRef = ref(dbInstance, 'generators');

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawTask> | null;
      if (!value) {
        setTasks([]);
        setTasksLoaded(true);
        return;
      }

      const mapped = Object.values(value).map((task) => ({
        generatorId: task.generatorId ?? '',
        assignedTo: task.assignedTo ?? '',
      }));

      setTasks(mapped);
      setTasksLoaded(true);
    });

    const unsubscribeGenerators = onValue(generatorsRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawGenerator> | null;
      setGenerators(value ?? {});
      setGeneratorsLoaded(true);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeGenerators();
    };
  }, []);

  useEffect(() => {
    if (tasksLoaded && generatorsLoaded) {
      setIsLoading(false);
    }
  }, [tasksLoaded, generatorsLoaded]);

  const assignedGenerators = useMemo<GeneratorDetails[]>(() => {
    if (!assignmentIdentifiers.length) {
      return [];
    }

    const matched = new Map<string, GeneratorDetails>();

    const normalizedIdentifiers = new Set(assignmentIdentifiers.map((id) => id.trim().toLowerCase()));

    tasks.forEach((task) => {
      if (!task.generatorId) {
        return;
      }

      const assigned = normalize(task.assignedTo) ?? '';
      if (!assigned) {
        return;
      }

      if (!normalizedIdentifiers.has(assigned) && !normalizedIdentifiers.has((task.assignedTo ?? '').trim().toLowerCase())) {
        return;
      }

      if (matched.has(task.generatorId)) {
        return;
      }

      const metadataDirect = generators[task.generatorId];
      const metadataFallback = metadataDirect
        ? metadataDirect
        : Object.values(generators).find((gen) => normalize(gen.id) === normalize(task.generatorId)) ?? {};
      const metadata = metadataDirect ?? metadataFallback;

      const { normalized: normalizedStatus, label: statusLabel } = classifyStatus(metadata.status);

      matched.set(task.generatorId, {
        id: task.generatorId,
        model: metadata.brand ?? metadata.model ?? 'Unknown model',
        location: metadata.location ?? 'Not specified',
        capacity: metadata.size ?? metadata.capacity ?? 'Not specified',
        nextService: formatDate(metadata.nextServiceDate ?? metadata.nextService),
        status: normalizedStatus,
        statusLabel,
        issues: typeof metadata.issues === 'number' ? metadata.issues : 0,
      });
    });

    return Array.from(matched.values());
  }, [tasks, assignmentIdentifiers, generators]);

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Assigned Generators</h1>
          <p className="text-gray-600 text-lg">Monitor generators assigned through your current tasks.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 text-gray-600 hover:text-gray-800"
            type="button"
            aria-label="View assignment history"
            title="View assignment history"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            className="p-2 text-gray-600 hover:text-gray-800"
            type="button"
            aria-label="Open technician profile"
            title="Open technician profile"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading assigned generators...
        </div>
      ) : assignedGenerators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <AlertTriangle className="w-10 h-10 text-orange-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">No generators assigned yet</p>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            Once tasks are assigned to you with generator IDs, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedGenerators.map((generator) => (
            <div key={generator.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{generator.id}</h3>
                  <p className="text-gray-600 text-sm">{generator.model}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(generator.status)}`}>
                  {generator.statusLabel}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Location:</span>
                  <span className="text-gray-900 text-sm font-medium">{generator.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Capacity:</span>
                  <span className="text-gray-900 text-sm font-medium">{generator.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Next Service:</span>
                  <span className="text-gray-900 text-sm font-medium">{generator.nextService}</span>
                </div>
              </div>

              {generator.issues > 0 && (
                <div className="flex items-center text-orange-600 text-sm mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {generator.issues} Open Issue(s)
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                  type="button"
                  onClick={() => {
                    router.push(`/generators/${encodeURIComponent(generator.id)}?from=technician`);
                  }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Details
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
