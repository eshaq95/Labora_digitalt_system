import { ReactNode } from 'react'

export function EmptyState({
  title = 'Ingenting her ennå',
  description = 'Kom i gang ved å opprette din første post.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-10 text-gray-600 dark:text-gray-400">
      <p className="font-medium text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-sm mt-1">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
