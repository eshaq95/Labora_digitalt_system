import { LucideIcon } from 'lucide-react'

type Tab = {
  key: string
  label: string
  icon: LucideIcon
  badge?: string | number
}

type TabNavigationProps = {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabKey: string) => void
  className?: string
}

export function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '' 
}: TabNavigationProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-labora-500 text-labora-700 dark:text-labora-400'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge && (
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === key
                    ? 'bg-labora-100 text-labora-700 dark:bg-labora-900/30 dark:text-labora-300'
                    : 'bg-surface text-text-tertiary'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
