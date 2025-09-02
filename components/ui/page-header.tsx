import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = { 
  title: string; 
  subtitle?: string; 
  actions?: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  showBackButton = false, 
  backHref = '/' 
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-4">
        {showBackButton && (
          <Link 
            href={backHref}
            className="mt-1 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
