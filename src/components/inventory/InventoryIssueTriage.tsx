'use client';

import { useState } from "react";
import { FiClock, FiCheckCircle, FiCalendar, FiAlertCircle, FiChevronDown, FiSearch, FiFilter, FiBattery, FiAlertTriangle } from "react-icons/fi";

interface IssueTriageProps {
    onNavigate?: (page: string) => void;
}

interface Issue {
    id: number;
    title: string;
    description: string;
    technician: string;
    cost: string;
    date: string;
    battery: string;
    charger?: string;
    status: "pending" | "investigating" | "resolved";
    priority: "High" | "Medium" | "Low";
}

export default function InventoryIssueTriage({ onNavigate }: IssueTriageProps) {
    const [activeTab, setActiveTab] = useState<"pending" | "investigating" | "resolved">("pending");
    const [searchTerm, setSearchTerm] = useState("");

    // Stats data
    const stats = [
        { id: 1, name: "Pending Issues", value: "12", icon: <FiClock className="h-6 w-6 text-yellow-500" /> },
        { id: 2, name: "Resolved Today", value: "28", icon: <FiCheckCircle className="h-6 w-6 text-green-500" /> },
        { id: 3, name: "Urgent Priority", value: "3", icon: <FiAlertCircle className="h-6 w-6 text-red-500" /> },
        { id: 4, name: "Investigating", value: "0", icon: <FiCalendar className="h-6 w-6 text-blue-500" /> },
    ];

    // Issues data
    const issues: Issue[] = [
        {
            id: 1,
            title: "Battery not charging properly",
            description: "Battery BAT-2024-001 shows charging issues. Voltage drops rapidly after disconnection. Replaced fuel filter, tested system",
            technician: "Dinal Rashmika",
            cost: "LKR 900",
            date: "7/20/2025",
            battery: "BAT-2024-001",
            charger: "CHG-2024-005",
            status: "pending",
            priority: "High",
        },
        {
            id: 2,
            title: "Incorrect battery type assigned",
            description: "Generator requires Type-C battery but Type-A was installed. Performance issues reported. Replaced radiator hose, topped up coolant",
            technician: "Nimal Perera",
            cost: "LKR 3000",
            date: "8/20/2025",
            battery: "BAT-2024-123",
            status: "pending",
            priority: "Medium",
        },
        {
            id: 3,
            title: "Overheating issue detected",
            description: "Battery BAT-2024-002 overheating during operation. Currently under diagnostic tests.",
            technician: "Kamal Silva",
            cost: "LKR 1500",
            date: "9/15/2025",
            battery: "BAT-2024-002",
            charger: "CHG-2024-006",
            status: "investigating",
            priority: "High",
        },
        {
            id: 4,
            title: "Charger malfunction resolved",
            description: "Charger CHG-2024-007 fixed after short circuit issue. System stable.",
            technician: "Sunil Fernando",
            cost: "LKR 1200",
            date: "9/21/2025",
            battery: "BAT-2024-004",
            status: "resolved",
            priority: "Low",
        },
    ];

    const filteredIssues = issues.filter(
        (issue) =>
            issue.status === activeTab &&
            (issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                issue.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-blue-600 mb-2">Issue Triage</h1>
                    <p className="text-gray-600">Review and manage technician and operator reported issues</p>
                </div>
                <button className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                    Auto-Assign
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                <p className="text-2xl font-semibold">{stat.value}</p>
                            </div>
                            <div className="p-2 bg-gray-100 rounded-full">{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search issues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <FiFilter className="mr-2" />
                            Filter
                            <FiChevronDown className="ml-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`${activeTab === "pending" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Pending Review
                    </button>
                    <button
                        onClick={() => setActiveTab("investigating")}
                        className={`${activeTab === "investigating" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Investigating
                    </button>
                    <button
                        onClick={() => setActiveTab("resolved")}
                        className={`${activeTab === "resolved" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Resolved
                    </button>
                </nav>
            </div>

            {/* Issues List */}
            <div className="space-y-4">
                {filteredIssues.length > 0 ? (
                    filteredIssues.map((issue) => (
                        <div key={issue.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-medium text-gray-900">{issue.title}</h3>
                                        {issue.title === "Battery not charging properly" && (
                                            <FiBattery className="h-6 w-6 text-red-500" />
                                        )}
                                        {issue.title === "Incorrect battery type assigned" && (
                                            <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">{issue.description}</p>

                                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Technician</p>
                                            <p className="font-medium">{issue.technician}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Cost</p>
                                            <p className="font-medium">{issue.cost}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Date</p>
                                            <p className="font-medium">{issue.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Battery</p>
                                            <p className="font-medium">{issue.battery}</p>
                                        </div>
                                        {issue.charger && (
                                            <div className="md:col-span-2">
                                                <p className="text-gray-500">Charger</p>
                                                <p className="font-medium">{issue.charger}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                  <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.priority === "High"
                              ? "bg-red-100 text-red-800"
                              : issue.priority === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                      }`}
                  >
                    {issue.priority}
                  </span>
                                    <button className="text-blue-600 hover:text-blue-800">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                                <button
                                    onClick={() => onNavigate && onNavigate(`/issue-details/${issue.id}`)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    View Details
                                </button>
                                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                    Assign
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500">No {activeTab} issues found</p>
                    </div>
                )}
            </div>
        </div>
    );
}