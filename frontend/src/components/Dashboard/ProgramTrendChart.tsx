import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ProgramTrend } from '../../hooks/useDashboard';

interface ProgramTrendChartProps {
  data: ProgramTrend[];
}

export default function ProgramTrendChart({ data }: ProgramTrendChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(amount);
  };

  // Get all unique months from all programs
  const allMonths = [...new Set(
    data.flatMap(program => 
      program.monthly_data.map(item => item.month)
    )
  )].sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Get max amount for scaling
  const maxAmount = Math.max(
    ...data.flatMap(program => 
      program.monthly_data.map(item => item.total_amount)
    )
  );

  // Generate colors for each program
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ];

  if (data.length === 0 || allMonths.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">Trend Program 6 Bulan Terakhir</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Tidak ada data untuk ditampilkan</p>
        </div>
      </div>
    );
  }

  // Chart dimensions - responsive
  const minChartWidth = 400;
  const chartWidth = Math.max(minChartWidth, data.length * 100); // Dynamic width based on data
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 80 }; // Increased left padding for labels
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Create points for each program line
  const createLinePoints = (program: any, programIndex: number) => {
    return allMonths.map((month, monthIndex) => {
      const monthData = program.monthly_data.find((item: any) => item.month === month);
      const amount = monthData ? monthData.total_amount : 0;
      // Handle case when there's only one month to avoid division by zero
      const x = allMonths.length > 1 
        ? (monthIndex / (allMonths.length - 1)) * innerWidth
        : innerWidth / 2; // Center the point if only one month
      const y = maxAmount > 0 
        ? innerHeight - (amount / maxAmount) * innerHeight
        : innerHeight; // Bottom if no amount
      return { x, y, amount, month };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <TrendingUp className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Trend Program 6 Bulan Terakhir</h2>
      </div>
      
      {/* Chart Container - Responsive with scroll */}
       <div className="w-full overflow-x-auto overflow-y-hidden border border-gray-100 rounded-lg bg-gray-50 p-2">
         <div className="min-w-full" style={{ minWidth: `${chartWidth}px` }}>
           <svg width={chartWidth} height={chartHeight} className="block bg-white rounded">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={innerWidth} height={innerHeight} x={padding.left} y={padding.top} fill="url(#grid)" />
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding.top + innerHeight - (ratio * innerHeight);
            const value = maxAmount * ratio;
            return (
              <g key={index}>
                <line 
                  x1={padding.left - 5} 
                  y1={y} 
                  x2={padding.left} 
                  y2={y} 
                  stroke="#6b7280" 
                  strokeWidth="1"
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fontSize="10" 
                  fill="#6b7280"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {allMonths.map((month, index) => {
            // Handle case when there's only one month to avoid division by zero
            const x = allMonths.length > 1 
              ? padding.left + (index / (allMonths.length - 1)) * innerWidth
              : padding.left + innerWidth / 2; // Center the label if only one month
            return (
              <g key={index}>
                <line 
                  x1={x} 
                  y1={padding.top + innerHeight} 
                  x2={x} 
                  y2={padding.top + innerHeight + 5} 
                  stroke="#6b7280" 
                  strokeWidth="1"
                />
                <text 
                  x={x} 
                  y={padding.top + innerHeight + 20} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="#6b7280"
                >
                  {month}
                </text>
              </g>
            );
          })}
          
          {/* Program lines */}
          {data.map((program, programIndex) => {
            const points = createLinePoints(program, programIndex);
            const color = colors[programIndex % colors.length];
            const pathData = points.map((point, index) => 
              `${index === 0 ? 'M' : 'L'} ${padding.left + point.x} ${padding.top + point.y}`
            ).join(' ');
            
            return (
              <g key={program.program_id}>
                {/* Line */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Points */}
                {points.map((point, pointIndex) => (
                  <circle 
                    key={pointIndex}
                    cx={padding.left + point.x} 
                    cy={padding.top + point.y} 
                    r="4" 
                    fill={color} 
                    stroke="white" 
                    strokeWidth="2"
                  >
                    <title>{`${program.program_name} - ${point.month}: ${formatCurrency(point.amount)}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
          </svg>
        </div>
      </div>
      
      {/* Legend - Responsive */}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-3 overflow-x-auto pb-2">
            {data.map((program, index) => (
              <div key={program.program_id} className="flex items-center gap-2 whitespace-nowrap">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-xs sm:text-sm text-gray-600">{program.program_name}</span>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}