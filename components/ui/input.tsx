import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Lightweight Input used in forms.
 * Exported as named Input so imports like { Input } will work.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
          className,
        )}
        {...props}
      />
    )
  },
)
