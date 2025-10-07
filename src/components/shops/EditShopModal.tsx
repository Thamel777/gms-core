'use client';

import { useEffect, useState } from 'react';
import { ManagedShop, OperatorOption, ShopFormValues } from './types';

interface EditShopModalProps {
  shop: ManagedShop;
  operators: OperatorOption[];
  onCancel: () => void;
  onSave: (shopId: string, values: ShopFormValues) => Promise<void>;
}

export default function EditShopModal({ shop, operators, onCancel, onSave }: EditShopModalProps) {
  const [form, setForm] = useState<ShopFormValues>({
    name: shop.name,
    code: shop.code,
    address: shop.address,
    city: shop.city,
    district: shop.district,
    contactNumber: shop.contactNumber,
    operatorId: shop.operatorId,
    status: shop.status,
    notes: shop.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: shop.name,
      code: shop.code,
      address: shop.address,
      city: shop.city,
      district: shop.district,
      contactNumber: shop.contactNumber,
      operatorId: shop.operatorId,
      status: shop.status,
      notes: shop.notes,
    });
    setError(null);
  }, [shop]);

  const handleChange = (field: keyof ShopFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.code.trim()) {
      setError('Please provide both shop name and code.');
      return;
    }
    if (!form.operatorId) {
      setError('Please select an operator for the shop.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(shop.id, {
        ...form,
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        contactNumber: form.contactNumber.trim(),
        notes: form.notes.trim(),
      });
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message?: string }).message ?? 'Failed to update shop.');
      } else {
        setError('Failed to update shop.');
      }
    } finally {
      setSaving(false);
    }
  };

  const availableOperators = () => {
    const exists = operators.some((operator) => operator.uid === shop.operatorId);
    if (exists || !shop.operatorId) {
      return operators;
    }
    return [
      ...operators,
      {
        uid: shop.operatorId,
        name: shop.operatorName,
        email: shop.operatorEmail ?? '',
        contactNumber: shop.operatorContact ?? '',
      },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Edit Shop</h2>
            <p className="text-sm text-gray-500">Update shop details and operator assignment.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={form.district}
                onChange={handleChange('district')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              {availableOperators().map((operator) => (
                <option key={operator.uid} value={operator.uid}>
                  {operator.name} ({operator.email})
                </option>
              ))}
            </select>
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

