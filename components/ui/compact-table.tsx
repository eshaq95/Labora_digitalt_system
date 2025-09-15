import React from 'react'
import { StatusChip } from './status-chip'

interface CompactTableProps {
  headers: string[]
  rows: Array<{
    id: string
    cells: React.ReactNode[]
    onClick?: () => void
  }>
}

export function CompactTable({ headers, rows }: CompactTableProps) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-slate-500 dark:text-slate-400 text-xs">
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {headers.map((header, index) => (
              <th key={index} className="py-2 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr]:border-b [&_tr]:border-slate-100 dark:[&_tr]:border-slate-800">
          {rows.map((row) => (
            <tr 
              key={row.id} 
              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 ${
                row.onClick ? 'cursor-pointer' : ''
              }`}
              onClick={row.onClick}
            >
              {row.cells.map((cell, index) => (
                <td key={index} className="py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helper component for low stock table specifically
interface LowStockItem {
  id: string
  name: string
  location: string
  currentStock: number
  minStock: number
  department?: string
  isCritical?: boolean
}

interface LowStockTableProps {
  items: LowStockItem[]
  onItemClick?: (item: LowStockItem) => void
}

export function LowStockTable({ items, onItemClick }: LowStockTableProps) {
  const rows = items.map(item => ({
    id: item.id,
    onClick: onItemClick ? () => onItemClick(item) : undefined,
      cells: [
        <div key="name" className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
          {item.department && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.department}</span>
          )}
        </div>,
        <span key="location" className="text-slate-700 dark:text-slate-300">{item.location}</span>,
        <div key="stock" className="text-right">
          <span className="font-medium text-slate-900 dark:text-slate-100">{item.currentStock}</span>
        </div>,
        <div key="min" className="text-right">
          <span className="text-slate-500 dark:text-slate-400">{item.minStock}</span>
        </div>,
      <div key="status" className="text-right">
        {item.isCritical ? (
          <StatusChip variant="danger">Kritisk</StatusChip>
        ) : (
          <StatusChip variant="warning">Lav</StatusChip>
        )}
      </div>
    ]
  }))

  return (
    <CompactTable 
      headers={['Vare', 'Lokasjon', 'Beholdning', 'Min', 'Status']}
      rows={rows}
    />
  )
}
