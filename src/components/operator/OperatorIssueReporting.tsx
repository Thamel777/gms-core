"use client";

import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import { FaEye } from "react-icons/fa";

interface OperatorIssueReportingProps {
  onNavigate?: (page: string) => void;
}

export default function OperatorIssueReporting({ onNavigate }: OperatorIssueReportingProps) {
  void onNavigate;
  //new
    const [genId, setGenId] = useState("G001");
  const [emergency, setEmergency] = useState(true);
  const [batteryInfo, setBatteryInfo] = useState(true);
  const [issueDetails, setIssueDetails] = useState("");

  const issues = [
    {
      id: "IS001",
      description: "Unusual burning smell detected",
      assignedTo: "Sahan P.",
      generatorId: "G001",
      date: "4/8/2025",
      status: "Completed",
    },
    {
      id: "IS002",
      description: "No response on startup",
      assignedTo: "Nihal K.",
      generatorId: "G002",
      date: "22/7/2025",
      status: "Pending",
    },
    {
      id: "IS003",
      description: "Fuel system inspection",
      assignedTo: "Jayantha R.",
      generatorId: "G003",
      date: "12/8/2025",
      status: "Pending",
    },
    {
      id: "IS004",
      description: "Emergency repair - cooling system",
      assignedTo: "Dinal W.",
      generatorId: "G004",
      date: "5/8/2025",
      status: "Completed",
    },
  ];

  return (
   
     <div>
      <div className="bg-gray-50 font-sans min-h-screen">
      <div className="container mx-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">Issue Reporting</h1>
            <p className="text-gray-500">Report Your Breakdown</p>
          </div>
          <button
            className="relative bg-blue-500 text-white rounded p-2 shadow flex items-center justify-center"
            type="button"
            aria-label="View notifications"
            title="View notifications"
          >
            <span className=" material-icons text-gray-600"> <FaBell className="text-white text-xl" /></span>
            <span className="absolute bottom-7 left-8 h-4 w-4 bg-blue-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        {/* Form */}
        <main>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gen ID */}
              <div>
                <label
                  htmlFor="genl-id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Gen ID
                </label>
                <input
                  id="genl-id"
                  type="text"
                  value={genId}
                  onChange={(e) => setGenId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Switches */}
              <div className="flex items-center space-x-8 mt-4 md:mt-0 md:justify-end">
                {/* Emergency */}
                <div className="flex items-center">
                  <label
                    htmlFor="emergency"
                    className="mr-3 text-sm font-medium text-gray-700"
                  >
                    Emergency
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="emergency"
                      type="checkbox"
                      checked={emergency}
                      onChange={() => setEmergency(!emergency)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Battery Info */}
                <div className="flex items-center">
                  <label
                    htmlFor="battery-info"
                    className="mr-3 text-sm font-medium text-gray-700"
                  >
                    Include Battery Information
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="battery-info"
                      type="checkbox"
                      checked={batteryInfo}
                      onChange={() => setBatteryInfo(!batteryInfo)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="mt-6">
              <label
                htmlFor="issue-details"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Issue Details
              </label>
              <textarea
                id="issue-details"
                rows={6}
                value={issueDetails}
                onChange={(e) => setIssueDetails(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-yellow-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Issue Assignment Table
            </h2>
            <p className="text-sm text-gray-500 mb-4">{issues.length} tasks found</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 border border-blue-300">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Issue ID</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Generator ID</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="bg-white mx-4 border-b border-b-blue-200">
                      <td className="px-6 py-3 font-medium text-gray-900">{issue.id}</td>
                      <td className="px-6 py-3">{issue.description}</td>
                      <td className="px-6 py-3">{issue.assignedTo}</td>
                      <td className="px-6 py-3">{issue.generatorId}</td>
                      <td className="px-6 py-3">{issue.date}</td>
                      <td className="px-6 py-3">
                        {issue.status === "Completed" ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-2">
                        <button
                          onClick={() => onNavigate?.("Reports")}
                          className="p-2 rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                          type="button"
                          aria-label={`View issue ${issue.id}`}
                        >
                          <span className="material-icons text-base"> <FaEye /> </span>
                        </button>
                        {issue.status === "Completed" ? (
                          <button
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                            type="button"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                            type="button"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
    </div>
      
  );
}
