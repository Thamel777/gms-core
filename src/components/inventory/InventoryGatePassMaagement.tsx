"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { db } from "../../firebaseConfig"; // adjust path
import { ref, onValue, set } from "firebase/database";

type Status = "Active" | "Returned" | "Overdue" | "Pending";

interface GatePassRecord {
  id: string;
  batteryId: string;
  issueDate: string; // yyyy-mm-dd
  status: Status;
}

interface GatePassData {
  batteryId: string;
  issueDate: string;
  status: Status;
}

interface InventoryGatePassManagementProps {
  onNavigate?: (page: string) => void;
}

export default function InventoryGatePassManagement({ onNavigate }: InventoryGatePassManagementProps) {
  const [records, setRecords] = useState<GatePassRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batteryId, setBatteryId] = useState("");
  const [issueDate, setIssueDate] = useState(""); 
  const [status, setStatus] = useState<Status>("Pending");

  // Load gate pass records from Firebase
  useEffect(() => {
    const gatePassRef = ref(db(), "gatepasses");
    return onValue(gatePassRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: GatePassRecord[] = Object.entries(data).map(([key, value]: [string, unknown]) => {
          const passData = value as GatePassData;
          return {
            id: key,
            batteryId: passData.batteryId,
            issueDate: passData.issueDate,
            status: passData.status,
          };
        });
        setRecords(list);
      } else {
        setRecords([]);
      }
    });
  }, []);

  const generateNextId = () => {
    let max = 0;
    for (const r of records) {
      const m = r.id.match(/GP-\d{4}-(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return `GP-2024-${String(max + 1).padStart(3, "0")}`;
  };

  const handleAddRecord = () => {
    if (!batteryId.trim() || !issueDate.trim()) {
      alert("Please fill Battery ID and Issue Date.");
      return;
    }

    const id = generateNextId();
    const newRecord: GatePassRecord = { id, batteryId, issueDate, status };

    const newRef = ref(db(), `gatepasses/${id}`);
    set(newRef, newRecord);

    setBatteryId("");
    setIssueDate("");
    setStatus("Pending");
    setIsModalOpen(false);
  };

  const handleToggleComplete = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;

    const newStatus = record.status === "Returned" ? "Pending" : "Returned";
    const recordRef = ref(db(), `gatepasses/${id}/status`);
    set(recordRef, newStatus);
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return isNaN(d.getTime()) ? isoDate : d.toLocaleDateString("en-GB");
  };

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !(r.id.toLowerCase().includes(q) || r.batteryId.toLowerCase().includes(q))) {
      return false;
    }
    if (statusFilter !== "All Status" && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Gate Pass Management</h1>
          <p className="text-gray-600 text-lg">Create, track, and manage equipment gate passes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
        >
          + Create Gate Pass
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <p className="text-gray-500">Pending Tasks</p>
          <h2 className="text-2xl font-bold">{records.filter((r) => r.status === "Pending").length}</h2>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <p className="text-gray-500">Completed</p>
          <h2 className="text-2xl font-bold">{records.filter((r) => r.status === "Returned").length}</h2>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <p className="text-gray-500">Overdue</p>
          <h2 className="text-2xl font-bold">{records.filter((r) => r.status === "Overdue").length}</h2>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <p className="text-gray-500">Due Today</p>
          <h2 className="text-2xl font-bold">0</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search gate pass..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md bg-gray-100 border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Returned</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg p-4 border border-blue-300">
        <h3 className="text-lg font-semibold mb-4">Gate Pass Records</h3>
        <table className="w-full border border-blue-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-50 text-left">
              <th className="p-3">Pass ID</th>
              <th className="p-3">Battery ID</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr key={record.id} className="hover:bg-blue-50 border-t border-blue-300">
                <td className="p-3">{record.id}</td>
                <td className="p-3">{record.batteryId}</td>
                <td className="p-3">{formatDate(record.issueDate)}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm ${
                      record.status === "Active"
                        ? "bg-black"
                        : record.status === "Returned"
                        ? "bg-gray-500"
                        : record.status === "Overdue"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {record.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  {record.status === "Returned" ? (
                    <button
                      onClick={() => handleToggleComplete(record.id)}
                      className="px-4 py-1 rounded bg-yellow-300 text-sm hover:bg-yellow-400"
                    >
                      Reopen
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleComplete(record.id)}
                      className="px-4 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative border border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-blue-600 mb-4">Create Gate Pass</h2>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-600">Battery ID</span>
                <input
                  type="text"
                  placeholder="BAT-2025-001"
                  value={batteryId}
                  onChange={(e) => setBatteryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Issue Date</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Returned">Returned</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleAddRecord}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Gate Pass
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
