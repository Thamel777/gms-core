'use client';

import { useState } from 'react';
import { OperatorOption, ShopFormValues, emptyShopForm } from './types';

interface AddShopFormProps {
  operators: OperatorOption[];
  onCancel: () => void;
  onCreate: (values: ShopFormValues) => Promise<void>;
  onSuccess?: () => void;
}

export default function AddShopForm({ operators, onCancel, onCreate, onSuccess }: AddShopFormProps) {
  const [form, setForm] = useState<ShopFormValues>({ ...emptyShopForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ShopFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    if (!form.name.trim() || !form.code.trim()) {
      setError('Please provide both shop name and code.');
      return;
    }
    if (!form.operatorId) {
      setError('Please select an operator for the shop.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreate({
        ...form,
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        contactNumber: form.contactNumber.trim(),
        notes: form.notes.trim(),
      });
      setForm({ ...emptyShopForm });
      onSuccess?.();
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message?: string }).message ?? 'Failed to create shop.');
      } else {
        setError('Failed to create shop.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Add New Shop</h1>
            <p className="text-gray-500 mt-1">Register a new generator service center and assign an operator.</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

        <form className="bg-white rounded-xl border border-blue-100 shadow p-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Downtown Generator Center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Code</label>
              <input
                type="text"
                value={form.code}
                onChange={handleChange('code')}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="SH001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={handleChange('address')}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={handleChange('city')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Colombo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={form.district}
                onChange={handleChange('district')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Western"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="tel"
              value={form.contactNumber}
              onChange={handleChange('contactNumber')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="+94 xx xxx xxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Operator</label>
            <select
              value={form.operatorId}
              onChange={handleChange('operatorId')}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select operator</option>
              {operators.map((operator) => (
                <option key={operator.uid} value={operator.uid}>
                  {operator.name} ({operator.email})
                </option>
              ))}
            </select>
            {operators.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">No operators found. Create operator users first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={handleChange('status')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Optional notes"
            />
          </div>

          <button
            type="submit"
            disabled={loading || operators.length === 0}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Shop'}
          </button>
        </form>
      </div>
    </div>
  );
}
