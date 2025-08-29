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
      className={cn('bg-gradient-to-r from-bg-secondary to-bg-tertiary border-b border-border', className)}
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
        'border-b border-border/50 hover:bg-surface-hover transition-all duration-200 hover:shadow-sm', 
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
        'py-4 px-6 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider', 
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
      className={cn('divide-y divide-border/30', className)} 
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
        'py-4 px-6 text-text-primary font-medium', 
        className
      )} 
      {...props} 
    />
  )
}