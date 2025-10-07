'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref, push, set, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";
import { Battery, Clock, CircleCheck as CheckCircle, CalendarX, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';
import { MdSearch, MdAdd } from 'react-icons/md';

interface Batteries {
  onNavigate: (page: string) => void;
  onSelectBattery?: (id: string) => void;
}

type RawBatteryRecord = {
  id?: string;
  size?: string;
  serial_no?: string;
  issued_date?: number | string | null;
  install_date?: number | string | null;
  generator_id?: string;
  shop_id?: string;
  issue_type?: string; // Fix | Temporary
  gate_pass?: string;
  createdAt?: number;
  updatedAt?: number;
};

type BatteryRow = {
  id: string;
  batteryId: string;
  size: string;
  serialNumber: string;
  type: 'Fix' | 'Temporary';
  installDate: string;
  issuedDate: string;
  generatorId: string;
  shopName: string;
  gatePass: string;
  dbKey: string;
};

export default function Batteries({ onNavigate, onSelectBattery }: Batteries) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewBattery, setViewBattery] = useState<BatteryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formSize, setFormSize] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formIssuedDate, setFormIssuedDate] = useState("");
  const [formInstallDate, setFormInstallDate] = useState("");
  const [formGeneratorId, setFormGeneratorId] = useState("");
  const [formShopId, setFormShopId] = useState("");
  const [formIssueType, setFormIssueType] = useState<"Fix" | "Temporary">("Fix");
  const [formGatePass, setFormGatePass] = useState("");
  const [formAssignmentType, setFormAssignmentType] = useState<"generator" | "shop">("generator");

  const [batteries, setBatteries] = useState<BatteryRow[]>([]);
  const [shopNameById, setShopNameById] = useState<Record<string, string>>({});
  const [generatorNameById, setGeneratorNameById] = useState<Record<string, string>>({});
  const [rawByKey, setRawByKey] = useState<Record<string, RawBatteryRecord>>({});

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormError(null);
    setFormSize("");
    setFormSerial("");
    setFormIssuedDate("");
    setFormInstallDate("");
    setFormGeneratorId("");
    setFormShopId("");
    setFormIssueType("Fix");
    setFormGatePass("");
    setFormAssignmentType("generator");
  };

  const formatDate = (d?: number | string | null): string => {
    if (d == null || d === "") return "";
    try {
      const date = typeof d === "number" ? new Date(d) : new Date(String(d));
      if (isNaN(date.getTime())) return String(d);
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(d);
    }
  };

  const toInputDate = (d?: number | string | null): string => {
    if (!d && d !== 0) return "";
    const dt = typeof d === 'number' ? new Date(d) : new Date(String(d));
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDateOrNull = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    const t = d.getTime();
    return isNaN(t) ? null : t;
  };

  // Load shops data
  useEffect(() => {
    const unsub = onValue(ref(db(), "shops"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, { 
        name?: string; 
        code?: string; 
        city?: string;
        district?: string;
        status?: string;
      }>;
      const map: Record<string, string> = {};
      Object.entries(value).forEach(([id, data]) => {
        // Prioritize name over code, and include city/district info if available
        const displayName = data.name || data.code || id;
        const location = data.city || data.district;
        map[id] = location ? `${displayName} (${location})` : displayName;
      });
      setShopNameById(map);
    });
    return () => unsub();
  }, []);

  // Load generators data for dropdown
  useEffect(() => {
    const unsub = onValue(ref(db(), "generators"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, { id?: string; brand?: string; size?: string }>;
      const map: Record<string, string> = {};
      Object.entries(value).forEach(([key, data]) => {
        const id = String(data.id ?? key);
        const display = `${id} (${data.brand || ''} ${data.size || ''})`.trim();
        map[id] = display;
      });
      setGeneratorNameById(map);
    });
    return () => unsub();
  }, []);

  // Load batteries data
  useEffect(() => {
    const unsub = onValue(ref(db(), "batteries"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, RawBatteryRecord>;
      setRawByKey(value);
      const items: BatteryRow[] = Object.entries(value).map(([key, data]) => {
        const id = String(data.id ?? key);
        const batteryId = `B${String(data.id ?? key).padStart(3, '0')}`;
        const size = String(data.size ?? "");
        const serialNumber = String(data.serial_no ?? "");
        const type = (data.issue_type === "Temporary" ? "Temporary" : "Fix") as "Fix" | "Temporary";
        const installDate = formatDate(data.install_date ?? null);
        const issuedDate = formatDate(data.issued_date ?? null);
        const generatorId = String(data.generator_id ?? "");
        const shopName = data.shop_id ? (shopNameById[data.shop_id] ?? data.shop_id) : "";
        const gatePass = String(data.gate_pass ?? "");
        return { 
          id, 
          batteryId, 
          size, 
          serialNumber, 
          type, 
          installDate, 
          issuedDate, 
          generatorId, 
          shopName, 
          gatePass, 
          dbKey: key 
        };
      });
      items.sort((a, b) => a.id.localeCompare(b.id));
      setBatteries(items);
    });
    return () => unsub();
  }, [shopNameById]);

  const handleCreate = async () => {
    setFormError(null);
    if (!formSize || !formSerial) {
      setFormError("Size and Serial Number are required.");
      return;
    }

    // Validate that either generator OR shop is provided, not both
    if (!formGeneratorId && !formShopId) {
      setFormError("Either Generator or Shop must be selected.");
      return;
    }

    if (formGeneratorId && formShopId) {
      setFormError("Select either Generator or Shop, not both.");
      return;
    }

    // Validate gate pass for temporary issue type
    if (formIssueType === "Temporary" && !formGatePass) {
      setFormError("Gate Pass is required for Temporary issue type.");
      return;
    }

    try {
      setSubmitting(true);

      const payload: {
        size: string;
        serial_no: string;
        issued_date: number | null;
        install_date: number | null;
        issue_type: string;
        gate_pass: string | null;
        generator_id?: string;
        shop_id?: string;
        id?: string;
        createdAt?: number;
        updatedAt: number;
      } = {
        size: formSize,
        serial_no: formSerial,
        issued_date: parseDateOrNull(formIssuedDate),
        install_date: parseDateOrNull(formInstallDate),
        issue_type: formIssueType,
        gate_pass: formGatePass || null,
        updatedAt: Date.now(),
      };

      // Only include the selected assignment (either generator_id OR shop_id)
      if (formGeneratorId) {
        payload.generator_id = formGeneratorId;
      } else if (formShopId) {
        payload.shop_id = formShopId;
      }

      if (isEditing && editId) {
        payload.id = editId;
        await update(ref(db(), `batteries/${editId}`), payload);
      } else {
        const batteriesRef = ref(db(), "batteries");
        const newBatteryRef = push(batteriesRef);
        payload.id = newBatteryRef.key || undefined;
        payload.createdAt = Date.now();
        await set(newBatteryRef, payload);
      }

      setShowForm(false);
      resetForm();
    } catch (e: unknown) {
      setFormError(String((e as Error)?.message || "Failed to save battery"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (battery: BatteryRow) => {
    const raw = rawByKey[battery.dbKey] || ({} as RawBatteryRecord);
    setIsEditing(true);
    setEditId(String(raw.id ?? battery.id));
    setFormSize(String(raw.size ?? battery.size ?? ""));
    setFormSerial(String(raw.serial_no ?? battery.serialNumber ?? ""));
    setFormIssuedDate(toInputDate(raw.issued_date ?? null));
    setFormInstallDate(toInputDate(raw.install_date ?? null));
    setFormGeneratorId(String(raw.generator_id ?? battery.generatorId ?? ""));
    setFormShopId(String(raw.shop_id ?? ""));
    setFormIssueType((raw.issue_type === "Temporary" ? "Temporary" : "Fix") as "Fix" | "Temporary");
    setFormGatePass(String(raw.gate_pass ?? battery.gatePass ?? ""));
    
    // Set assignment type based on which field has a value
    if (raw.generator_id) {
      setFormAssignmentType("generator");
    } else if (raw.shop_id) {
      setFormAssignmentType("shop");
    } else {
      setFormAssignmentType("generator"); // default
    }
    
    setShowForm(true);
  };

  const handleDelete = async (battery: BatteryRow) => {
    const ok = window.confirm(`Delete battery ${battery.batteryId}? This action cannot be undone.`);
    if (!ok) return;
    try {
      await remove(ref(db(), `batteries/${battery.dbKey}`));
    } catch (e) {
      console.error(e);
      alert("Failed to delete battery");
    }
  };

  const handleViewBattery = (battery: BatteryRow) => {
    setViewBattery(battery);
    setShowViewModal(true);
  };

  const filteredBatteries = batteries.filter(battery => {
    const matchesSearch = battery.batteryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      battery.size.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || battery.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesShop = shopFilter === 'all' || battery.shopName === shopFilter;
    return matchesSearch && matchesType && matchesShop;
  });

  const metrics = useMemo(() => {
    const total = batteries.length;
    const fix = batteries.filter((b) => b.type === "Fix").length;
    const temporary = batteries.filter((b) => b.type === "Temporary").length;
    // Calculate overdue based on temporary batteries with gate pass older than 30 days
    const now = new Date();
    const overdue = batteries.filter(b => {
      if (b.type !== "Temporary" || !b.installDate) return false;
      const installDate = new Date(b.installDate.split('/').reverse().join('-'));
      const daysDiff = (now.getTime() - installDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff > 30;
    }).length;
    return { total, fix, temporary, overdue };
  }, [batteries]);

  const uniqueShops = Array.from(new Set(batteries.map(b => b.shopName).filter(Boolean)));

  return (
    <div className="flex-1 p-8 font-inter">
      {/* Header */}
      <header className="flex flex-nowrap items-center mb-4 sm:mb-6 justify-start sm:justify-between gap-2">
        <div className="min-w-0 sm:flex-1">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-600 truncate mb-1 sm:mb-2">Batteries</h1>
          <p className="text-gray-500 text-sm sm:text-base truncate">Manage battery inventory and assignments</p>
        </div>
        <button
          className="bg-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center shadow-md hover:bg-blue-600 flex-shrink-0 ml-2 sm:ml-0"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <MdAdd className="mr-1 sm:mr-2" />
          Add Battery
        </button>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Battery className="text-gray-700" size={24} />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Batteries</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-blue-500" size={24} />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fix</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.fix}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Clock className="text-yellow-500" size={24} />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Temporary</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.temporary}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <CalendarX className="text-red-500" size={24} />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Return Overdue</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white py-4 px-6 rounded-lg shadow-md mb-4 border border-blue-300">
        <p className="text-gray-500 mb-2">Filters</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search batteries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 border border-blue-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border bg-gray-100 rounded-lg w-full focus:outline-none focus:ring-2 border-blue-100 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="fix">Fix</option>
            <option value="temporary">Temporary</option>
          </select>

          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="p-2 border bg-gray-100 rounded-lg w-full focus:outline-none focus:ring-2 border-blue-100 focus:ring-blue-500"
          >
            <option value="all">All Shops</option>
            {uniqueShops.map(shop => (
              <option key={shop} value={shop}>{shop}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batteries Table */}
      <div className="bg-white px-4 py-4 rounded-lg shadow-md border border-blue-300 mb-4">
        <h3 className="text-md font-semibold mb-1">Battery List</h3>
        <p className="text-sm/9">{filteredBatteries.length} Batteries Found</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-50 border-b border-blue-100">
              <tr>
                {["Battery ID", "Size", "Serial Number", "Type", "Install Date", "Generator ID", "Shop", "Gate Pass", "Actions"].map((col, idx) => (
                  <th key={idx} className="px-4 py-2 text-sm font-semibold text-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBatteries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-gray-500">No batteries found.</td>
                </tr>
              ) : (
                filteredBatteries.map((battery, idx) => (
                  <tr key={idx} className="border-b border-blue-100 hover:bg-gray-50 py-2">
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.batteryId}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.size}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.serialNumber}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">
                      <span className={`px-2 py-1 rounded-md text-sm font-medium ${
                        battery.type === 'Fix' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {battery.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.installDate}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.generatorId}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.shopName}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{battery.gatePass || '-'}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewBattery(battery)} 
                          className="bg-green-100 p-2 rounded-md hover:bg-green-200" 
                          title="View"
                        >
                          <Eye className="text-green-600" size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(battery)} 
                          className="bg-blue-100 p-2 rounded-md hover:bg-blue-200" 
                          title="Edit"
                        >
                          <Pencil className="text-blue-500" size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(battery)} 
                          className="bg-red-100 p-2 rounded-md hover:bg-red-200" 
                          title="Delete"
                        >
                          <Trash2 className="text-red-600" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {isEditing ? "Edit Battery" : "Add Battery"}
            </h2>
            {formError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Size</label>
                <select
                  className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                >
                  <option value="">Select size</option>
                  <option value="NS 40">NS 40</option>
                  <option value="100Ah">100Ah</option>
                  <option value="120Ah">120Ah</option>
                  <option value="150Ah">150Ah</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Serial Number</label>
                <input
                  type="text"
                  placeholder="Enter serial number"
                  className="border rounded-md px-3 py-2 focus:ring bg-gray-100 border border-blue-100 focus:ring-blue-200"
                  value={formSerial}
                  onChange={(e) => setFormSerial(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Issue Type</label>
                <select
                  className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                  value={formIssueType}
                  onChange={(e) => setFormIssueType(e.target.value as "Fix" | "Temporary")}
                >
                  <option value="Fix">Fix</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Issued Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                  value={formIssuedDate}
                  onChange={(e) => setFormIssuedDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Install Date</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                  value={formInstallDate}
                  onChange={(e) => setFormInstallDate(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 font-medium text-gray-700">Assignment Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="generator"
                      checked={formAssignmentType === "generator"}
                      onChange={(e) => {
                        setFormAssignmentType("generator");
                        if (e.target.checked) {
                          setFormShopId(""); // Clear shop when selecting generator
                        }
                      }}
                    />
                    Assign to Generator
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="shop"
                      checked={formAssignmentType === "shop"}
                      onChange={(e) => {
                        setFormAssignmentType("shop");
                        if (e.target.checked) {
                          setFormGeneratorId(""); // Clear generator when selecting shop
                        }
                      }}
                    />
                    Assign to Shop
                  </label>
                </div>
              </div>

              {formAssignmentType === "generator" && (
                <div className="flex flex-col col-span-2">
                  <label className="mb-1 font-medium text-gray-700">Generator</label>
                  <select
                    className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    value={formGeneratorId}
                    onChange={(e) => setFormGeneratorId(e.target.value)}
                  >
                    <option value="">Select generator</option>
                    {Object.entries(generatorNameById).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formAssignmentType === "shop" && (
                <div className="flex flex-col col-span-2">
                  <label className="mb-1 font-medium text-gray-700">Assigned Shop</label>
                  <select
                    className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    value={formShopId}
                    onChange={(e) => setFormShopId(e.target.value)}
                  >
                    <option value="">Select shop</option>
                    {Object.entries(shopNameById).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formIssueType === "Temporary" && (
                <div className="flex flex-col col-span-2">
                  <label className="mb-1 font-medium text-gray-700">Gate Pass *</label>
                  <input
                    type="text"
                    placeholder="Enter gate pass number (required for temporary)"
                    className="border rounded-md px-3 py-2 focus:ring bg-gray-100 border border-blue-100 focus:ring-blue-200"
                    value={formGatePass}
                    onChange={(e) => setFormGatePass(e.target.value)}
                  />
                </div>
              )}
            </form>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700" 
                onClick={() => { resetForm(); setShowForm(false); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={handleCreate}
                disabled={submitting}
              >
                {isEditing ? (submitting ? "Saving..." : "Save Changes") : (submitting ? "Adding..." : "Add Battery")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewBattery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-brightness-75">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-0 overflow-hidden">
            <div className="bg-blue-600 px-8 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Battery Details</h2>
              <button
                type="button"
                className="text-white hover:text-gray-200 text-2xl font-bold"
                onClick={() => setShowViewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="px-8 py-6">
              <div className="flex items-center gap-4 mb-6">
                <Battery className="text-blue-600" size={40} />
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    {viewBattery.batteryId} - {viewBattery.size}
                  </div>
                  <div className="text-sm text-gray-500">Serial: {viewBattery.serialNumber}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="font-semibold text-gray-700">Type:</span>
                  <div className="text-gray-800">{viewBattery.type}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Install Date:</span>
                  <div className="text-gray-800">{viewBattery.installDate}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Issued Date:</span>
                  <div className="text-gray-800">{viewBattery.issuedDate}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Generator ID:</span>
                  <div className="text-gray-800">{viewBattery.generatorId}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Shop:</span>
                  <div className="text-gray-800">{viewBattery.shopName}</div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Gate Pass:</span>
                  <div className="text-gray-800">{viewBattery.gatePass || '-'}</div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}