import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'modern-input w-full text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-labora/20 focus:border-labora disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)