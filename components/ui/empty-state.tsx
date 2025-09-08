import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export function EmptyState({
  title = 'Ingenting her ennå',
  description = 'Kom i gang ved å opprette din første post.',
  action,
  icon: Icon,
}: {
  title?: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="text-center py-10 text-gray-600 dark:text-gray-400">
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      <p className="font-medium text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-sm mt-1">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
