import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
        outline: 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md',
        ghost: 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg',
        link: 'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        xs: 'h-8 px-2 text-xs rounded-md',
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl',
        xl: 'h-14 px-8 text-lg rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

export function Button({ className, variant, size, children, loading, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}