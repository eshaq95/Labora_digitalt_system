import React from 'react'

interface StatHeaderProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  status?: 'success' | 'warning' | 'danger' | 'neutral'
}

export function StatHeader({ title, value, subtitle, icon, status = 'neutral' }: StatHeaderProps) {
  const statusStyles = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400', 
    danger: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-slate-900 dark:text-slate-100'
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-slate-500 dark:text-slate-400">{icon}</div>}
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</h3>
        </div>
        <p className={`mt-1 text-2xl font-semibold ${statusStyles[status]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
