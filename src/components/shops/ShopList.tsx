'use client';

import { ManagedShop } from './types';

interface ShopListProps {
  shops: ManagedShop[];
  loading: boolean;
  formatDate: (timestamp?: number) => string;
  operatorNameFor: (operatorId: string, fallback?: string) => string;
  onEdit: (shop: ManagedShop) => void;
  onDelete: (shop: ManagedShop) => void;
}

export default function ShopList({ shops, loading, formatDate, operatorNameFor, onEdit, onDelete }: ShopListProps) {
  return (
    <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
      <div className="mb-3 text-lg font-semibold text-blue-600">Shop List</div>
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 'Loading shops...' : `${shops.length} shops found`}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">City</th>
              <th className="px-4 py-2 text-left">Operator</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Last Updated</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop.id} className="border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-2 font-medium text-gray-800">{shop.code}</td>
                <td className="px-4 py-2 text-gray-700">{shop.name}</td>
                <td className="px-4 py-2 text-gray-600">{shop.city || shop.district || '-'}</td>
                <td className="px-4 py-2 text-gray-600">{operatorNameFor(shop.operatorId, shop.operatorName)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      shop.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : shop.status === 'maintenance'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {shop.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{formatDate(shop.updatedAt)}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-blue-100 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      onClick={() => onEdit(shop)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(shop)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && shops.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                  No shops match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
