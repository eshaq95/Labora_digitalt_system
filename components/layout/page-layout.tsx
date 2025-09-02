import { ReactNode } from 'react'
import { PageHeader } from '@/components/ui/page-header'

type PageLayoutProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageLayout({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className = '' 
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-bg-primary dark:bg-slate-950 py-8 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title={title}
          subtitle={subtitle}
          actions={actions}
        />
        {children}
      </div>
    </div>
  )
}

// Spesialisert layout for detaljsider
export function DetailPageLayout({ 
  title, 
  subtitle, 
  backHref = '/',
  actions, 
  children, 
  className = '' 
}: PageLayoutProps & { backHref?: string }) {
  return (
    <div className={`min-h-screen bg-bg-primary dark:bg-slate-950 py-8 px-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title={title}
          subtitle={subtitle}
          actions={actions}
          showBackButton={true}
          backHref={backHref}
        />
        {children}
      </div>
    </div>
  )
}
