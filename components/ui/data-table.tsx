import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from './table'
import { SearchInput } from './search-input'
import { EmptyState } from './empty-state'
import { LucideIcon } from 'lucide-react'

type Column<T> = {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  className?: string
  sortable?: boolean
}

type DataTableProps<T> = {
  title: string
  icon: LucideIcon
  data: T[]
  columns: Column<T>[]
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: LucideIcon
  actions?: ReactNode
  isLoading?: boolean
}

export function DataTable<T extends Record<string, any>>({
  title,
  icon: Icon,
  data,
  columns,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Søk...",
  emptyStateTitle = "Ingen data",
  emptyStateDescription = "Ingen elementer å vise",
  emptyStateIcon,
  actions,
  isLoading = false
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-surface-hover rounded"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-hover rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4">
          <SearchInput 
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-80"
          />
          <div className="text-sm text-text-secondary">
            {data.length} elementer
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
              icon={emptyStateIcon || Icon}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-hover">
                {columns.map((column, index) => (
                  <TableHead 
                    key={index} 
                    className={`font-semibold ${column.className || ''}`}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, rowIndex) => (
                <TableRow 
                  key={item.id || rowIndex}
                  className="hover:bg-surface-hover transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={colIndex}
                      className={column.className || ''}
                    >
                      {typeof column.accessor === 'function' 
                        ? column.accessor(item)
                        : item[column.accessor]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
