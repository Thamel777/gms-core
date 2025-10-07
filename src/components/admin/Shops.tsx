'use client';

import { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, remove, set, update } from 'firebase/database';
import AddShopForm from '../shops/AddShopForm';
import ShopList from '../shops/ShopList';
import EditShopModal from '../shops/EditShopModal';
import {
  ManagedShop,
  OperatorOption,
  RawShopRecord,
  RawUserRecord,
  ShopFormValues,
  ShopStatus,
} from '../shops/types';
import { db } from '../../firebaseConfig';

export default function ShopsPage() {
  const [shops, setShops] = useState<ManagedShop[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [operatorLookup, setOperatorLookup] = useState<Record<string, OperatorOption>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShopStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showAddShop, setShowAddShop] = useState(false);
  const [editingShop, setEditingShop] = useState<ManagedShop | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(db(), 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawUserRecord> | null;
      if (!value) {
        setOperators([]);
        setOperatorLookup({});
        return;
      }

      const options: OperatorOption[] = Object.entries(value)
        .filter(([, data]) => (data.role ?? '').toLowerCase() === 'operator')
        .map(([uid, data]) => ({
          uid,
          name: data.name ?? data.email ?? 'Operator',
          email: data.email ?? '',
          contactNumber: data.contactNumber ?? '',
        }));

      const lookup: Record<string, OperatorOption> = {};
      options.forEach((option) => {
        lookup[option.uid] = option;
      });

      setOperators(options);
      setOperatorLookup(lookup);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const shopsRef = ref(db(), 'shops');
    const unsubscribe = onValue(shopsRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawShopRecord> | null;
      if (!value) {
        setShops([]);
        setLoading(false);
        return;
      }

      const mapped: ManagedShop[] = Object.entries(value).map(([id, data]) => ({
        id,
        name: data.name ?? '',
        code: data.code ?? id,
        address: data.address ?? '',
        city: data.city ?? '',
        district: data.district ?? '',
        contactNumber: data.contactNumber ?? '',
        operatorId: data.operatorId ?? '',
        operatorName: data.operatorName ?? '',
        operatorEmail: data.operatorEmail ?? '',
        operatorContact: data.operatorContact ?? '',
        status: (data.status as ShopStatus) ?? 'active',
        notes: data.notes ?? '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }));

      setShops(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesSearch = [shop.name, shop.code, shop.city, shop.district]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shops, search, statusFilter]);

  const totalShops = shops.length;
  const activeCount = shops.filter((shop) => shop.status === 'active').length;
  const suspendedCount = shops.filter((shop) => shop.status === 'suspended').length;
  const maintenanceCount = shops.filter((shop) => shop.status === 'maintenance').length;

  const resetMessages = () => {
    setActionMessage(null);
    setActionError(null);
  };

  const handleCreateShop = async (values: ShopFormValues) => {
    const shopsRef = ref(db(), 'shops');
    const newShopRef = push(shopsRef);
    const operator = operatorLookup[values.operatorId];
    const payload = {
      id: newShopRef.key,
      name: values.name,
      code: values.code,
      address: values.address,
      city: values.city,
      district: values.district,
      contactNumber: values.contactNumber,
      operatorId: values.operatorId,
      operatorName: operator?.name ?? '',
      operatorEmail: operator?.email ?? '',
      operatorContact: operator?.contactNumber ?? '',
      status: values.status,
      notes: values.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await set(newShopRef, payload);
  };

  const handleUpdateShop = async (shopId: string, values: ShopFormValues) => {
    const operator = operatorLookup[values.operatorId];
    const updates = {
      name: values.name,
      code: values.code,
      address: values.address,
      city: values.city,
      district: values.district,
      contactNumber: values.contactNumber,
      operatorId: values.operatorId,
      operatorName: operator?.name ?? '',
      operatorEmail: operator?.email ?? '',
      operatorContact: operator?.contactNumber ?? '',
      status: values.status,
      notes: values.notes,
      updatedAt: Date.now(),
    };

    await update(ref(db(), `shops/${shopId}`), updates);
  };

  const handleDeleteShop = async (shop: ManagedShop) => {
    const confirmed = window.confirm(`Delete shop ${shop.name}? This cannot be undone.`);
    if (!confirmed) return;

    resetMessages();
    try {
      await remove(ref(db(), `shops/${shop.id}`));
      setActionMessage('Shop deleted successfully.');
    } catch (err) {
      console.error('Delete shop error', err);
      setActionError('Failed to delete shop. Please try again.');
    }
  };

  const operatorNameFor = (operatorId: string, fallback?: string) => {
    if (!operatorId) return fallback ?? '-';
    return operatorLookup[operatorId]?.name ?? fallback ?? '-';
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '--';
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return '--';
    }
  };

  if (showAddShop) {
    return (
      <AddShopForm
        operators={operators}
        onCancel={() => setShowAddShop(false)}
        onCreate={handleCreateShop}
        onSuccess={() => {
          setShowAddShop(false);
          setActionMessage('Shop created successfully.');
        }}
      />
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Shop Management</h1>
          <p className="text-gray-500 mt-1">Manage generator centers and their assigned operators.</p>
        </div>
        <button
          onClick={() => {
            resetMessages();
            setShowAddShop(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          + Add New Shop
        </button>
      </div>

      {actionMessage && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Shops" value={totalShops} color="blue" />
        <MetricCard label="Active" value={activeCount} color="green" />
        <MetricCard label="Suspended" value={suspendedCount} color="red" />
        <MetricCard label="Maintenance" value={maintenanceCount} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, code, city..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ShopStatus | 'all')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <ShopList
        shops={filteredShops}
        loading={loading}
        formatDate={formatDate}
        operatorNameFor={operatorNameFor}
        onEdit={(shop) => setEditingShop(shop)}
        onDelete={handleDeleteShop}
      />

      {editingShop && (
        <EditShopModal
          shop={editingShop}
          operators={operators}
          onCancel={() => setEditingShop(null)}
          onSave={async (shopId, values) => {
            resetMessages();
            await handleUpdateShop(shopId, values);
            setEditingShop(null);
            setActionMessage('Shop updated successfully.');
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'amber' }) {
  const colorMap: Record<typeof color, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${colorMap[color]}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
