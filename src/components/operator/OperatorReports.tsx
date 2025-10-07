'use client';

import {
  FaBars,
  FaSearch,
  FaCheck,
  FaShareAlt,
  FaCommentAlt,
  FaCloudUploadAlt,
  FaBell,
} from "react-icons/fa";



interface OperatorReportsProps {
  onNavigate?: (page: string) => void;
}

export default function OperatorReports({ onNavigate }: OperatorReportsProps) {
  void onNavigate;
  return (

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-600">Reports</h1>
          <p className="text-gray-500">Own by This Center</p>
        </div>
        <button
          className="bg-blue-500 text-white rounded p-2 shadow flex items-center justify-center"
          type="button"
          aria-label="View notifications"
          title="View notifications"
        >
          <FaBell className="text-white text-xl" />
        </button>
      </header>

      {/* Search Input */}
      <div className="mb-8">
        <label
          htmlFor="geni-id"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Geni ID
        </label>
        <div className="relative flex items-center">
          <input
            id="geni-id"
            type="text"
            placeholder="Serial Number"
            className="block w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <FaBars className="text-gray-400 mx-4" />
          <span className="text-gray-500">Hinted search text</span>
          <FaSearch className="text-gray-400 ml-auto cursor-pointer" />
        </div>
      </div>

      {/* Generator Status */}
      <div className="bg-green-100  border-green-500 text-green-700  rounded-lg flex items-center justify-between mb-8 h-15">
       
        <div className="m-4">
          <p className="font-semibold">Generator G 006782</p>
          <p className="text-sm">Online</p>
        </div>
       
        <div className="w-20 h-15 rounded-r-lg bg-green-400"></div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Generator Replace Card */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Generator Replace
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            G 006782 Generator Replaced to the Center NO Kaduwela004 Successful
          </p>

          {/* Tasks */}
          <div className="space-y-4">
            {["Battery B0023 Changed", "Last Service", "Usage"].map(
              (task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-200 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                      <span className="text-blue-800 font-bold">A</span>
                    </div>
                    <p className="text-gray-700">{task}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 text-sm mr-2">Checked</span>
                    <div className="bg-blue-500 rounded-full h-6 w-6 flex items-center justify-center">
                      <FaCheck className="text-white text-xs" />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-between items-center">
            <div className="bg-white px-2 py-1 rounded-full shadow-lg">
            <div className="flex space-x-8">
              <button
                className="bg-white p-3 rounded-full  hover:bg-gray-100"
                type="button"
                aria-label="Share report"
                title="Share report"
              >
                <FaShareAlt className="text-gray-600" />
              </button>
              <button
                className="bg-white p-3 rounded-full  hover:bg-gray-100"
                type="button"
                aria-label="Add comment"
                title="Add comment"
              >
                <FaCommentAlt className="text-gray-600" />
              </button>
            </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-blue-500 font-semibold">Close</button>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-600 flex items-center">
                <FaCloudUploadAlt className="mr-2" />
                Save to Cloud
              </button>
            </div>
          </div>
        </div>

        {/* Service Report Card */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Service Report
          </h3>
          <p className="text-gray-600">
            Service Report for Generator G00281 will be available after next
            Service
          </p>
        </div>
      </div>
    </div>


  );
}
