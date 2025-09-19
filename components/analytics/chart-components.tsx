'use client'

import { useMemo } from 'react'

interface ChartData {
  label: string
  value: number
  color?: string
}

interface SimpleBarChartProps {
  data: ChartData[]
  height?: number
  className?: string
}

export function SimpleBarChart({ data, height = 200, className = '' }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-end space-x-2" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
              style={{
                height: `${(item.value / maxValue) * (height - 40)}px`,
                backgroundColor: item.color || '#3B82F6',
              }}
            />
            <div className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 truncate w-full">
              {item.label}
            </div>
            <div className="text-xs font-medium text-gray-900 dark:text-white">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SimplePieChartProps {
  data: ChartData[]
  size?: number
  className?: string
}

export function SimplePieChart({ data, size = 200, className = '' }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  const segments = useMemo(() => {
    let currentAngle = 0
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      currentAngle += angle
      
      return {
        ...item,
        percentage,
        startAngle,
        endAngle: currentAngle,
        color: item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      }
    })
  }, [data, total])

  const radius = size / 2 - 10
  const centerX = size / 2
  const centerY = size / 2

  const createPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    
    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div className={`flex items-center space-x-6 ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={createPath(segment.startAngle, segment.endAngle)}
            fill={segment.color}
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
      
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {segment.label}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SimpleLineChartProps {
  data: { label: string; value: number }[]
  height?: number
  className?: string
}

export function SimpleLineChart({ data, height = 200, className = '' }: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 300
    const y = height - 40 - ((item.value - minValue) / range) * (height - 80)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={className}>
      <svg width="300" height={height} className="w-full">
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 300
          const y = height - 40 - ((item.value - minValue) / range) * (height - 80)
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all"
              />
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
