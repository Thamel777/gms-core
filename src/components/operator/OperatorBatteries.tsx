'use client';

import {useEffect, useRef, useState} from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../../firebaseConfig";
import { FaBell } from "react-icons/fa";

interface OperatorBatteriesProps {
  onNavigate?: (page: string) => void;
}

// Firebase battery record structure
type RawBatteryRecord = {
  id?: string;
  size?: string;
  serial_no?: string;
  issued_date?: number | string | null;
  install_date?: number | string | null;
  generator_id?: string;
  shop_id?: string;
  issue_type?: string; // Fix | Temporary
  gate_pass?: string;
  createdAt?: number;
  updatedAt?: number;
};

// UI battery object structure
interface BatteryItem {
  id: string;
  status: string;
  type: string;
  color: string;
  dot: string;
}

interface CustomDatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onClose: () => void;
}

function CustomDatePicker({ selectedDate, onDateChange, onClose }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === tempSelectedDate;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <button
          key={day}
          onClick={() => setTempSelectedDate(dateStr)}
          className={`w-8 h-8 text-sm rounded flex items-center justify-center hover:bg-blue-100 ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isToday 
                ? 'bg-blue-100 text-blue-600 font-medium' 
                : 'text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handleConfirm = () => {
    onDateChange(tempSelectedDate);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 w-80">
      {/* Current Selection Display */}
      <div className="mb-4 p-2 bg-gray-50 rounded">
        <div className="text-xs text-gray-500 mb-1">Selected Date:</div>
        <div className="font-medium">
          {new Date(tempSelectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderCalendarDays()}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="text-blue-500 text-sm hover:text-blue-600"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default function OperatorBatteries({ onNavigate }: OperatorBatteriesProps) {
  // Firebase data state
  const [batteries, setBatteries] = useState<RawBatteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [withGen, setWithGen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Load batteries from Firebase
  useEffect(() => {
    const batteriesRef = ref(db(), 'batteries');
    
    const unsubscribe = onValue(batteriesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const batteriesArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setBatteries(batteriesArray);
        } else {
          setBatteries([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading batteries:", err);
        setError("Failed to load batteries");
        setLoading(false);
      }
    }, (error) => {
      console.error("Firebase error:", error);
      setError("Database connection error");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Convert Firebase data to UI format with status derivation
  const getBatteryItems = () => {
    return batteries.map((battery) => {
      let status = "Available";
      let type = "Without Gen";
      let color = "bg-blue-100";
      let dot = "bg-blue-400";

      // Determine if battery is with generator
      if (battery.shop_id && battery.generator_id && battery.install_date) {
        type = "With Gen";
        status = "Online";
        color = "bg-green-100";
        dot = "bg-green-400";
      } else if (battery.shop_id && battery.issued_date && !battery.install_date) {
        type = "With Gen";
        status = "Issued (Not Installed)";
        color = "bg-yellow-100";
        dot = "bg-yellow-400";
      } else if (battery.issue_type) {
        status = battery.issue_type === "Fix" ? "Replace Request Sent" : "Maintenance Required";
        color = "bg-red-100";
        dot = "bg-red-400";
        type = battery.generator_id ? "With Gen" : "Without Gen";
      } else {
        status = "Extra";
        type = "Without Gen";
      }

      return {
        id: battery.serial_no || battery.id || "",
        status,
        type,
        color,
        dot
      };
    });
  };

  const batteryItems = getBatteryItems();

  // Close popover on outside click or ESC key
  useEffect(() => {
    if (!showDatePicker) return;
    const onClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDatePicker(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showDatePicker]);

  // Filter batteries by search and toggle
  const filteredBatteries = batteryItems.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) &&
    (withGen ? b.type === "With Gen" : b.type === "Without Gen")
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-blue-600">Batteries</h1>
        <button className="bg-blue-500 text-white rounded p-2 shadow flex items-center justify-center">
          <FaBell className="text-white text-xl" />
        </button>
      </div>
      <p className="text-gray-600 mb-6">Monitor and manage battery status</p>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading batteries...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Batteries</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content - only show when not loading */}
      {!loading && !error && (
        <>
          {/* Search and Toggle */}
          <div className="flex items-center gap-4 mb-8">
            <input
              type="text"
              placeholder="Serial Number"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64"
            />
            
            {/* Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">With Gen</span>
              <button
                onClick={() => setWithGen(!withGen)}
                className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors ${
                  withGen ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`transform transition-transform duration-200 inline-block h-4 w-4 rounded-full bg-white ${
                    withGen ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">Without Gen</span>
            </div>

            {/* Date Picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </button>
              
              {showDatePicker && (
                <CustomDatePicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Batteries</p>
                  <p className="text-2xl font-bold text-gray-900">{batteryItems.filter(b => b.status === "Online").length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{batteryItems.filter(b => b.status === "Extra").length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{batteryItems.filter(b => b.status.includes("Replace") || b.status.includes("Maintenance")).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Battery List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Battery Status ({filteredBatteries.length} batteries)
              </h3>
            </div>
            <div className="p-6">
              {filteredBatteries.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No batteries found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {search ? `No batteries match "${search}"` : "No batteries in this category"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBatteries.map((battery, index) => (
                    <div key={battery.id} className={`p-4 rounded-lg border ${battery.color} border-opacity-50`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${battery.dot}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{battery.id}</p>
                            <p className="text-sm text-gray-600">{battery.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${battery.color.replace('bg-', 'text-').replace('-100', '-700')}`}>
                            {battery.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chart Section */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Battery Performance Trend</h3>
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 text-sm rounded ${
                      timeframe === period
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center text-gray-500">
              {/* Placeholder for chart */}
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2 text-sm">Performance chart will be displayed here</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}