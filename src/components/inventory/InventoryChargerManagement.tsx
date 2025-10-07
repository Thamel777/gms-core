"use client";
import { useState, useEffect } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { X } from "lucide-react";
import { db } from "../../firebaseConfig"; // adjust path
import { ref, onValue, set, remove } from "firebase/database";

interface Charger {
  id: string;
  model: string;
  lastMaintenance: string;
  location: string;
  assignmentStatus: "Assigned" | "Available" | "Maintenance";
  conditionStatus: "Good" | "Excellent" | "Fair" | "Needs Repair";
}

interface ChargerData {
  model: string;
  lastMaintenance: string;
  location: string;
  assignmentStatus: "Assigned" | "Available" | "Maintenance";
  conditionStatus: "Good" | "Excellent" | "Fair" | "Needs Repair";
}

interface InventoryChargerManagementProps {
  onNavigate?: (page: string) => void;
}

export default function InventoryChargerManagement({ onNavigate }: InventoryChargerManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterAssignee, setFilterAssignee] = useState("All Assignees");
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [editingChargerId, setEditingChargerId] = useState<string | null>(null);

  // Form fields
  const [chargerId, setChargerId] = useState("");
  const [model, setModel] = useState("");
  const [lastMaintenance, setLastMaintenance] = useState("");
  const [location, setLocation] = useState("");
  const [assignmentStatus, setAssignmentStatus] =
    useState<Charger["assignmentStatus"]>("Available");
  const [conditionStatus, setConditionStatus] =
    useState<Charger["conditionStatus"]>("Good");

  // Load chargers from Firebase
  useEffect(() => {
    const chargersRef = ref(db(), "chargers");
    return onValue(chargersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: Charger[] = Object.entries(data).map(([key, value]: [string, unknown]) => {
          const chargerData = value as ChargerData;
          return {
            id: key,
            model: chargerData.model,
            lastMaintenance: chargerData.lastMaintenance,
            location: chargerData.location,
            assignmentStatus: chargerData.assignmentStatus,
            conditionStatus: chargerData.conditionStatus,
          };
        });
        setChargers(list);
      } else {
        setChargers([]);
      }
    });
  }, []);

  // Generate next Charger ID
  const generateNextId = () => {
    let max = 0;
    chargers.forEach((c) => {
      const match = c.id.match(/CH-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return `CH-2024-${String(max + 1).padStart(3, "0")}`;
  };

  // Open modal for Add or Edit
  const handleOpenModal = (charger?: Charger) => {
    if (charger) {
      setEditingChargerId(charger.id);
      setChargerId(charger.id);
      setModel(charger.model);
      setLastMaintenance(charger.lastMaintenance);
      setLocation(charger.location);
      setAssignmentStatus(charger.assignmentStatus);
      setConditionStatus(charger.conditionStatus);
    } else {
      setEditingChargerId(null);
      setChargerId("");
      setModel("");
      setLastMaintenance("");
      setLocation("");
      setAssignmentStatus("Available");
      setConditionStatus("Good");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Add or Update charger
  const handleSaveCharger = () => {
    if (!model.trim() || !lastMaintenance.trim() || !location.trim()) {
      alert("Please fill all fields");
      return;
    }

    const id = chargerId || generateNextId();
    const newCharger: Charger = {
      id,
      model,
      lastMaintenance,
      location,
      assignmentStatus,
      conditionStatus,
    };

    const chargerRef = ref(db(), `chargers/${id}`);
    set(chargerRef, newCharger);
    handleCloseModal();
  };

  // Delete charger
  const handleDeleteCharger = (id: string) => {
    if (confirm("Are you sure you want to delete this charger?")) {
      remove(ref(db(), `chargers/${id}`));
    }
  };

  // View charger
  const handleViewCharger = (charger: Charger) => {
    alert(
      `Charger ID: ${charger.id}\nModel: ${charger.model}\nLast Maintenance: ${charger.lastMaintenance}\nLocation: ${charger.location}\nAssignment: ${charger.assignmentStatus}\nCondition: ${charger.conditionStatus}`
    );
  };

  // Generate Charger report
  const handleGenerateCharger = (charger: Charger) => {
    const report = `
Charger Report
--------------
ID: ${charger.id}
Model: ${charger.model}
Last Maintenance: ${charger.lastMaintenance}
Location: ${charger.location}
Assignment: ${charger.assignmentStatus}
Condition: ${charger.conditionStatus}
`;
    console.log(report);
    alert("Charger report generated! Check console.");
  };

  // Toggle assignment status
  const toggleAssignmentStatus = (id: string) => {
    const charger = chargers.find((c) => c.id === id);
    if (!charger) return;
    const newStatus =
      charger.assignmentStatus === "Assigned"
        ? "Available"
        : charger.assignmentStatus === "Available"
        ? "Maintenance"
        : "Assigned";

    const statusRef = ref(db(), `chargers/${id}/assignmentStatus`);
    set(statusRef, newStatus);
  };

  // Toggle condition status
  const toggleConditionStatus = (id: string) => {
    const charger = chargers.find((c) => c.id === id);
    if (!charger) return;
    const newStatus =
      charger.conditionStatus === "Good"
        ? "Excellent"
        : charger.conditionStatus === "Excellent"
        ? "Fair"
        : charger.conditionStatus === "Fair"
        ? "Needs Repair"
        : "Good";

    const statusRef = ref(db(), `chargers/${id}/conditionStatus`);
    set(statusRef, newStatus);
  };

  // Filters
  const filteredChargers = chargers.filter((charger) => {
    const matchesSearch =
      charger.model.toLowerCase().includes(search.toLowerCase()) ||
      charger.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "All Status" || charger.assignmentStatus === filterStatus;

    const matchesAssignee =
      filterAssignee === "All Assignees" || charger.location === filterAssignee;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            Charger Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage charger inventory, assignments, and maintenance
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          + Add Charger
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-8 border border-blue-300">
        <p className="text-xs text-gray-500 mb-2">Filters</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-100">
            <AiOutlineSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search charger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-full outline-none bg-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg p-2 bg-gray-100"
          >
            <option value="All Status">All Status</option>
            <option value="Assigned">Assigned</option>
            <option value="Available">Available</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="border rounded-lg p-2 bg-gray-100"
          >
            <option value="All Assignees">All Assignees</option>
            <option value="Colombo">Colombo</option>
            <option value="Kandy">Kandy</option>
            <option value="Galle">Galle</option>
          </select>
        </div>
      </div>

      {/* Charger Inventory Table */}
      <div className="bg-white shadow rounded-lg p-4 border border-blue-300">
        <h2 className="text-lg font-semibold mb-4">Charger Inventory</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-blue-400 bg-gray-50">
              <th className="p-2">Charger ID</th>
              <th className="p-2">Model</th>
              <th className="p-2">Last Maintenance</th>
              <th className="p-2">Location</th>
              <th className="p-2">Assignment Status</th>
              <th className="p-2">Condition</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChargers.map((charger) => (
              <tr
                key={charger.id}
                className="border-b border-blue-400 hover:bg-gray-50"
              >
                <td className="p-2">{charger.id}</td>
                <td className="p-2">{charger.model}</td>
                <td className="p-2">{charger.lastMaintenance}</td>
                <td className="p-2">{charger.location}</td>
                <td className="p-2">
                  <button
                    onClick={() => toggleAssignmentStatus(charger.id)}
                    className={`px-3 py-1 rounded text-white text-sm ${
                      charger.assignmentStatus === "Assigned"
                        ? "bg-gray-700"
                        : charger.assignmentStatus === "Available"
                        ? "bg-green-600"
                        : "bg-red-500"
                    }`}
                  >
                    {charger.assignmentStatus}
                  </button>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => toggleConditionStatus(charger.id)}
                    className={`px-3 py-1 rounded text-white text-sm ${
                      charger.conditionStatus === "Good"
                        ? "bg-blue-500"
                        : charger.conditionStatus === "Excellent"
                        ? "bg-green-500"
                        : charger.conditionStatus === "Fair"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {charger.conditionStatus}
                  </button>
                </td>
                <td className="p-2 flex gap-1">
                  <button
                    onClick={() => handleViewCharger(charger)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleOpenModal(charger)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCharger(charger.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleGenerateCharger(charger)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Generate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Charger Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative border border-blue-300">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              {editingChargerId ? "Edit Charger" : "Add New Charger"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Charger Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="date"
                value={lastMaintenance}
                onChange={(e) => setLastMaintenance(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
              <select
                value={assignmentStatus}
                onChange={(e) =>
                  setAssignmentStatus(
                    e.target.value as Charger["assignmentStatus"]
                  )
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Assigned">Assigned</option>
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <select
                value={conditionStatus}
                onChange={(e) =>
                  setConditionStatus(
                    e.target.value as Charger["conditionStatus"]
                  )
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
                <option value="Fair">Fair</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveCharger}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingChargerId ? "Update Charger" : "Save Charger"}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
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
