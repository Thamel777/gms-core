'use client';

import { useState } from 'react';

interface AISummaryPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AISummaryPopup({ isOpen, onClose }: AISummaryPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI System Summary</h2>
              <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* System Overview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                System Overview
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  The Generator Management System is currently operating at optimal efficiency with 178 active centers 
                  across the network. The system has processed 23 upcoming service requests and is managing 7 generators 
                  currently under repair.
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Key Performance Indicators
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">95.2%</div>
                  <div className="text-sm text-green-700">System Uptime</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <div className="text-sm text-blue-700">Generator Efficiency</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">12.3</div>
                  <div className="text-sm text-yellow-700">Avg Response Time (hrs)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">156</div>
                  <div className="text-sm text-purple-700">Active Users</div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Recent System Alerts
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-500">⚠️</span>
                  <span className="text-sm text-gray-700">Generator #G-0234 requires immediate maintenance</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-500">ℹ️</span>
                  <span className="text-sm text-gray-700">Scheduled maintenance for Center #C-089 completed</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm text-gray-700">All backup generators are operational</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                AI Recommendations
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Consider preventive maintenance for generators older than 5 years</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Optimize spare parts inventory based on usage patterns</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Schedule staff training for new diagnostic procedures</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
