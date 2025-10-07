'use client';

import { useEffect, useMemo, useState } from 'react';
import { onValue, ref, update, remove } from 'firebase/database';
import { deleteUser as deleteAuthUser } from 'firebase/auth';
import AddUserForm from './AddUserForm';
import { db, auth } from '../firebaseConfig';

type RoleFilter = 'All Roles' | 'Admin' | 'Technician' | 'Operator' | 'Inventory';
type StatusFilter = 'All Status' | 'Active' | 'Inactive' | 'Pending Invitation';

type RawRole = 'admin' | 'technician' | 'operator' | 'inventory';
type RawStatus = 'active' | 'disabled';

interface RawUserRecord {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  center?: string;
  lastLogin?: string;
}

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roleLabel: RoleFilter | 'Admin' | 'Technician' | 'Operator' | 'Inventory';
  rawRole: RawRole;
  statusLabel: StatusFilter | 'Active' | 'Inactive';
  rawStatus: RawStatus;
  center?: string | null;
  lastLogin?: string | null;
}

const roleLabels: Record<RawRole, RoleFilter> = {
  admin: 'Admin',
  technician: 'Technician',
  operator: 'Operator',
  inventory: 'Inventory',
};

const roleOptions: { value: RawRole; label: RoleFilter }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'technician', label: 'Technician' },
  { value: 'operator', label: 'Operator' },
  { value: 'inventory', label: 'Inventory' },
];

const roleColors: Record<RoleFilter, string> = {
  Admin: 'bg-purple-50 text-purple-600 border-purple-200',
  Technician: 'bg-blue-50 text-blue-600 border-blue-200',
  Operator: 'bg-green-50 text-green-600 border-green-200',
  Inventory: 'bg-amber-50 text-amber-600 border-amber-200',
  'All Roles': '',
};

const statusColors: Record<StatusFilter | 'Active' | 'Inactive', string> = {
  Active: 'bg-green-50 text-green-600',
  Inactive: 'bg-red-50 text-red-600',
  'Pending Invitation': 'bg-yellow-50 text-yellow-600',
  'All Status': '',
};

