import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:pointer-events-none h-9 px-4',
  {
    variants: {
      variant: {
        default: 'bg-sky-600 text-white hover:bg-sky-700',
        outline:
          'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900',
        ghost: 'hover:bg-gray-100 text-gray-900',
        danger: 'border border-red-200 text-red-600 hover:bg-red-50',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4',
        lg: 'h-10 px-5 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
