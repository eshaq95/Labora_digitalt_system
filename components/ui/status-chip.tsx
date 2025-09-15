import React from 'react'

interface StatusChipProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
}

export function StatusChip({ children, variant = 'neutral', size = 'sm' }: StatusChipProps) {
  const variants = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700'
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  }

  const dotColors = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-600', 
    danger: 'bg-rose-600',
    neutral: 'bg-slate-600'
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${variants[variant]} ${sizes[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}></span>
      {children}
    </span>
  )
}
