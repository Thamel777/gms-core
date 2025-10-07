'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  variant?: 'primary' | 'default';
}

export default function MetricCard({ title, value, subtitle, icon, variant = 'default' }: MetricCardProps) {
  return (
    <div className={`rounded-lg shadow-lg p-6 ${
      variant === 'primary' 
        ? 'bg-gradient-to-b from-blue-600 to-blue-500 text-white' 
        : 'bg-white text-gray-800'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className={`text-sm font-medium mb-2 ${
            variant === 'primary' ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {title}
          </h3>
          <p className={`text-3xl font-bold mb-1 ${
            variant === 'primary' ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          <p className={`text-sm ${
            variant === 'primary' ? 'text-blue-100' : 'text-gray-600'
          }`}>
            {subtitle}
          </p>
        </div>
        <div className={`text-3xl ${
          variant === 'primary' ? 'text-white' : 'text-gray-400'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
