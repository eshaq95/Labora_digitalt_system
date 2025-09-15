import * as React from 'react'
import { cn } from '@/lib/utils'

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="modern-table">
      <table className={cn('w-full text-sm', className)} {...(props as any)} />
    </div>
  )
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700/50', className)}
      {...props}
    />
  )
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr 
      className={cn(
        'border-b border-gray-100 dark:border-slate-800/30 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all duration-200', 
        className
      )} 
      {...props} 
    />
  )
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th 
      className={cn(
        'py-4 px-6 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider', 
        className
      )} 
      {...props} 
    />
  )
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody 
      className={cn('divide-y divide-gray-100 dark:divide-slate-800/30', className)} 
      {...props} 
    />
  )
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td 
      className={cn(
        'py-4 px-6 text-gray-900 dark:text-gray-100 font-medium', 
        className
      )} 
      {...props} 
    />
  )
}