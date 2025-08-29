import { ReactNode } from 'react'

type Props = { title: string; subtitle?: string; actions?: ReactNode }

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
