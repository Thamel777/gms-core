'use client';

import { useState } from "react";

interface InventoryReportsProps {
    onNavigate?: (page: string) => void;
}

export default function InventoryReports({ onNavigate }: InventoryReportsProps) {
    const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);

    return (
        <div className="flex-1 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-blue-600 mb-2">Inventory Reports</h1>
                        <p className="text-gray-600 text-lg">Generate comprehensive reports and export data</p>
                    </div>
                </div>
            </div>

            {/* Report Filters & Export Options */}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Report Filters */}
                <div className="bg-white p-6 rounded-lg border border-blue-200 flex-1">
                    <h2 className="text-xl font-semibold mb-4">Report Filters</h2>
                    <p className="text-gray-600 text-sm mb-4">Configure filters to customize your report</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700">Status</label>
                            <select className="border rounded-md p-2">
                                <option>All Status</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700">Brands</label>
                            <select className="border rounded-md p-2">
                                <option>All Brands</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700">Locations</label>
                            <select className="border rounded-md p-2">
                                <option>All Locations</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700">Date From</label>
                            <input type="date" className="border rounded-md p-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700">Date To</label>
                            <input type="date" className="border rounded-md p-2" />
                        </div>
                    </div>
                </div>

                {/* Export Options */}
                <div className="bg-white p-6 rounded-lg border border-blue-200 w-full md:w-64">
                    <h2 className="text-xl font-semibold mb-4">Export Options</h2>
                    <p className="text-gray-600 text-sm mb-4">Export reports in different formats</p>
                    <button className="w-full mb-3 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Export to CSV
                    </button>
                    <button className="w-full mb-6 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Export to PDF
                    </button>
                    <div className="space-y-2">
                        <p className="font-semibold text-gray-700">Quick Reports</p>
                        <ul className="list-disc list-inside text-gray-600">
                            <li>Battery Reports</li>
                            <li>Service Report</li>
                            <li>Maintenance Log</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}