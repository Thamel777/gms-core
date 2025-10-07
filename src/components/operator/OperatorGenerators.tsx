'use client';

import { useState, useRef, useEffect } from "react";
import { FaBell } from "react-icons/fa";

interface OperatorGeneratorsProps {
  onNavigate?: (page: string) => void;
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

  const formatDateForInput = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
      const dateStr = formatDateForInput(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = dateStr === tempSelectedDate;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <button
          key={day}
          className={`w-8 h-8 rounded-full text-sm flex items-center justify-center hover:bg-blue-100 ${
            isSelected ? 'bg-blue-500 text-white' : isToday ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
          }`}
          onClick={() => setTempSelectedDate(dateStr)}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleOK = () => {
    onDateChange(tempSelectedDate);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedDate(selectedDate);
    onClose();
  };

  return (
    <div className="w-80">
      <div className="flex items-center justify-between mb-2">
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => navigateMonth('prev')}
          aria-label="Previous month"
        >
          &lt;
        </button>
        <div className="font-semibold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => navigateMonth('next')}
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-center text-gray-500">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {renderCalendarDays()}
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleOK}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function OperatorGenerators({ onNavigate }: OperatorGeneratorsProps) {
  void onNavigate;
  const [search, setSearch] = useState("");
  const [withGen, setWithGen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeTogglePositionClass = withGen ? 'left-1' : 'left-[calc(50%+0.25rem)]';
  const withGenAriaSelected: 'true' | 'false' = withGen ? 'true' : 'false';
  const withoutGenAriaSelected: 'true' | 'false' = withGen ? 'false' : 'true';
  const datePickerExpanded: 'true' | 'false' = showDatePicker ? 'true' : 'false';

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
  // Mock battery data
  const batteries = [
    { id: "G00281", status: "Online", type: "With Battery", color: "bg-green-100", dot: "bg-green-400" },
    { id: "G06723", status: "Stand By", type: "With Battery", color: "bg-blue-100", dot: "bg-blue-400" },
    { id: "G02386", status: "Sent to Repair", type: "With Battery", color: "bg-red-100", dot: "bg-red-400" },
     { id: "G02380", status: "Sent to Repair", type: "Without Battery", color: "bg-red-100", dot: "bg-red-400" },
  ];

  // Filter batteries by search and toggle
  const filteredBatteries = batteries.filter(b =>
    b.id.toLowerCase().includes(search.toLowerCase()) &&
    (withGen ? b.type === "With Battery" : b.type === "Without Battery")
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-blue-600">Available Generators</h1>
        <button
          className="bg-blue-500 text-white rounded p-2 shadow flex items-center justify-center"
          type="button"
          aria-label="View notifications"
          title="View notifications"
        >
          <FaBell className="text-white text-xl" />
        </button>
      </div>
      <p className="text-gray-600 mb-6">Own by this center</p>

      {/* Search and Toggle */}
      <div className="flex items-center gap-8 mb-8">
        <div className="mr-8">
        <p className="text-gray-700 font-small mb-2">Gen Id</p>
        <input
          type="text"
          placeholder="Serial Number"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-blue-400 rounded px-4 py-1 w-64 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        />
        </div>
        <div
          className="relative w-[360px] h-10 rounded-full bg-blue-400 p-1 shadow mt-6"
          role="tablist"
          aria-label="Generator filter"
        >
          <div
            className={`absolute top-1 bottom-1 rounded-full bg-white shadow transition-all duration-300 w-[calc(50%-0.25rem)] ${activeTogglePositionClass}`}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full select-none">
            <button
              type="button"
              aria-pressed={withGen}
              className="flex-1 rounded-full font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={() => setWithGen(true)}
            >
              With Battery
            </button>
            <button
              type="button"
              aria-pressed={!withGen}
              className="flex-1 rounded-full font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={() => setWithGen(false)}
            >
              Without Battery
            </button>
          </div>
        </div>
      </div>

      {/* Generator List */}
       <div className="space-y-4 mb-10">
        {filteredBatteries.map(b => (
          <div key={b.id} className={`flex items-center justify-between rounded-lg h-15 shadow ${b.color}`}>
            <div className="flex items-center gap-4 my-4 mx-2">
              <span className={`w-6 h-6 rounded-full ${b.dot}`}></span>
              <div>
                <div className="font-bold text-lg">Generator {b.id}</div>
                <div className="text-sm text-gray-700">{b.status}</div>
              </div>
            </div>
            <div className={`w-20 h-15 rounded-r-lg ${b.dot}`}></div>
          </div>
        ))}
      </div>



      {/* Date Picker and Breakdown */}
      <div className="flex gap-12 items-start">
        {/* Date Picker */}
        <div className="relative w-70" ref={datePickerRef}>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="font-semibold mb-3 text-gray-800">Date</div>
            <button
              type="button"
              onClick={() => setShowDatePicker(v => !v)}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 px-3 py-2 transition"
              aria-haspopup="dialog"
              aria-expanded={datePickerExpanded}
            >
              <div className="flex items-center gap-3">
                {/* Calendar icon */}
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="text-gray-800">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Popover */}
            {showDatePicker && (
              <div className="absolute z-20 mt-2 w-90">
                <div className="origin-top left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-1 animate-in fade-in slide-in-from-top-2">
                  <CustomDatePicker
                    selectedDate={selectedDate}
                    onDateChange={(d) => setSelectedDate(d)}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Breakdown & Chart */}
        <div className="flex-1 ml-10">
          {/* Header with timeframe */}
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-blue-600">Recently Breakdown</div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {([['7d','7D'],['30d','30D'],['90d','90D']] as const).map(([key,label]) => (
                <button
                  key={key}
                  onClick={() => setTimeframe(key)}
                  className={`px-3 py-1 rounded-full text-sm ${timeframe===key ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                  aria-pressed={timeframe===key}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Mini summary pills */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              <span className="text-sm text-green-700">Online</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-sm text-blue-700">Extra</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="text-sm text-red-600">Replace Requests</span>
            </div>
          </div>

          {/* Modern area chart (SVG) */}
          <ChartArea timeframe={timeframe} hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
}

// Lightweight responsive area chart using pure SVG with gradient and tooltip
function ChartArea({
  timeframe,
  hoverIndex,
  setHoverIndex,
  selectedDate
}: {
  timeframe: '7d' | '30d' | '90d';
  hoverIndex: number | null;
  setHoverIndex: (i: number | null) => void;
  selectedDate: string;
}) {
  const width = 720; // viewBox width
  const height = 220; // viewBox height
  const pad = { l: 36, r: 12, t: 16, b: 28 };

  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;

  // Build labels from selectedDate backwards
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Generate smoothish demo data
  const data = Array.from({ length: days }, (_, i) => {
    const base = 20 + 6 * Math.sin((i / (days - 1 || 1)) * Math.PI * 1.5);
    const wiggle = ((i % 5) - 2) * 0.8;
    return Math.max(5, Math.round(base + wiggle));
  });

  const minY = Math.min(...data);
  const maxY = Math.max(...data);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const xAt = (i: number) => pad.l + (i / (days - 1)) * innerW;
  const yAt = (v: number) => {
    const span = Math.max(1, maxY - minY);
    return pad.t + (1 - (v - minY) / span) * innerH;
  };

  // Build line path
  let dLine = '';
  data.forEach((v, i) => {
    const x = xAt(i);
    const y = yAt(v);
    dLine += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  // Build area path
  const dArea = `${dLine} L ${xAt(days - 1)} ${pad.t + innerH} L ${xAt(0)} ${pad.t + innerH} Z`;

  // Grid lines (y)
  const gridYValues = 4;
  const gridLines = Array.from({ length: gridYValues + 1 }, (_, i) => pad.t + (i / gridYValues) * innerH);

  const handleMove = (evt: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    const { left } = (evt.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = evt.clientX - left;
    // Find nearest index
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < days; i++) {
      const dx = Math.abs(px - xAt(i));
      if (dx < best) {
        best = dx;
        nearest = i;
      }
    }
    setHoverIndex(nearest);
  };

  const handleLeave = () => setHoverIndex(null);

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        <defs>
          <linearGradient id="strokeGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0.06)" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLines.map((y, idx) => (
          <line key={idx} x1={pad.l} y1={y} x2={pad.l + innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
        ))}

        {/* Area */}
        <path d={dArea} fill="url(#fillGrad)" stroke="none" />
        {/* Line */}
        <path d={dLine} fill="none" stroke="url(#strokeGrad)" strokeWidth={3.5} strokeLinecap="round" />

        {/* Points */}
        {data.map((v, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(v)} r={hoverIndex === i ? 4 : 3} fill="#3b82f6" />
        ))}

        {/* Hover capture */}
        <rect
          x={pad.l}
          y={pad.t}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />

        {/* Hover line */}
        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="#93c5fd"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-2 rounded-md bg-white shadow px-2 py-1 text-xs border"
          style={{
            left: `${((hoverIndex / (days - 1 || 1)) * 100)}%`,
            top: 6,
          }}
        >
          <div className="text-gray-500">{labels[hoverIndex]}</div>
          <div className="font-semibold text-gray-800">{data[hoverIndex]}</div>
        </div>
      )}

      {/* X labels (sparse) */}
      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length/2)]}</span>
        <span>{labels[labels.length-1]}</span>
      </div>
    </div>
  );
}