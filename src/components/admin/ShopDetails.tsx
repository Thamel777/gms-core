'use client';

import { useState } from 'react';
import { ArrowLeft, Edit, MapPin, Phone, User, Calendar } from 'lucide-react';

interface ShopDetailsProps {
  shop: {
    id: string;
    shopId: string;
    centerName: string;
    location: string;
    assignedOperator: string;
    operatorPhone: string;
    totalGenerators: number;
    activeGenerators: number;
    status: 'active' | 'issues' | 'missing items';
  };
  onBack: () => void;
}

export default function ShopDetails({ shop, onBack }: ShopDetailsProps) {
  const [activeTab, setActiveTab] = useState('generators');

  const quickStats = {
    totalGenerators: 2,
    activeGenerators: 1,
    underRepair: 1,
    batteriesAssigned: 2,
    temporaryBatteries: 1,
    missingItems: 2
  };

  const generators = [
    {
      id: 'G001',
      brand: 'Caterpillar',
      size: '50kW',
      serialNumber: 'CAT12345789',
      status: 'active',
      location: 'Up'
    },
    {
      id: 'G005',
      brand: 'Cummins',
      size: '75kW',
      serialNumber: 'CUM987654321',
      status: 'under repair',
      location: 'Down'
    }
  ];

  const batteries = [
    {
      id: 'B001',
      brand: 'Exide',
      size: 'NS 40',
      generatorId: 'G001',
      type: 'permanent',
      installDate: '1/15/2023'
    },
    {
      id: 'B005',
      brand: 'Amaron',
      size: '100Ah',
      generatorId: 'G005',
      type: 'temporary',
      installDate: '7/20/2024'
    }
  ];

  const serviceLogs = [
    {
      id: 'S001',
      generatorId: 'G001',
      serviceType: 'Oil Change',
      technician: 'John Smith',
      serviceDate: '7/15/2024',
      status: 'completed'
    },
    {
      id: 'S005',
      generatorId: 'G005',
      serviceType: 'Emergency Repair',
      technician: 'Mike Johnson',
      serviceDate: '8/1/2024',
      status: 'upcoming'
    }
  ];

  const missingItems = [
    {
      itemType: 'Battery',
      itemName: 'NS 40 Battery',
      description: 'Need 2 units for backup',
      reportedDate: '8/1/2024',
      urgency: 'high',
      status: 'reported'
    },
    {
      itemType: 'Part',
      itemName: 'Oil Filter',
      description: 'Standard oil filter for Caterpillar generators',
      reportedDate: '7/28/2024',
      urgency: 'medium',
      status: 'ordered'
    }
  ];

  const invoices = [
    {
      id: 'INV001',
      date: '7/15/2024',
      description: 'Generator maintenance and parts',
      amount: '₹25,000',
      status: 'paid'
    },
    {
      id: 'INV002',
      date: '7/28/2024',
      description: 'Battery replacement',
      amount: '₹15,000',
      status: 'pending'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'under repair':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Under Repair</span>;
      case 'permanent':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Permanent</span>;
      case 'temporary':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Temporary</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'upcoming':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Upcoming</span>;
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
      case 'reported':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Reported</span>;
      case 'ordered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Ordered</span>;
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generators':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active Generators</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                  <div>Generator ID</div>
                  <div>Brand</div>
                  <div>Size</div>
                  <div>Serial Number</div>
                  <div>Status</div>
                  <div>Location</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {generators.map((generator) => (
                  <div key={generator.id} className="px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="font-medium text-gray-900">{generator.id}</div>
                      <div className="text-gray-900">{generator.brand}</div>
                      <div className="text-gray-900">{generator.size}</div>
                      <div className="text-gray-900">{generator.serialNumber}</div>
                      <div>{getStatusBadge(generator.status)}</div>
                      <div className="text-gray-900">{generator.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'batteries':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Batteries Assigned</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                  <div>Battery ID</div>
                  <div>Brand</div>
                  <div>Size</div>
                  <div>Generator ID</div>
                  <div>Type</div>
                  <div>Install Date</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {batteries.map((battery) => (
                  <div key={battery.id} className="px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="font-medium text-gray-900">{battery.id}</div>
                      <div className="text-gray-900">{battery.brand}</div>
                      <div className="text-gray-900">{battery.size}</div>
                      <div className="text-gray-900">{battery.generatorId}</div>
                      <div>{getStatusBadge(battery.type)}</div>
                      <div className="text-gray-900">{battery.installDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'serviceLogs':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Services</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                  <div>Service ID</div>
                  <div>Generator ID</div>
                  <div>Service Type</div>
                  <div>Technician</div>
                  <div>Service Date</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {serviceLogs.map((service) => (
                  <div key={service.id} className="px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="font-medium text-gray-900">{service.id}</div>
                      <div className="text-gray-900">{service.generatorId}</div>
                      <div className="text-gray-900">{service.serviceType}</div>
                      <div className="text-gray-900">{service.technician}</div>
                      <div className="text-gray-900">{service.serviceDate}</div>
                      <div>{getStatusBadge(service.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'missingItems':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Missing Items</h3>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                <span>⚠️</span>
                Report Missing Item
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
                  <div>Item Type</div>
                  <div>Item Name</div>
                  <div>Description</div>
                  <div>Reported Date</div>
                  <div>Urgency</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {missingItems.map((item, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="font-medium text-gray-900">{item.itemType}</div>
                      <div className="text-gray-900">{item.itemName}</div>
                      <div className="text-gray-900">{item.description}</div>
                      <div className="text-gray-900">{item.reportedDate}</div>
                      <div>{getStatusBadge(item.urgency)}</div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'invoices':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Invoices Linked to This Shop</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
                  <div>Invoice ID</div>
                  <div>Date</div>
                  <div>Description</div>
                  <div>Amount</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="px-6 py-4">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-medium text-gray-900">{invoice.id}</div>
                      <div className="text-gray-900">{invoice.date}</div>
                      <div className="text-gray-900">{invoice.description}</div>
                      <div className="text-gray-900">{invoice.amount}</div>
                      <div>{getStatusBadge(invoice.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{shop.centerName}</h1>
              <p className="text-gray-500">Shop ID: {shop.shopId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
              <span>⚠️</span>
              Report Missing Item
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shop Information */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Shop Information</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Center Code</label>
                  <p className="text-gray-900">{shop.shopId}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">123 Main Street, Business District</p>
                      <p className="text-gray-500">{shop.location}, {shop.location} Central</p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Contact</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{shop.operatorPhone}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <p className="text-gray-900">Primary center with full inventory</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Operator</label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{shop.assignedOperator}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Operating Status</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">8/1/2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Generators</span>
                <span className="text-lg font-bold text-gray-900">{quickStats.totalGenerators}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Generators</span>
                <span className="text-lg font-bold text-green-600">{quickStats.activeGenerators}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Under Repair</span>
                <span className="text-lg font-bold text-yellow-600">{quickStats.underRepair}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Batteries Assigned</span>
                <span className="text-lg font-bold text-gray-900">{quickStats.batteriesAssigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Temporary Batteries</span>
                <span className="text-lg font-bold text-yellow-600">{quickStats.temporaryBatteries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Missing Items</span>
                <span className="text-lg font-bold text-red-600">{quickStats.missingItems}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'generators', label: 'Generators' },
              { id: 'batteries', label: 'Batteries' },
              { id: 'serviceLogs', label: 'Service Logs' },
              { id: 'missingItems', label: 'Missing Items' },
              { id: 'invoices', label: 'Invoices' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}