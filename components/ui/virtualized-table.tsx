'use client'

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

interface Column<T> {
  key: keyof T
  header: string
  width?: number
  render?: (value: any, item: T) => React.ReactNode
}

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowHeight?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
}

interface RowProps<T> {
  index: number
  style: React.CSSProperties
  data: {
    items: T[]
    columns: Column<T>[]
    onRowClick?: (item: T, index: number) => void
  }
}

function Row<T>({ index, style, data }: RowProps<T>) {
  const { items, columns, onRowClick } = data
  const item = items[index]

  if (!item) return null

  return (
    <div
      style={style}
      className={`flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
        onRowClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column, colIndex) => {
        const value = item[column.key]
        const content = column.render ? column.render(value, item) : String(value || '')
        
        return (
          <div
            key={String(column.key)}
            className="flex items-center px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.width || 150
            }}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 50,
  className = '',
  onRowClick
}: VirtualizedTableProps<T>) {
  const itemData = useMemo(() => ({
    items: data,
    columns,
    onRowClick
  }), [data, columns, onRowClick])

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300"
            style={{ 
              width: column.width || `${100 / columns.length}%`,
              minWidth: column.width || 150
            }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div style={{ height: Math.min(data.length * rowHeight, 400) }}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={data.length}
              itemSize={rowHeight}
              itemData={itemData}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}

export default VirtualizedTable
