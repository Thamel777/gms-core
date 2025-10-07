'use client';

import { useState, useMemo, useEffect } from "react";
import { onValue, ref, push, set, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";
import { MdSearch } from 'react-icons/md';

interface BatteryManagementProps {
  onNavigate?: (page: string) => void;
}

// Firebase battery record structure
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

// UI battery object structure
interface Battery {
  id: string;
  batteryId: string;
  type: string;
  serialNumber: string;
  assignedDate: string;
  status: string;
  location: string;
  shop: string;
  brand: string;
  dbKey: string; 
}

export default function InventoryBatteryManagement({ onNavigate }: BatteryManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [shopFilter, setShopFilter] = useState("All Shops");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBattery, setViewBattery] = useState<Battery | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedBattery, setEditedBattery] = useState<Battery | null>(null);

  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [shopNameById, setShopNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // State for the "Add Battery" form inputs
  const [newBattery, setNewBattery] = useState({
    size: "",
    serialNumber: "",
    assignedDate: "",
    status: "In Stock",
    location: "Up",
    shop: "",
    issueType: "Fix" as "Fix" | "Temporary",
    installDate: "",
    generatorId: "",
    gatePass: "",
  });

  // Helper function to format date
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

  // Derive status from Firebase data
  const deriveStatus = (data: RawBatteryRecord): string => {
    if (data.issue_type === "Temporary") {
      // Check if temporary battery is overdue (more than 30 days)
      if (data.install_date) {
        const installDate = new Date(typeof data.install_date === 'number' ? data.install_date : String(data.install_date));
        const daysDiff = (Date.now() - installDate.getTime()) / (1000 * 3600 * 24);
        if (daysDiff > 30) return "Overdue";
      }
      return "Final Assignment";
    }
    
    if (data.generator_id) return "Active";
    return "In Stock";
  };

  // Load shops data for lookup
  useEffect(() => {
    const unsub = onValue(ref(db(), "shops"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, { 
        name?: string; 
        code?: string; 
        city?: string;
        district?: string;
      }>;
      const map: Record<string, string> = {};
      Object.entries(value).forEach(([id, data]) => {
        const displayName = data.name || data.code || id;
        const location = data.city || data.district;
        map[id] = location ? `${displayName} (${location})` : displayName;
      });
      setShopNameById(map);
    });
    return () => unsub();
  }, []);

  // Load batteries data from Firebase
  useEffect(() => {
    const unsub = onValue(ref(db(), "batteries"), (snap) => {
      const value = (snap.val() ?? {}) as Record<string, RawBatteryRecord>;
      const items: Battery[] = Object.entries(value).map(([key, data]) => {
        const id = String(data.id ?? key);
        const batteryId = `B${String(data.id ?? key).padStart(3, '0')}`;
        const type = data.size ?? "Unknown";
        const serialNumber = String(data.serial_no ?? "");
        const assignedDate = formatDate(data.install_date ?? data.issued_date ?? null);
        const status = deriveStatus(data);
        const location = data.generator_id ? "With Gen" : "In Stock";
        const shop = data.shop_id ? (shopNameById[data.shop_id] ?? data.shop_id) : "";
        const brand = data.issue_type || "Fix"; // Using issue_type as brand for compatibility
        
        return { 
          id, 
          batteryId, 
          type, 
          serialNumber, 
          assignedDate, 
          status, 
          location, 
          shop, 
          brand,
          dbKey: key 
        };
      });
      items.sort((a, b) => a.id.localeCompare(b.id));
      setBatteries(items);
      setLoading(false);
    });
    return () => unsub();
  }, [shopNameById]);

  const filteredBatteries = useMemo(() => {
    if (loading) return [];
    return batteries.filter(battery => {
      const matchesSearch = battery.batteryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          battery.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All Status" || battery.status === statusFilter;
      const matchesBrand = brandFilter === "All Brands" || battery.type === brandFilter;
      const matchesLocation = locationFilter === "All Locations" || battery.location === locationFilter;
      const matchesShop = shopFilter === "All Shops" || battery.shop === shopFilter;

      return matchesSearch && matchesStatus && matchesBrand && matchesLocation && matchesShop;
    });
  }, [searchTerm, statusFilter, brandFilter, locationFilter, shopFilter, batteries, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "In Stock":
        return "bg-gray-200 text-gray-800";
      case "Final Assignment":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Under Repair":
        return "bg-yellow-200 text-yellow-800";
      case "Unusable":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddBattery = () => {
    setFormError(null);
    setNewBattery({
      size: "",
      serialNumber: "",
      assignedDate: "",
      status: "In Stock",
      location: "Up",
      shop: "",
      issueType: "Fix",
      installDate: "",
      generatorId: "",
      gatePass: "",
    });
    setShowAddModal(true);
  };

  const handleViewBattery = (battery: Battery) => {
    setViewBattery(battery);
    setShowViewModal(true);
  };

  const handleEditBattery = (battery: Battery) => {
    setEditedBattery(battery);
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setViewBattery(null);
    setEditedBattery(null);
    setFormError(null);
  };

  const handleAddFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newBattery.size || !newBattery.serialNumber) {
      setFormError("Size and Serial Number are required.");
      return;
    }

    try {
      setSubmitting(true);
      const batteryRef = push(ref(db(), "batteries"));
      
      const parseDateOrNull = (iso: string): number | null => {
        if (!iso) return null;
        const d = new Date(iso);
        const t = d.getTime();
        return isNaN(t) ? null : t;
      };

      const payload = {
        size: newBattery.size,
        serial_no: newBattery.serialNumber,
        issue_type: newBattery.issueType,
        issued_date: parseDateOrNull(newBattery.assignedDate),
        install_date: parseDateOrNull(newBattery.installDate),
        generator_id: newBattery.generatorId || null,
        shop_id: newBattery.shop || null,
        gate_pass: newBattery.gatePass || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(batteryRef, payload);
      closeModal();
    } catch (error) {
      console.error("Error adding battery:", error);
      setFormError("Failed to add battery. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBattery = async (battery: Battery) => {
    const confirmed = window.confirm(`Delete battery ${battery.batteryId}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await remove(ref(db(), `batteries/${battery.dbKey}`));
    } catch (error) {
      console.error("Error deleting battery:", error);
      alert("Failed to delete battery. Please try again.");
    }
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedBattery) return;

    try {
      setSubmitting(true);
      const updates = {
        size: editedBattery.type,
        serial_no: editedBattery.serialNumber,
        issue_type: editedBattery.brand, // Using brand field as issue_type
        updatedAt: Date.now(),
      };

      await update(ref(db(), `batteries/${editedBattery.dbKey}`), updates);
      closeModal();
    } catch (error) {
      console.error("Error updating battery:", error);
      setFormError("Failed to update battery. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueShops = Array.from(new Set(batteries.map(b => b.shop).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading batteries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <>
        <div className={`flex-1 p-8 bg-gray-50 min-h-screen ${showAddModal || showViewModal || showEditModal ? 'blur-sm' : ''}`}>
          {/* Header and Add Button */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Battery Management</h1>
              <p className="text-gray-600 text-lg">Manage battery inventory, assignments, and tracking</p>
            </div>
            <button
                onClick={handleAddBattery}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Battery
            </button>
          </div>

          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="flex justify-between items-center w-full mb-1">
                <h3 className="text-sm font-medium text-gray-500">Total Batteries</h3>
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
              <p className="text-4xl font-bold text-gray-800">{batteries.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="flex justify-between items-center w-full mb-1">
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p className="text-4xl font-bold text-gray-800">{batteries.filter(b => b.status === 'Active').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="flex justify-between items-center w-full mb-1">
                <h3 className="text-sm font-medium text-gray-500">Under Repair</h3>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              </div>
              <p className="text-4xl font-bold text-gray-800">{batteries.filter(b => b.status === 'Under Repair').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 w-full max-w-xs sm:max-w-sm md:max-w-md">
              <div className="flex justify-between items-center w-full mb-1">
                <h3 className="text-sm font-medium text-gray-500">Unusable</h3>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
              <p className="text-4xl font-bold text-gray-800">{batteries.filter(b => b.status === 'Unusable').length}</p>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-blue-200">
            <p className="text-sm font-semibold text-gray-700 mb-4">Filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search batteries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>All Status</option>
                <option>Active</option>
                <option>In Stock</option>
                <option>Final Assignment</option>
                <option>Overdue</option>
                <option>Under Repair</option>
                <option>Unusable</option>
              </select>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>All Brands</option>
                <option>NS 40</option>
                <option>100Ah</option>
                <option>120Ah</option>
                <option>150Ah</option>
              </select>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>All Locations</option>
                <option>With Gen</option>
                <option>In Stock</option>
              </select>
              <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>All Shops</option>
                {uniqueShops.map(shop => (
                  <option key={shop} value={shop}>{shop}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Battery Inventory Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ">
            <div className="p-4 border-b border-gray-200 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800">Battery Inventory ({filteredBatteries.length} items)</h3>
            </div>
            <div className="overflow-x-auto border border-blue-200 ">
              <table className="min-w-full divide-y divide-gray-200 ">
                <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battery ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatteries.length > 0 ? (
                    filteredBatteries.map((battery) => (
                        <tr key={battery.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{battery.batteryId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battery.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battery.serialNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battery.assignedDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(battery.status)}`}>
                          {battery.status}
                        </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battery.location}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battery.shop}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <button onClick={() => handleViewBattery(battery)} className="text-blue-600 hover:text-blue-900 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.575 3.01 9.963 7.172.01.037.01.074 0 .111a.75.75 0 01-1.35.639C19.577 16.49 15.64 19.5 12 19.5c-4.638 0-8.575-3.01-9.963-7.172zM12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
                            </button>
                            <button onClick={() => handleEditBattery(battery)} className="text-gray-400 hover:text-gray-600 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.498L18.42 6.056l-6.857 6.857-1.558 1.558-1.558-1.558L10.27 11.19a.75.75 0 011.06 1.06L11.558 13.5zM12 4.5l-6.857 6.857-1.558 1.558-1.558-1.558z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteBattery(battery)} className="text-red-600 hover:text-red-900">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">No batteries match your search or filter criteria.</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Battery Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-0 overflow-hidden">
                <div className="bg-blue-600 px-8 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Battery</h2>
                  <button type="button" className="text-white hover:text-gray-200 text-2xl font-bold" onClick={closeModal}>&times;</button>
                </div>
                <form onSubmit={handleAddFormSubmit} className="px-8 py-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="size" className="font-semibold text-gray-700">Size:</label>
                      <select
                          id="size"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={newBattery.size}
                          onChange={(e) => setNewBattery({...newBattery, size: e.target.value})}
                      >
                        <option value="">Select size</option>
                        <option value="NS 40">NS 40</option>
                        <option value="100Ah">100Ah</option>
                        <option value="120Ah">120Ah</option>
                        <option value="150Ah">150Ah</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="issueType" className="font-semibold text-gray-700">Issue Type:</label>
                      <select
                          id="issueType"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={newBattery.issueType}
                          onChange={(e) => setNewBattery({...newBattery, issueType: e.target.value as "Fix" | "Temporary"})}
                      >
                        <option value="Fix">Fix</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="serialNumber" className="font-semibold text-gray-700">Serial Number:</label>
                      <input
                          type="text"
                          id="serialNumber"
                          placeholder="Serial Number"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={newBattery.serialNumber}
                          onChange={(e) => setNewBattery({...newBattery, serialNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label htmlFor="assignedDate" className="font-semibold text-gray-700">Assigned Date:</label>
                      <input
                          type="date"
                          id="assignedDate"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={newBattery.assignedDate}
                          onChange={(e) => setNewBattery({...newBattery, assignedDate: e.target.value})}
                      />
                    </div>
                  </div>
                  {formError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {formError}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-6">
                    <button 
                      type="button" 
                      className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50" 
                      onClick={closeModal}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? "Adding..." : "Add Battery"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* View Modal */}
        {showViewModal && viewBattery && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-0 overflow-hidden">
                <div className="bg-blue-600 px-8 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Battery Details</h2>
                  <button type="button" className="text-white hover:text-gray-200 text-2xl font-bold" onClick={closeModal}>&times;</button>
                </div>
                <div className="px-8 py-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="font-semibold text-gray-700">Battery ID:</div>
                      <div className="mt-1">{viewBattery.batteryId}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Type:</div>
                      <div className="mt-1">{viewBattery.type}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Serial Number:</div>
                      <div className="mt-1">{viewBattery.serialNumber}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Assigned Date:</div>
                      <div className="mt-1">{viewBattery.assignedDate}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Status:</div>
                      <div className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(viewBattery.status)}`}>
                        {viewBattery.status}
                      </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Location:</div>
                      <div className="mt-1">{viewBattery.location}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Shop:</div>
                      <div className="mt-1">{viewBattery.shop}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={closeModal}>Close</button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Edit Battery Modal */}
        {showEditModal && editedBattery && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-0 overflow-hidden">
                <div className="bg-blue-600 px-8 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Edit Battery</h2>
                  <button type="button" className="text-white hover:text-gray-200 text-2xl font-bold" onClick={closeModal}>&times;</button>
                </div>
                <form onSubmit={handleEditFormSubmit} className="px-8 py-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="editSize" className="font-semibold text-gray-700">Size:</label>
                      <select
                          id="editSize"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={editedBattery.type}
                          onChange={(e) => setEditedBattery({...editedBattery, type: e.target.value})}
                      >
                        <option value="NS 40">NS 40</option>
                        <option value="100Ah">100Ah</option>
                        <option value="120Ah">120Ah</option>
                        <option value="150Ah">150Ah</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="editIssueType" className="font-semibold text-gray-700">Issue Type:</label>
                      <select
                          id="editIssueType"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={editedBattery.brand}
                          onChange={(e) => setEditedBattery({...editedBattery, brand: e.target.value})}
                      >
                        <option value="Fix">Fix</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="editSerialNumber" className="font-semibold text-gray-700">Serial Number:</label>
                      <input
                          type="text"
                          id="editSerialNumber"
                          placeholder="Serial Number"
                          className="border px-3 py-2 rounded w-full mt-1"
                          value={editedBattery.serialNumber}
                          onChange={(e) => setEditedBattery({...editedBattery, serialNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  {formError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {formError}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-6">
                    <button 
                      type="button" 
                      className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50" 
                      onClick={closeModal}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </>
  );
}