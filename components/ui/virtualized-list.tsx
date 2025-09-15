import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

interface VirtualizedListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
  className?: string
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  className = ''
}: VirtualizedListProps<T>) {
  // Calculate total item count including loading placeholder
  const itemCount = hasNextPage ? items.length + 1 : items.length
  
  // Check if an item is loaded
  const isItemLoaded = (index: number) => !!items[index]
  
  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => items, [items])
  
  // Render function that handles loading states
  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    // Show loading placeholder for unloaded items
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Laster flere...</span>
        </div>
      )
    }
    
    // Render actual item
    return renderItem({ index, style, data: itemData })
  }
  
  // If infinite loading is enabled
  if (hasNextPage && loadNextPage) {
    return (
      <div className={className}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadNextPage}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={height}
              itemCount={itemCount}
              itemSize={itemHeight}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
            >
              {ItemRenderer}
            </List>
          )}
        </InfiniteLoader>
      </div>
    )
  }
  
  // Simple virtualized list without infinite loading
  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
      >
        {ItemRenderer}
      </List>
    </div>
  )
}

// Specialized component for table rows
interface VirtualizedTableProps<T> {
  items: T[]
  height: number
  rowHeight: number
  renderRow: (item: T, index: number, style: React.CSSProperties) => React.ReactElement
  hasNextPage?: boolean
  isNextPageLoading?: boolean
  loadNextPage?: () => Promise<void>
  className?: string
}

export function VirtualizedTable<T>({
  items,
  height,
  rowHeight,
  renderRow,
  hasNextPage,
  isNextPageLoading,
  loadNextPage,
  className
}: VirtualizedTableProps<T>) {
  const renderItem = ({ index, style, data }: { index: number; style: React.CSSProperties; data: T[] }) => {
    const item = data[index]
    return renderRow(item, index, style)
  }
  
  return (
    <VirtualizedList
      items={items}
      height={height}
      itemHeight={rowHeight}
      renderItem={renderItem}
      hasNextPage={hasNextPage}
      isNextPageLoading={isNextPageLoading}
      loadNextPage={loadNextPage}
      className={className}
    />
  )
}

// Hook for calculating optimal virtualization settings
export function useVirtualization(containerRef: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })
  
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [containerRef])
  
  return dimensions
}
