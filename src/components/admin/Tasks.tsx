"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle2,
  OctagonAlert as AlertOctagon,
  CalendarCheck,
  X,
} from "lucide-react";
import { MdSearch } from "react-icons/md";
import { onValue, push, ref, set, update } from "firebase/database";
import { db } from "../../firebaseConfig";

type TaskStatus = "pending" | "completed" | "overdue";

interface Task {
  id: string;
  taskId: string;
  description: string;
  assignedTo: string;
  generatorId: string;
  dueDate: string;
  status: TaskStatus;
  createdAt?: number;
  updatedAt?: number;
}

interface RawTask {
  id?: string;
  taskId?: string;
  description?: string;
  assignedTo?: string;
  generatorId?: string;
  dueDate?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: TaskStatus) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "pending":
      return "Pending";
    case "overdue":
      return "Overdue";
    default:
      return "Unknown";
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generators, setGenerators] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    const dbInstance = db();
    const tasksRef = ref(dbInstance, "tasks");
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawTask> | null;
      if (!value) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const mapped: Task[] = Object.entries(value).map(([id, data]) => ({
        id,
        taskId: data.taskId ?? id,
        description: data.description ?? "",
        assignedTo: data.assignedTo ?? "",
        generatorId: data.generatorId ?? "",
        dueDate: data.dueDate ?? "",
        status: (data.status as TaskStatus) ?? "pending",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }));

      setTasks(mapped.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbInstance = db();
    const generatorsRef = ref(dbInstance, "generators");
    const unsubscribe = onValue(generatorsRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        setGenerators([]);
        return;
      }
      setGenerators(Object.keys(value));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbInstance = db();
    const usersRef = ref(dbInstance, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        setTechnicians([]);
        return;
      }

      const techs = Object.entries(value)
        .map(([id, user]) => {
          const cast = user as { role?: string; name?: string } | null;
          if (!cast || cast.role !== "technician" || !cast.name) {
            return null;
          }
          return { id, name: cast.name };
        })
        .filter((entry): entry is { id: string; name: string } => Boolean(entry));

      setTechnicians(techs);
    });

    return () => unsubscribe();
  }, []);

  const assigneeOptions = useMemo(() => {
    return technicians
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [technicians]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
  const dueTodayTasks = 0;

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";

    const dbInstance = db();
    try {
      await update(ref(dbInstance, `tasks/${id}`), {
        status: newStatus,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status. Please try again.");
    }
  };

  const handleFormChange = (field: keyof Task, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.generatorId || !formData.assignedTo || !formData.description || !formData.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const dbInstance = db();
    try {
      const tasksRef = ref(dbInstance, "tasks");
      const newTaskRef = push(tasksRef);
      const taskId = `T${String(tasks.length + 1).padStart(3, "0")}`;

      await set(newTaskRef, {
        id: newTaskRef.key,
        taskId,
        description: formData.description,
        assignedTo: formData.assignedTo,
        generatorId: formData.generatorId,
        dueDate: formData.dueDate,
        status: formData.status ?? "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setIsModalOpen(false);
      setFormData({});
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Tasks</h1>
            <p className="text-gray-600 text-lg">Manage task assignments and track progress</p>
          </div>
          <button
            onClick={() => {
              setFormData({});
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Assign Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow-lg p-6">
          <AlertCircle className="mx-auto text-yellow-500 mb-2" />
          <h3 className="text-sm text-gray-500">Pending Tasks</h3>
          <p className="text-xl font-bold">{pendingTasks}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow-lg p-6">
          <CheckCircle2 className="mx-auto text-green-600 mb-2" />
          <h3 className="text-sm text-gray-500">Completed</h3>
          <p className="text-xl font-bold">{completedTasks}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow-lg p-6">
          <AlertOctagon className="mx-auto text-red-500 mb-2" />
          <h3 className="text-sm text-gray-500">Overdue</h3>
          <p className="text-xl font-bold">{overdueTasks}</p>
        </div>
        <div className="border text-center border-blue-200 bg-white rounded-lg shadow-lg p-6">
          <CalendarCheck className="mx-auto text-blue-500 mb-2" />
          <h3 className="text-sm text-gray-500">Due Today</h3>
          <p className="text-xl font-bold">{dueTodayTasks}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter tasks by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            id="assigneeFilter"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter tasks by technician"
          >
            <option value="all">All Technicians</option>
            {assigneeOptions.map((tech) => (
              <option key={tech.id} value={tech.name}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Task Assignment Table</h2>
          <p className="text-gray-600">{filteredTasks.length} tasks found</p>
        </div>

        {loading ? (
          <p className="text-center py-4 text-gray-500">Loading tasks...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-blue-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-blue-200 bg-blue-50">
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Task ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Assigned To</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Generator ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`border-b border-blue-100 hover:bg-blue-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-blue-50/30"
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{task.taskId}</td>
                    <td className="py-3 px-4 text-gray-700">{task.description}</td>
                    <td className="py-3 px-4 text-gray-700">{task.assignedTo}</td>
                    <td className="py-3 px-4 text-gray-700">{task.generatorId}</td>
                    <td className="py-3 px-4 text-gray-700">{task.dueDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {getStatusText(task.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => setViewTask(task)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {task.status === "completed" ? "Reopen" : "Complete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close assign task modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-blue-600 mb-2">Assign Task</h2>
            <p className="text-sm text-gray-500 mb-4">Create a new task assignment</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-generator" className="block text-sm font-medium text-gray-700">Generator ID</label>
                  <select
                    id="modal-generator"
                    value={formData.generatorId ?? ""}
                    onChange={(e) => handleFormChange("generatorId", e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select generator</option>
                    {generators.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="modal-technician" className="block text-sm font-medium text-gray-700">Assign Technician</label>
                  <select
                    id="modal-technician"
                    value={formData.assignedTo ?? ""}
                    onChange={(e) => handleFormChange("assignedTo", e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select technician</option>
                    {assigneeOptions.map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="modal-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="modal-description"
                  placeholder="Enter detailed task description..."
                  value={formData.description ?? ""}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    id="modal-due-date"
                    value={formData.dueDate ?? ""}
                    onChange={(e) => handleFormChange("dueDate", e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="modal-status"
                    value={formData.status ?? "pending"}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setViewTask(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close task details"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-blue-600 mb-4">Task Details</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-medium">Task ID:</span> {viewTask.taskId}
              </p>
              <p>
                <span className="font-medium">Description:</span> {viewTask.description}
              </p>
              <p>
                <span className="font-medium">Assigned To:</span> {viewTask.assignedTo}
              </p>
              <p>
                <span className="font-medium">Generator ID:</span> {viewTask.generatorId}
              </p>
              <p>
                <span className="font-medium">Due Date:</span> {viewTask.dueDate}
              </p>
              <p>
                <span className="font-medium">Status:</span> {getStatusText(viewTask.status)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
