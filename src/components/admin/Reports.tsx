'use client';

import { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const [generatorStatus, setGeneratorStatus] = useState('all');
  const [brand, setBrand] = useState('all');
  const [location, setLocation] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeServices, setIncludeServices] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeBatteries, setIncludeBatteries] = useState(true);
  const [includeRepairs, setIncludeRepairs] = useState(true);

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-1">Reports & Export</h1>
            <p className="text-gray-600 text-base">Generate comprehensive reports and export data</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Services This Month</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-gray-600">Completed services</p>
            </div>
            <div className="text-right">
              <span className="text-green-600 text-sm font-medium">+12%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Batteries Replaced</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            <div className="text-right">
              <span className="text-green-600 text-sm font-medium">+8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
              <p className="text-sm text-gray-600">Pending completion</p>
            </div>
            <div className="text-right">
              <span className="text-red-600 text-sm font-medium">-3%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Generators</p>
              <p className="text-2xl font-bold text-gray-900">178</p>
              <p className="text-sm text-gray-600">Across all centers</p>
            </div>
            <div className="text-right">
              <span className="text-green-600 text-sm font-medium">+2%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-600 mb-2">Report Filters</h2>
          <p className="text-sm text-gray-500 mb-6">Configure filters to customize your report</p>

          <div className="space-y-6">
            {/* Generator Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Generator Status</label>
              <select
                value={generatorStatus}
                onChange={(e) => setGeneratorStatus(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="under-repair">Under Repair</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Brands</option>
                <option value="caterpillar">Caterpillar</option>
                <option value="cummins">Cummins</option>
                <option value="honda">Honda</option>
                <option value="kohler">Kohler</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                <option value="colombo">Colombo</option>
                <option value="gampaha">Gampaha</option>
                <option value="kandy">Kandy</option>
                <option value="negombo">Negombo</option>
                <option value="galle">Galle</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Include in Report */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include in Report</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeServices}
                    onChange={(e) => setIncludeServices(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Services</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeTasks}
                    onChange={(e) => setIncludeTasks(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Tasks</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeBatteries}
                    onChange={(e) => setIncludeBatteries(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Batteries</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRepairs}
                    onChange={(e) => setIncludeRepairs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Repairs</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-600 mb-2">Export Options</h2>
          <p className="text-sm text-gray-500 mb-6">Download reports in different formats</p>

          <div className="space-y-4 mb-8">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">Export to Excel</span>
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <FileText className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">Export to PDF</span>
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Reports</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Monthly Summary</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Service Report</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Maintenance Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}