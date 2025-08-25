import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn(...) - Combines className values and resolves Tailwind class conflicts.
 * Usage: cn('p-2', isActive && 'bg-sky-500', props.className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
