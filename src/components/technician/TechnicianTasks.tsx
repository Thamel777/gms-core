'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle2, OctagonAlert as AlertOctagon, X } from 'lucide-react';
import { MdSearch } from 'react-icons/md';
import { ref, onValue, update } from 'firebase/database';

import { auth, db } from '@/firebaseConfig';

type TaskStatus = 'pending' | 'completed' | 'overdue';

interface RawTask {
  id?: string;
  taskId?: string;
  description?: string;
  assignedTo?: string;
  generatorId?: string;
  dueDate?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface Task {
  id: string;
  taskId: string;
  description: string;
  assignedTo: string;
  generatorId: string;
  dueDate: string;
  status: TaskStatus;
  createdAt?: number;
  updatedAt?: number;
}

interface TechnicianTasksProps {
  onNavigate?: (page: string) => void;
}

interface TechnicianProfile {
  id: string;
  name?: string;
  email?: string;
}

interface AuthUserInfo {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: TaskStatus): string => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Unknown';
  }
};

const normalize = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
};

const formatDate = (value: string): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const isDueToday = (dueDate: string): boolean => {
  if (!dueDate) {
    return false;
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  parsed.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return parsed.getTime() === today.getTime();
};

export default function TechnicianTasks({ onNavigate }: TechnicianTasksProps): React.JSX.Element {
  void onNavigate;

  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserInfo | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    const authInstance = auth();
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = authInstance.onAuthStateChanged((user) => {
      if (!user) {
        setAuthUser(null);
        setProfile(null);
        setProfileLoading(false);
        profileUnsubscribe?.();
        profileUnsubscribe = null;
        return;
      }

      setProfileLoading(true);
      setAuthUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      const dbInstance = db();
      const userRef = ref(dbInstance, `users/${user.uid}`);

      profileUnsubscribe?.();
      profileUnsubscribe = onValue(
        userRef,
        (snapshot) => {
          const data = snapshot.val() as { name?: string; email?: string } | null;

          if (data) {
            setProfile({
              id: user.uid,
              name: data.name ?? user.displayName ?? undefined,
              email: data.email ?? user.email ?? undefined,
            });
          } else {
            setProfile({
              id: user.uid,
              name: user.displayName ?? undefined,
              email: user.email ?? undefined,
            });
          }
          setProfileLoading(false);
        },
        (firebaseError) => {
          console.error('Failed to load technician profile', firebaseError);
          setProfile({
            id: user.uid,
            name: user.displayName ?? undefined,
            email: user.email ?? undefined,
          });
          setProfileLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      profileUnsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const dbInstance = db();
    const tasksRef = ref(dbInstance, 'tasks');
    setTasksLoading(true);
    setError(null);

    const unsubscribe = onValue(
      tasksRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, RawTask> | null;

        if (!value) {
          setTasks([]);
          setTasksLoading(false);
          return;
        }

        const mapped: Task[] = Object.entries(value).map(([id, data]) => ({
          id,
          taskId: data.taskId ?? id,
          description: data.description ?? '',
          assignedTo: data.assignedTo ?? '',
          generatorId: data.generatorId ?? '',
          dueDate: data.dueDate ?? '',
          status: (data.status as TaskStatus) ?? 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }));

        setTasks(mapped.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
        setTasksLoading(false);
        setError(null);
      },
      (firebaseError) => {
        console.error('Failed to load technician tasks', firebaseError);
        setTasks([]);
        setTasksLoading(false);
        setError('Unable to load your tasks right now. Please try again later.');
      }
    );

    return () => unsubscribe();
  }, []);

  const assignmentIdentifiers = useMemo(() => {
    const identifiers = new Set<string>();

    if (profile?.name) {
      identifiers.add(normalize(profile.name) ?? '');
    }
    if (profile?.email) {
      identifiers.add(normalize(profile.email) ?? '');
    }
    if (authUser?.displayName) {
      identifiers.add(normalize(authUser.displayName) ?? '');
    }
    if (authUser?.email) {
      identifiers.add(normalize(authUser.email) ?? '');
    }

    identifiers.delete('');
    return Array.from(identifiers);
  }, [profile, authUser]);

  const technicianTasks = useMemo(() => {
    if (!assignmentIdentifiers.length) {
      return [];
    }

    return tasks.filter((task) => {
      const assigned = normalize(task.assignedTo);
      return Boolean(assigned && assignmentIdentifiers.includes(assigned));
    });
  }, [tasks, assignmentIdentifiers]);

  const filteredTasks = useMemo(() => {
    let scoped = technicianTasks;

    if (statusFilter !== 'all') {
      scoped = scoped.filter((task) => task.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      scoped = scoped.filter((task) =>
        task.taskId.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search) ||
        task.generatorId.toLowerCase().includes(search)
      );
    }

    return scoped;
  }, [technicianTasks, statusFilter, searchTerm]);

  const summary = useMemo(() => {
    const pending = technicianTasks.filter((task) => task.status === 'pending').length;
    const completed = technicianTasks.filter((task) => task.status === 'completed').length;
    const overdue = technicianTasks.filter((task) => task.status === 'overdue').length;
    const dueToday = technicianTasks.filter((task) => isDueToday(task.dueDate)).length;

    return { pending, completed, overdue, dueToday };
  }, [technicianTasks]);

  const isLoading = profileLoading || tasksLoading;
  const displayName = profile?.name ?? authUser?.displayName ?? 'Technician';
  const displayEmail = profile?.email ?? authUser?.email ?? undefined;

  const handleToggleTaskStatus = async (task: Task) => {
    if (!task.id) {
      return;
    }

    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    setUpdatingTaskId(task.id);
    setError(null);

    try {
      const dbInstance = db();
      await update(ref(dbInstance, `tasks/${task.id}`), {
        status: nextStatus,
        updatedAt: Date.now(),
      });
    } catch (firebaseError) {
      console.error('Failed to update task status', firebaseError);
      setError('Could not update the task status. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Tasks</h1>
          <p className="text-gray-600 text-lg">
            View and manage your assigned tasks with real-time updates.
          </p>
        </div>
        <div className="text-sm text-gray-500 md:text-right">
          <p className="font-medium text-gray-700">Signed in as</p>
          <p className="text-gray-900 font-semibold">{displayName}</p>
          {displayEmail && <p>{displayEmail}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow p-6">
          <AlertCircle className="mx-auto text-yellow-500 mb-2" />
          <h3 className="text-sm text-gray-500">Pending</h3>
          <p className="text-xl font-bold">{summary.pending}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow p-6">
          <CheckCircle2 className="mx-auto text-green-600 mb-2" />
          <h3 className="text-sm text-gray-500">Completed</h3>
          <p className="text-xl font-bold">{summary.completed}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow p-6">
          <AlertOctagon className="mx-auto text-red-500 mb-2" />
          <h3 className="text-sm text-gray-500">Overdue</h3>
          <p className="text-xl font-bold">{summary.overdue}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow p-6">
          <CalendarCheck className="mx-auto text-blue-500 mb-2" />
          <h3 className="text-sm text-gray-500">Due Today</h3>
          <p className="text-xl font-bold">{summary.dueToday}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter tasks by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 flex items-center">
            <span className="font-medium text-gray-700 mr-2">Total Assigned</span>
            <span className="text-gray-900 font-semibold">{technicianTasks.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-blue-200 shadow">
        <div className="p-6 border-b border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Assigned Tasks</h2>
          <p className="text-gray-600">{filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} found</p>
        </div>

        {isLoading ? (
          <p className="text-center py-6 text-gray-500">Loading your tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No tasks assigned to you yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Task ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Generator</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`border-b border-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'} hover:bg-blue-50`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{task.taskId}</td>
                    <td className="py-3 px-4 text-gray-700">{task.description}</td>
                    <td className="py-3 px-4 text-gray-700">{task.generatorId || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">{formatDate(task.dueDate)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                          type="button"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          type="button"
                          disabled={updatingTaskId === task.id}
                        >
                          {task.status === 'completed' ? 'Reopen' : 'Mark Complete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              type="button"
              aria-label="Close task details"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-blue-600 mb-4">Task Details</h2>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-medium">Task ID:</span> {selectedTask.taskId}</p>
              <p><span className="font-medium">Description:</span> {selectedTask.description}</p>
              <p><span className="font-medium">Generator:</span> {selectedTask.generatorId || '—'}</p>
              <p><span className="font-medium">Assigned:</span> {selectedTask.assignedTo || '—'}</p>
              <p><span className="font-medium">Due Date:</span> {formatDate(selectedTask.dueDate)}</p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTask.status)}`}>
                  {getStatusLabel(selectedTask.status)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
