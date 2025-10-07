"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref, push, set, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

import { MdAdd, MdOutlineRemoveRedEye, MdEditSquare, MdSearch, MdDelete } from "react-icons/md";

const statusColors: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

interface Generators {
  onNavigate: (page: string) => void;
  onSelectGenerator?: (id: string) => void;
}

export default function Generators({ onNavigate, onSelectGenerator }: Generators) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<"Active" | "Under Repair" | "Unusable">("Active");
  const [formParts, setFormParts] = useState<string[]>([]);
  const [newPart, setNewPart] = useState("");

  // Add Generator form state
  const [formBrand, setFormBrand] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formInstalledDate, setFormInstalledDate] = useState("");
  const [formIssuedDate, setFormIssuedDate] = useState("");
  const [formShopId, setFormShopId] = useState("");
  const [formLocation, setFormLocation] = useState<"Up" | "Down">("Up");
  const [formAutoStart, setFormAutoStart] = useState(false);
  const [formBatteryCharger, setFormBatteryCharger] = useState(false);
  // Warranty expiry date (yyyy-mm-dd)
  const [formWarrantyExpire, setFormWarrantyExpire] = useState("");

  type RawGeneratorRecord = {
    id?: string;
    brand?: string;
    size?: string;
    serial_no?: string;
    issued_date?: number | string | null;
    installed_date?: number | string | null;
    status?: string;
    shop_id?: string;
    location?: string;
    hasAutoStart?: number | boolean;
    hasBatteryCharger?: number | boolean;
    warranty?: number | string | null;
    extracted_parts?: unknown[];
    createdAt?: number;
    updatedAt?: number;
  };

  type GenRow = {
    id: string;
    brand: string;
    size: string;
    sn: string;
    date: string;
    status: string;
    statusColor: "green" | "yellow" | "red";
    location: string;
    shop: string;
    dbKey: string;
  };

  const [generators, setGenerators] = useState<GenRow[]>([]);
  const [shopNameById, setShopNameById] = useState<Record<string, string>>({});
  const [rawByKey, setRawByKey] = useState<Record<string, RawGeneratorRecord>>({});

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormError(null);
    setFormBrand("");
    setFormSize("");
    setFormSerial("");
    setFormInstalledDate("");
    setFormIssuedDate("");
    setFormShopId("");
    setFormLocation("Up");
    setFormAutoStart(false);
    setFormBatteryCharger(false);
    setFormWarrantyExpire("");
    setFormStatus("Active");
    setFormParts([]);
    setNewPart("");
  };

  const toTitle = (s?: string | null) => {
    const v = String(s ?? "").trim();
    if (!v) return "";
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  };

  const normalizeStatus = (s?: string) => {
    const v = String(s ?? "").toLowerCase().replace(/_/g, " ");
    if (v.includes("unusable")) return "Unusable";
    if (v.includes("under") || v.includes("repair")) return "Under Repair";
    return "Active";
  };

  const statusColorFor = (status: string): "green" | "yellow" | "red" => {
    const v = status.toLowerCase();
    if (v.includes("unusable")) return "red";
    if (v.includes("under") || v.includes("repair")) return "yellow";
    return "green";
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

  // Load shops data - Enhanced version similar to batteries
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

  useEffect(() => {
    const unsub = onValue(ref(db(), "generators"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, RawGeneratorRecord>;
      setRawByKey(value);
      const items: GenRow[] = Object.entries(value).map(([key, data]) => {
        const id = String(data.id ?? key);
        const brand = String(data.brand ?? "");
        const size = String(data.size ?? "");
        const sn = String((data as RawGeneratorRecord & { serialNumber?: string }).serialNumber ?? data.serial_no ?? "");
        const date = formatDate(data.installed_date ?? null);
        const status = normalizeStatus(data.status);
        const statusColor = statusColorFor(status);
        const locRaw = String(data.location ?? "");
        const location = locRaw ? toTitle(locRaw) : "";
        const shop = data.shop_id ? (shopNameById[data.shop_id] ?? data.shop_id) : "";
        return { id, brand, size, sn, date, status, statusColor, location, shop, dbKey: key };
      });
      items.sort((a, b) => a.id.localeCompare(b.id));
      setGenerators(items);
    });
    return () => unsub();
  }, [shopNameById]);

  const parseDateOrNull = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    const t = d.getTime();
    return isNaN(t) ? null : t;
  };

  const monthsBetween = (fromISO: string, toISO: string): number | null => {
    if (!fromISO || !toISO) return null;
    const from = new Date(fromISO);
    const to = new Date(toISO);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    // Adjust for day-of-month if target day is before start day
    if (to.getDate() < from.getDate()) {
      months -= 1;
    }
    return months < 0 ? 0 : months;
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!formBrand || !formSerial || !formShopId) {
      setFormError("Brand, Serial Number and Assigned Shop are required.");
      return;
    }
    try {
      setSubmitting(true);
      const warrantyMonths = formInstalledDate && formWarrantyExpire
        ? monthsBetween(formInstalledDate, formWarrantyExpire)
        : null;

      const payload: {
        brand: string;
        size: string | null;
        serial_no: string;
        issued_date: number | null;
        installed_date: number | null;
        shop_id: string;
        location: string;
        hasAutoStart: boolean;
        hasBatteryCharger: boolean;
        warranty: number | null;
        extracted_parts: string[];
        status: string;
        id?: string;
        createdAt?: number;
        updatedAt: number;
      } = {
        brand: formBrand,
        size: formSize || null,
        serial_no: formSerial,
        issued_date: parseDateOrNull(formIssuedDate),
        installed_date: parseDateOrNull(formInstalledDate),
        shop_id: formShopId,
        location: formLocation,
        hasAutoStart: formAutoStart,
        hasBatteryCharger: formBatteryCharger,
        warranty: warrantyMonths,
        extracted_parts: isEditing && formStatus === "Unusable" ? formParts : [],
        status: isEditing ? formStatus : "Active",
        updatedAt: Date.now(),
      };

      if (isEditing && editId) {
        payload.id = editId;
        await update(ref(db(), `generators/${editId}`), payload);
      } else {
        const generatorsRef = ref(db(), "generators");
        const newGeneratorRef = push(generatorsRef);
        payload.id = newGeneratorRef.key || undefined;
        payload.createdAt = Date.now();
        await set(newGeneratorRef, payload);
      }

      setShowForm(false);
      resetForm();
    } catch (e: unknown) {
      setFormError(String((e as Error)?.message || "Failed to create generator"));
    } finally {
      setSubmitting(false);
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

  const computeWarrantyExpireFromMonths = (installed?: number | string | null, months?: number | string | null): string => {
    if (!installed || months == null) return "";
    const base = typeof installed === 'number' ? new Date(installed) : new Date(String(installed));
    const m = Number(months);
    if (isNaN(base.getTime()) || !m) return "";
    const dt = new Date(base);
    dt.setMonth(dt.getMonth() + m);
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  };

  const handleOpenEdit = (gen: GenRow) => {
    const raw = rawByKey[gen.dbKey] || ({} as RawGeneratorRecord);
    setIsEditing(true);
    setEditId(String(raw.id ?? gen.id));
    setFormBrand(String(raw.brand ?? gen.brand ?? ""));
    setFormSize(String(raw.size ?? gen.size ?? ""));
    setFormSerial(String((raw as RawGeneratorRecord & { serialNumber?: string }).serialNumber ?? raw.serial_no ?? gen.sn ?? ""));
    setFormInstalledDate(toInputDate(raw.installed_date ?? null));
    setFormIssuedDate(toInputDate(raw.issued_date ?? null));
    setFormShopId(String(raw.shop_id ?? ""));
    setFormLocation((String(raw.location ?? gen.location ?? "Up").toLowerCase() === 'down' ? 'Down' : 'Up') as 'Up' | 'Down');
    setFormAutoStart(Boolean(raw.hasAutoStart));
    setFormBatteryCharger(Boolean(raw.hasBatteryCharger));
    setFormWarrantyExpire(computeWarrantyExpireFromMonths(raw.installed_date ?? null, raw.warranty ?? null));
    setFormStatus(normalizeStatus(raw.status) as "Active" | "Under Repair" | "Unusable");
    setFormParts(Array.isArray(raw.extracted_parts) ? (raw.extracted_parts as unknown[]).map(String) : []);
    setShowForm(true);
  };

  const handleDelete = async (gen: GenRow) => {
    const ok = window.confirm(`Delete generator ${gen.id}? This action cannot be undone.`);
    if (!ok) return;
    try {
      await remove(ref(db(), `generators/${gen.dbKey}`));
    } catch (e) {
      console.error(e);
      alert("Failed to delete generator");
    }
  };

  // Filter logic
  const filteredGenerators = generators.filter((gen) => {
    const matchesSearch =
      gen.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gen.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gen.sn.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || gen.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesBrand = brandFilter === "all" || gen.brand === brandFilter;
    const matchesLocation = locationFilter === "all" || gen.location === locationFilter;
    const matchesShop = shopFilter === "all" || gen.shop === shopFilter;

    return matchesSearch && matchesStatus && matchesBrand && matchesLocation && matchesShop;
  });

  const metrics = useMemo(() => {
    const total = generators.length;
    const active = generators.filter((g) => g.status.toLowerCase() === "active").length;
    const underRepair = generators.filter((g) => g.status.toLowerCase().includes("repair")).length;
    const unusable = generators.filter((g) => g.status.toLowerCase().includes("unusable")).length;
    return { total, active, underRepair, unusable };
  }, [generators]);

  // Get unique values for filters from database
  const uniqueBrands = Array.from(new Set(generators.map(g => g.brand).filter(Boolean)));
  const uniqueShops = Array.from(new Set(generators.map(g => g.shop).filter(Boolean)));

  return (
    <div className="flex font-inter min-h-screen">
      {/* Main content */}
      <main className="flex-1 p-8">
        <header className="flex flex-nowrap items-center mb-4 sm:mb-6 justify-start sm:justify-between gap-2">
          <div className="min-w-0 sm:flex-1">
            <h1 className="text-2xl sm:text-4xl font-bold text-blue-600 truncate mb-1 sm:mb-2">Generators</h1>
            <p className="text-gray-500 text-sm sm:text-base truncate">Manage all your generators across your centers</p>
          </div>
          <button
            className="bg-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center shadow-md hover:bg-blue-600 flex-shrink-0 ml-2 sm:ml-0"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <MdAdd className="mr-1 sm:mr-2" />
            Add Generator
          </button>
        </header>

        {/* Metrics cards */}
        {/* Metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Generators</h3>
                <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <p className="text-3xl font-bold text-gray-900">{metrics.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Under Repair</h3>
                <p className="text-3xl font-bold text-gray-900">{metrics.underRepair}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Unusable</h3>
                <p className="text-3xl font-bold text-gray-900">{metrics.unusable}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-white py-4 px-6 rounded-lg shadow-md mb-4 border border-blue-300">
          <p className="text-gray-500 mb-2">Filters</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <MdSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search generators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border border-blue-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border bg-gray-100 rounded-lg w-full focus:outline-none focus:ring-2 border-blue-100 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="under repair">Under Repair</option>
              <option value="unusable">Unusable</option>
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="p-2 border bg-gray-100 rounded-lg w-full focus:outline-none focus:ring-2 border-blue-100 focus:ring-blue-500"
            >
              <option value="all">All Brands</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="p-2 border bg-gray-100 rounded-lg w-full focus:outline-none focus:ring-2 border-blue-100 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="Up">Up</option>
              <option value="Down">Down</option>
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

        {/* Table */}
        <div className="bg-white px-4 py-4 rounded-lg shadow-md border border-blue-300 mb-4">
          <h3 className="text-md font-semibold mb-1">Generator List</h3>
          <p className="text-sm/9">{filteredGenerators.length} Generators Found</p>

          <div className="mt-4">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 border-b border-blue-100">
                <tr>
                  {["Generator ID", "Brand", "Size", "Serial Number", "Installed Date", "Status", "Location", "Shop", "Actions"].map((col, idx) => (
                    <th key={idx} className="px-4 py-2 text-sm font-semibold text-gray-600">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGenerators.map((gen, idx) => (
                  <tr key={idx} className="border-b border-blue-100 hover:bg-gray-50 py-2">
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.id}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.brand}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.size}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.sn}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.date}</td>
                    <td className="px-1">
                      <span className={`${statusColors[gen.statusColor]} px-2 py-1 rounded-md text-sm font-medium w-16`}>{gen.status}</span>
                    </td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.location}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">{gen.shop}</td>
                    <td className="px-4 py-2 text-sm/9 leading-1 text-gray-800">
                      <div className="flex items-center">
                        <button onClick={() => { onSelectGenerator?.(gen.dbKey || gen.id); router.push(`/generators/${encodeURIComponent(gen.id)}`); onNavigate("GeneratorDetails"); }} className="bg-blue-100 p-2 rounded-md mr-2 hover:bg-blue-200" title="View">
                          <MdOutlineRemoveRedEye className="text-blue-500" />
                        </button>
                        <button onClick={() => handleOpenEdit(gen)} className="bg-blue-100 p-2 rounded-md mr-2 hover:bg-blue-200" title="Edit">
                          <MdEditSquare className="text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete(gen)} className="bg-red-100 p-2 rounded-md hover:bg-red-200" title="Delete">
                          <MdDelete className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40">
            <div data-cy="add-generator-modal" className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
              {/* Title */}
              <h2 className="text-lg font-semibold mb-4 text-gray-800">{isEditing ? "Edit Generator" : "Add Generator"}</h2>
              {formError && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Form Grid */}
              <form className="grid grid-cols-2 gap-4 text-sm">
                {isEditing && (
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-gray-700">Update Status</label>
                    <select
                      className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as "Active" | "Under Repair" | "Unusable")}
                    >
                      <option value="Active">Active</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Unusable">Unusable</option>
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Generator Brand</label>
                  <select
                    className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                  >
                    <option value="">Select brand</option>
                    <option value="Caterpillar">Caterpillar</option>
                    <option value="Honda">Honda</option>
                    <option value="Kohler">Kohler</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Size</label>
                  <select
                    className="border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                  >
                    <option value="">Select size</option>
                    <option value="15kW">15kW</option>
                    <option value="25kW">25kW</option>
                    <option value="50kW">50kW</option>
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
                  <label className="mb-1 font-medium text-gray-700">Warranty Expire Date</label>
                  <input
                    type="date"
                    className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    value={formWarrantyExpire}
                    onChange={(e) => setFormWarrantyExpire(e.target.value)}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Installed Date</label>
                  <input
                    type="date"
                    className="border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 bg-gray-100 border border-blue-100"
                    value={formInstalledDate}
                    onChange={(e) => setFormInstalledDate(e.target.value)}
                  />
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

                <div className="col-span-2">
                  <label className="mb-1 font-medium text-gray-700">Location</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="location"
                        value="Up"
                        checked={formLocation === "Up"}
                        onChange={() => setFormLocation("Up")}
                      />
                      Up
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="location"
                        value="Down"
                        checked={formLocation === "Down"}
                        onChange={() => setFormLocation("Down")}
                      />
                      Down
                    </label>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-700">Auto Start</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={formAutoStart}
                    onChange={(e) => setFormAutoStart(e.target.checked)}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-700">Battery Charger Installed?</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={formBatteryCharger}
                    onChange={(e) => setFormBatteryCharger(e.target.checked)}
                  />
                </div>
              </form>

              {formStatus === "Unusable" && (
                <div className="mt-4">
                  <label className="mb-1 font-medium text-gray-700">Extracted Parts</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPart}
                      onChange={(e) => setNewPart(e.target.value)}
                      placeholder="Add part name"
                      className="flex-1 border rounded-md px-3 py-2 bg-gray-100 border border-blue-100 focus:ring focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => { const v = newPart.trim(); if (v) { setFormParts([...formParts, v]); setNewPart(""); } }}
                    >
                      Add
                    </button>
                  </div>
                  {formParts.length === 0 ? (
                    <p className="text-sm text-gray-500">No extracted parts added.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                      {formParts.map((p, idx) => (
                        <li key={`${p}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="text-gray-800">{p}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setFormParts(formParts.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Buttons */}
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
                  {isEditing ? (submitting ? "Saving..." : "Save Changes") : (submitting ? "Adding..." : "Add Generator")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}