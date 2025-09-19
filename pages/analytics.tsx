import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyticsCard } from '@/components/analytics/analytics-card'
import { SimpleBarChart, SimplePieChart, SimpleLineChart } from '@/components/analytics/chart-components'
import { useDashboardStats } from '@/hooks/use-optimized-query'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react'

interface DashboardData {
  overview: {
    totalItems: number
    totalInventoryValue: number
    lowStockItems: number
    expiringSoonItems: number
    turnoverRate: number
  }
  recentActivity: {
    receipts: number
    consumption: number
    period: string
  }
  topCategories: Array<{
    id: string
    name: string
    color: string
    itemCount: number
  }>
  monthlyTrends: Array<{
    month: string
    receipts: number
    consumption: number
    adjustments: number
  }>
  departmentUsage: Array<{
    id: string
    name: string
    itemCount: number
    consumptionCount: number
  }>
  alerts: {
    lowStock: number
    expiringSoon: number
    criticalAlerts: number
  }
}

export default function AnalyticsPage() {
  const { data: dashboardData, isLoading, error, refetch } = useDashboardStats()
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'categories' | 'departments'>('overview')

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ]

  const exportData = () => {
    if (!dashboardData) return
    
    const dataStr = JSON.stringify(dashboardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading the analytics data.
          </p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into your inventory management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button variant="outline" onClick={exportData} disabled={!dashboardData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'trends', label: 'Trends', icon: TrendingUp },
          { key: 'categories', label: 'Categories', icon: PieChart },
          { key: 'departments', label: 'Departments', icon: Package },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === tab.key
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Items"
            value={dashboardData?.overview.totalItems || 0}
            icon={<Package className="h-5 w-5 text-blue-600" />}
            loading={isLoading}
          />
          <AnalyticsCard
            title="Inventory Value"
            value={`${(dashboardData?.overview.totalInventoryValue || 0).toLocaleString()} units`}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            loading={isLoading}
          />
          <AnalyticsCard
            title="Low Stock Alerts"
            value={dashboardData?.alerts.lowStock || 0}
            trend="down"
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            loading={isLoading}
          />
          <AnalyticsCard
            title="Expiring Soon"
            value={dashboardData?.alerts.expiringSoon || 0}
            icon={<Calendar className="h-5 w-5 text-orange-600" />}
            loading={isLoading}
          />
        </div>
      )}

      {/* Recent Activity */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity ({dashboardData?.recentActivity.period})
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Receipts</span>
                  <span className="font-semibold">{dashboardData?.recentActivity.receipts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Consumption</span>
                  <span className="font-semibold">{dashboardData?.recentActivity.consumption || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Turnover Rate</span>
                  <span className="font-semibold">{dashboardData?.overview.turnoverRate || 0}%</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Critical Alerts
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-red-600">Low Stock Items</span>
                  <span className="font-semibold text-red-600">{dashboardData?.alerts.lowStock || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-600">Expiring Soon</span>
                  <span className="font-semibold text-orange-600">{dashboardData?.alerts.expiringSoon || 0}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Critical</span>
                    <span className="font-bold">{dashboardData?.alerts.criticalAlerts || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Categories View */}
      {selectedView === 'categories' && dashboardData?.topCategories && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Top Categories by Item Count
          </h3>
          <SimplePieChart
            data={dashboardData.topCategories.map(cat => ({
              label: cat.name,
              value: cat.itemCount,
              color: cat.color || undefined,
            }))}
          />
        </Card>
      )}

      {/* Departments View */}
      {selectedView === 'departments' && dashboardData?.departmentUsage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Department Usage
          </h3>
          <SimpleBarChart
            data={dashboardData.departmentUsage.map(dept => ({
              label: dept.name,
              value: dept.consumptionCount,
            }))}
          />
        </Card>
      )}

      {/* Trends View */}
      {selectedView === 'trends' && dashboardData?.monthlyTrends && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Trends
          </h3>
          <SimpleLineChart
            data={dashboardData.monthlyTrends.map(trend => ({
              label: trend.month,
              value: trend.receipts + trend.consumption,
            }))}
          />
        </Card>
      )}
    </div>
  )
}
