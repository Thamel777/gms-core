'use client';

import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";

interface DashboardProps {
    onNavigate?: (page: string) => void;
}

interface Battery {
    issue_type?: string;
}

interface Generator {
    hasBatteryCharger?: number;
}

interface ServiceLog {
    generatorId: string;
    serviceType: string;
    overdue?: boolean;
}

interface Task {
    status: string;
    description: string;
    id: string;
    priority?: string;
}

interface Activity {
    description: string;
    status: string;
}

interface PendingAction {
    description: string;
    id: string;
    priority: string;
}

export default function InventoryDashboard({ onNavigate }: DashboardProps) {
    const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
    const [metrics, setMetrics] = useState({
        batteriesInStock: 0,
        temporaryOut: 0,
        returnsDue: 0,
        chargersAvailable: 0,
    });
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from Firebase
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Fetch batteries
        const batteriesRef = ref(db(), 'batteries');
        onValue(
            batteriesRef,
            (snapshot) => {
                const batteriesData = snapshot.val();
                console.log("Batteries Data:", batteriesData); // Debug log
                if (!batteriesData) {
                    setError("No battery data found");
                    setMetrics((prev) => ({ ...prev, batteriesInStock: 0, temporaryOut: 0, returnsDue: 0 }));
                    return;
                }

                const batteriesInStock = Object.keys(batteriesData).length; // Count all batteries
                const temporaryOut = (Object.values(batteriesData) as Battery[]).filter(
                    (battery: Battery) => battery.issue_type === "Temporary"
                ).length;
                const returnsDue = (Object.values(batteriesData) as Battery[]).filter(
                    (battery: Battery) => battery.issue_type === "Fix"
                ).length;

                // Fetch generators
                const generatorsRef = ref(db(), 'generators');
                onValue(
                    generatorsRef,
                    (generatorsSnapshot) => {
                        const generatorsData = generatorsSnapshot.val();
                        if (!generatorsData) {
                            setError("No generator data found");
                            setMetrics((prev) => ({ ...prev, chargersAvailable: 0 }));
                            return;
                        }

                        const chargersAvailable = (Object.values(generatorsData) as Generator[]).filter(
                            (gen: Generator) => gen.hasBatteryCharger === 1
                        ).length;

                        setMetrics({
                            batteriesInStock,
                            temporaryOut,
                            returnsDue,
                            chargersAvailable,
                        });
                    },
                    (error) => {
                        console.error("Generators fetch error:", error);
                        setError("Failed to fetch generators");
                    }
                );

                // Fetch recent activities from serviceLogs
                const serviceLogsRef = ref(db(), 'serviceLogs');
                onValue(
                    serviceLogsRef,
                    (serviceSnapshot) => {
                        const serviceData = serviceSnapshot.val();
                        const activities = serviceData
                            ? (Object.values(serviceData) as ServiceLog[]).map((log: ServiceLog) => ({
                                  description: `Service for generator ${log.generatorId}: ${log.serviceType}`,
                                  status: log.overdue ? "Overdue" : "Completed",
                              }))
                            : [];
                        setRecentActivities(activities.slice(0, 4)); // Limit to 4
                    },
                    (error) => {
                        console.error("Service logs fetch error:", error);
                        setError("Failed to fetch recent activities");
                    }
                );

                // Fetch pending actions from tasks
                const tasksRef = ref(db(), 'tasks');
                onValue(
                    tasksRef,
                    (tasksSnapshot) => {
                        const tasksData = tasksSnapshot.val();
                        const actions = tasksData
                            ? (Object.values(tasksData) as Task[])
                                  .filter((task: Task) => task.status === "pending")
                                  .map((task: Task) => ({
                                      description: task.description,
                                      id: task.id,
                                      priority: task.priority || "Low",
                                  }))
                            : [];
                        setPendingActions(actions.slice(0, 3)); // Limit to 3
                    },
                    (error) => {
                        console.error("Tasks fetch error:", error);
                        setError("Failed to fetch pending actions");
                    }
                );

                setLoading(false);
            },
            (error) => {
                console.error("Batteries fetch error:", error);
                setError("Failed to fetch batteries");
                setLoading(false);
            }
        );

        // Cleanup listeners on unmount
        return () => {
            // Detach listeners if needed
        };
    }, []);

    // Status to color mapping for Recent Activities
    const statusStyles: { [key: string]: { iconColor: string; bgColor: string; textColor: string } } = {
        Completed: { iconColor: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-700" },
        Overdue: { iconColor: "text-red-500", bgColor: "bg-red-100", textColor: "text-red-700" },
    };

    // Priority to color mapping for Pending Actions
    const priorityStyles: { [key: string]: { bgColor: string; textColor: string } } = {
        high: { bgColor: "bg-red-500", textColor: "text-white" },
        medium: { bgColor: "bg-yellow-500", textColor: "text-white" },
        low: { bgColor: "bg-blue-500", textColor: "text-white" },
    };

    if (loading) {
        return <div className="flex-1 p-8 text-center">Loading...</div>;
    }

    if (error) {
        return <div className="flex-1 p-8 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">Inventory Dashboard</h1>
                    <p className="text-gray-600 text-lg">Welcome back!</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => onNavigate?.("Notifications")}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.964 3.91 1.63 6.347 1.964L12 18z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 18c.278.473.46.992.512 1.558A2.992 2.992 0 0112 21a2.992 2.992 0 01-4.512-1.442c.052-.566.234-1.085.512-1.558"
                            />
                        </svg>
                    </button>
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium text-gray-500">Batteries In Stock</h3>
                        <span className="bg-yellow-100 p-2 rounded-full">
                            <svg
                                className="w-5 h-5 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M17 12a4 4 0 01-4 4H5.98l.68-1.36a1 1 0 00-.89-1.41L5 13l-.52-1.04a1 1 0 00-.89-1.41L3 10l-.48-1.04a1 1 0 00-.89-1.41L1 7l.52-1.04a1 1 0 00.89-1.41L3 4l.52-1.04a1 1 0 00.89-1.41L5 1l.52 1.04a1 1 0 00.89 1.41L7 4l.52 1.04a1 1 0 00.89 1.41L9 7l.52 1.04a1 1 0 00.89 1.41L11 10l.52 1.04a1 1 0 00.89 1.41L13 13l.52 1.04a1 1 0 00.89 1.41L15 15l.52 1.04a1 1 0 00.89 1.41L17 17z"
                                    clipRule="evenodd"
                                    fillRule="evenodd"
                                />
                            </svg>
                        </span>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">{metrics.batteriesInStock}</p>
                    <p className="text-sm text-gray-400 mt-1">Available in inventory</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium text-gray-500">Temporary Out</h3>
                        <span className="bg-yellow-100 p-2 rounded-full">
                            <svg
                                className="w-5 h-5 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M17 12a4 4 0 01-4 4H5.98l.68-1.36a1 1 0 00-.89-1.41L5 13l-.52-1.04a1 1 0 00-.89-1.41L3 10l-.48-1.04a1 1 0 00-.89-1.41L1 7l.52-1.04a1 1 0 00.89-1.41L3 4l.52-1.04a1 1 0 00.89-1.41L5 1l.52 1.04a1 1 0 00.89 1.41L7 4l.52 1.04a1 1 0 00.89 1.41L9 7l.52 1.04a1 1 0 00.89 1.41L11 10l.52 1.04a1 1 0 00.89 1.41L13 13l.52 1.04a1 1 0 00.89 1.41L15 15l.52 1.04a1 1 0 00.89 1.41L17 17z"
                                    clipRule="evenodd"
                                    fillRule="evenodd"
                                />
                            </svg>
                        </span>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">{metrics.temporaryOut}</p>
                    <p className="text-sm text-gray-400 mt-1">Temporarily assigned</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium text-gray-500">Returns Due</h3>
                        <span className="bg-red-100 p-2 rounded-full">
                            <svg
                                className="w-5 h-5 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414L6 8.586 4.707 7.293a1 1 0 10-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">{metrics.returnsDue}</p>
                    <p className="text-sm text-gray-400 mt-1">Under repair</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-medium text-gray-500">Chargers Available</h3>
                        <span className="bg-blue-100 p-2 rounded-full">
                            <svg
                                className="w-5 h-5 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M13 6a3 3 0 11-6 0 3 3 0 016 0zm.83 2a2.83 2.83 0 00-5.66 0H5a1 1 0 00-1 1v4a1 1 0 001 1h2.17a2.83 2.83 0 005.66 0H15a1 1 0 001-1V9a1 1 0 00-1-1h-1.17zm.17 2v2H14v-2h-1.17zM6 10v2H5v-2h1z"
                                    clipRule="evenodd"
                                    fillRule="evenodd"
                                />
                            </svg>
                        </span>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">{metrics.chargersAvailable}</p>
                    <p className="text-sm text-gray-400 mt-1">Available in inventory</p>
                </div>
            </div>

            {/* Quick Actions + Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Quick Actions */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => onNavigate && onNavigate("Gate Pass Management")}
                            className="p-6 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200"
                        >
                            <div className="text-2xl mb-2 flex justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 text-blue-500"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-blue-700">Create Gate Pass</p>
                        </button>
                        <button
                            onClick={() => onNavigate && onNavigate("Battery Management")}
                            className="p-6 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200"
                        >
                            <div className="text-2xl mb-2 flex justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 text-blue-500"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 7.5l-2.25-1.312M21 7.5v2.25m0-2.25L18.75 4.5M18.75 4.5L16.5 3.188M18.75 4.5v2.25m0-2.25L16.5 3.188m-2.25 4.312L12 6.75l-4.5 2.625M9 7.5l-2.25-1.312M9 7.5v2.25m0-2.25L6.75 4.5M6.75 4.5L4.5 3.188M6.75 4.5v2.25m0-2.25L4.5 3.188M3 10.5l4.5 2.625M12 12.75l4.5 2.625M12 12.75l-4.5 2.625M12 12.75L12 21M7.5 15l-4.5 2.625M16.5 15L12 17.625l-4.5-2.625M7.5 15v-2.25m9-2.25v2.25m.375-1.125l-4.5-2.625m4.5 2.625v2.25m.375-1.125L12 18.75l-4.5-2.625"
                                    />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-blue-700">Assign Temp Battery</p>
                        </button>
                        <button
                            onClick={() => onNavigate && onNavigate("Charger Management")}
                            className="p-6 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200"
                        >
                            <div className="text-2xl mb-2 flex justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 text-blue-500"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 10.5l-3.25 1.75a.75.75 0 01-1 0L8.25 10.5m4.5-4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm6.75 4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm.75-4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-blue-700">Replace Charger</p>
                        </button>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activities</h3>
                    <ul className="space-y-4 text-sm">
                        {recentActivities.map((activity, index) => (
                            <li key={index} className="flex justify-between items-center">
                                <span className="flex items-center">
                                    <svg
                                        className={`w-4 h-4 ${statusStyles[activity.status]?.iconColor || "text-gray-500"} mr-2`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {activity.status === "Completed" ? (
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        ) : (
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-13.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm3 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                                                clipRule="evenodd"
                                            />
                                        )}
                                    </svg>
                                    {activity.description}
                                </span>
                                <span
                                    className={`px-2 py-0.5 ${statusStyles[activity.status]?.bgColor || "bg-gray-100"} ${
    statusStyles[activity.status]?.textColor || "text-gray-700"
} rounded-full text-xs font-medium`}
                                >
                                    {activity.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Pending Actions */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Pending Actions</h3>
                <div className="space-y-3">
                    {pendingActions.map((action, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-3 ${
    priorityStyles[action.priority.toLowerCase()]?.bgColor || "bg-gray-50"
} rounded-lg`}
                        >
                            <p
                                className={`text-sm font-medium ${
    priorityStyles[action.priority.toLowerCase()]?.textColor || "text-gray-800"
}`}
                            >
                                {action.description} <span className="text-gray-500 font-normal">{action.id}</span>
                            </p>
                            <span
                                className={`px-2 py-1 text-xs ${
    priorityStyles[action.priority.toLowerCase()]?.bgColor || "bg-gray-500"
} ${priorityStyles[action.priority.toLowerCase()]?.textColor || "text-white"} rounded-full`}
                            >
                                {action.priority}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