interface EditUserModalProps {
  user: ManagedUser;
  onClose: () => void;
  onSave: (updates: { name: string; email: string; role: RawRole; disabled: boolean }) => Promise<void>;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<RawRole>(user.rawRole);
  const [active, setActive] = useState<boolean>(user.rawStatus !== 'disabled');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    if (!name.trim()) {
      setError('Name is required.');
      setSaving(false);
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      setSaving(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      setSaving(false);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        disabled: !active
      });
      onClose();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message?: string }).message ?? 'Failed to update user.');
      } else {
        setError('Failed to update user.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900 text-sm">User Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-mono">
                {user.id}
              </div>
            </div>

            {user.lastLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm">
                  {user.lastLogin}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-sm">Permissions & Access</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={role}
                onChange={(e) => setRole(e.target.value as RawRole)}
                disabled={saving}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {roleOptions.find(r => r.value === role)?.label} role permissions will be applied
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">Account Status</span>
                <p className="text-xs text-gray-500 mt-1">
                  {active ? 'User can log in and access the system' : 'User login is disabled'}
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer gap-3 text-sm">
                <span className={`font-medium ${active ? 'text-green-600' : 'text-red-600'}`}>
                  {active ? 'Active' : 'Inactive'}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={saving}
                />
                <div className={`w-11 h-6 rounded-full relative transition-colors ${active ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      active ? 'translate-x-5' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: 'blue' | 'green' | 'purple' }) {
  const colorMap: Record<'blue' | 'green' | 'purple', string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className={`bg-white rounded-lg border p-4 flex flex-col gap-2 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{icon}</span>
        <span className="text-gray-400">&nbsp;</span>
      </div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-semibold text-black">{value}</div>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('All Roles');
  const [status, setStatus] = useState<StatusFilter>('All Status');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db(), 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawUserRecord> | null;
      if (!value) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const mapped: ManagedUser[] = Object.values(value).map((entry: RawUserRecord) => {
        const rawRole = (entry.role ?? 'admin') as RawRole;
        const rawStatus: RawStatus = entry.status === 'disabled' ? 'disabled' : 'active';
        return {
          id: entry.id ?? '',
          name: entry.name ?? '',
          email: entry.email ?? '',
          center: entry.center ?? null,
          lastLogin: entry.lastLogin ?? null,
          rawRole,
          roleLabel: roleLabels[rawRole] ?? 'Admin',
          rawStatus,
          statusLabel: rawStatus === 'disabled' ? 'Inactive' : 'Active',
        };
      });

      setUsers(mapped.sort((a, b) => a.email.localeCompare(b.email)));
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === 'All Roles' || user.roleLabel === role;
      const matchesStatus =
        status === 'All Status' || user.statusLabel === status || user.statusLabel === 'Pending Invitation';
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const technicianCount = users.filter((u) => u.roleLabel === 'Technician').length;
  const operatorCount = users.filter((u) => u.roleLabel === 'Operator').length;
  const adminCount = users.filter((u) => u.roleLabel === 'Admin').length;
  const inventoryCount = users.filter((u) => u.roleLabel === 'Inventory').length;

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setActionError(null);
    setActionMessage(null);
  };

  const handleSaveUser = async ({ name, email, role: newRole, disabled }: { name: string; email: string; role: RawRole; disabled: boolean }) => {
    if (!editingUser) return;

    const dbInstance = db();
    await update(ref(dbInstance, `users/${editingUser.id}`), {
      name,
      email,
      role: newRole,
      status: disabled ? 'disabled' : 'active',
      updatedAt: Date.now()
    });

    setActionMessage('User updated successfully.');
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    setActionError(null);
    setActionMessage(null);

    const confirmed = window.confirm(`Delete user ${user.email}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const dbInstance = db();
      await remove(ref(dbInstance, `users/${user.id}`));
      setActionMessage('User deleted successfully.');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setActionError((err as { message?: string }).message ?? 'Failed to delete user.');
      } else {
        setActionError('Failed to delete user.');
      }
    }
  };

  if (showAddUser) {
    return (
      <AddUserForm
        onCancel={() => setShowAddUser(false)}
        onSuccess={() => {
          setShowAddUser(false);
          setActionMessage('User created successfully.');
        }}
      />
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">User Management</h1>
          <div className="text-base text-gray-500 mt-1">Manage system users and their access permissions</div>
        </div>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center"
          onClick={() => setShowAddUser(true)}
        >
          + Add New User
        </button>
      </div>

      {actionMessage && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 mt-6">
        <StatCard label="Total Users" value={users.length} icon="TU" color="blue" />
        <StatCard label="Admins" value={adminCount} icon="AD" color="purple" />
        <StatCard label="Technicians" value={technicianCount} icon="TE" color="blue" />
        <StatCard label="Operators" value={operatorCount} icon="OP" color="green" />
        <StatCard label="Inventory" value={inventoryCount} icon="IN" color="green" />
      </div>

      <div className="bg-white rounded-xl border border-blue-300 p-6 mb-8">
        <div className="mb-2 text-lg font-semibold text-blue-700">Filters</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-blue-600 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
              className="bg-gray-100 rounded-lg px-4 py-2 w-full focus:outline-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option>All Roles</option>
              <option>Admin</option>
              <option>Technician</option>
              <option>Operator</option>
              <option>Inventory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="bg-gray-100 rounded-lg px-4 py-2 w-full focus:outline-blue-600 focus:ring-2 focus:ring-blue-600"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending Invitation</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-blue-300 p-6">
        <div className="mb-1 text-lg font-semibold text-blue-600">User List</div>
        <div className="mb-1 text-gray-600">
          {loading ? 'Loading users...' : `${filteredUsers.length} users found`}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-blue-600">User ID</th>
                <th className="px-4 py-2 text-left text-blue-600">Name</th>
                <th className="px-4 py-2 text-left text-blue-600">Email</th>
                <th className="px-4 py-2 text-left text-blue-600">Role</th>
                <th className="px-4 py-2 text-left text-blue-600">Status</th>
                <th className="px-4 py-2 text-left text-blue-600">Last Login</th>
                <th className="px-4 py-2 text-left text-blue-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={`${user.id}-${user.email}-${index}`} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-4 py-2 font-medium text-gray-700">{user.id}</td>
                  <td className="px-4 py-2">{user.name || '-'}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded border text-xs font-semibold ${roleColors[user.roleLabel] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {user.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[user.statusLabel] ?? 'bg-gray-50 text-gray-600'}`}>
                      {user.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-2">{user.lastLogin || 'Never'}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      title="Edit"
                      className="px-3 py-1 rounded border border-blue-100 text-blue-600 hover:bg-blue-50"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete"
                      className="px-3 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteUser(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
