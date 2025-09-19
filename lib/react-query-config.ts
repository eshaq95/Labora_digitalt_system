import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { get, set, del } from 'idb-keyval'

// Create a custom persister using IndexedDB
const persister = {
  persistClient: async (client: any) => {
    await set('react-query-cache', client)
  },
  restoreClient: async () => {
    return await get('react-query-cache')
  },
  removeClient: async () => {
    await del('react-query-cache')
  },
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Enable background refetching
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
})

// Persist the query client
if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    buster: process.env.NODE_ENV === 'development' ? Date.now().toString() : '',
  })
}

// Query keys for consistent caching
export const queryKeys = {
  // Items
  items: ['items'] as const,
  item: (id: string) => ['items', id] as const,
  itemSearch: (search: string) => ['items', 'search', search] as const,
  
  // Inventory
  inventory: ['inventory'] as const,
  inventoryLots: ['inventory', 'lots'] as const,
  inventoryLot: (id: string) => ['inventory', 'lots', id] as const,
  
  // Orders
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  
  // Receipts
  receipts: ['receipts'] as const,
  receipt: (id: string) => ['receipts', id] as const,
  
  // Suppliers
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  
  // Categories
  categories: ['categories'] as const,
  
  // Departments
  departments: ['departments'] as const,
  
  // Locations
  locations: ['locations'] as const,
  
  // Users
  users: ['users'] as const,
  currentUser: ['users', 'current'] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  lowStockAlerts: ['analytics', 'low-stock'] as const,
  dashboardStats: ['analytics', 'dashboard'] as const,
} as const

// Optimistic update helpers
export const optimisticUpdates = {
  // Update item in cache after mutation
  updateItem: (id: string, updater: (old: any) => any) => {
    queryClient.setQueryData(queryKeys.item(id), updater)
    queryClient.invalidateQueries({ queryKey: queryKeys.items })
  },
  
  // Add new item to cache
  addItem: (newItem: any) => {
    queryClient.setQueryData(queryKeys.item(newItem.id), newItem)
    queryClient.setQueryData(queryKeys.items, (old: any) => {
      if (!old) return [newItem]
      return [newItem, ...old]
    })
  },
  
  // Remove item from cache
  removeItem: (id: string) => {
    queryClient.removeQueries({ queryKey: queryKeys.item(id) })
    queryClient.setQueryData(queryKeys.items, (old: any) => {
      if (!old) return []
      return old.filter((item: any) => item.id !== id)
    })
  },
  
  // Update inventory lot
  updateInventoryLot: (id: string, updater: (old: any) => any) => {
    queryClient.setQueryData(queryKeys.inventoryLot(id), updater)
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLots })
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory })
  },
}

// Prefetch helpers for better UX
export const prefetchHelpers = {
  // Prefetch item details when hovering over item list
  prefetchItem: (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.item(id),
      queryFn: () => fetch(`/api/items/${id}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  },
  
  // Prefetch related data
  prefetchRelatedData: () => {
    // Prefetch commonly used reference data
    queryClient.prefetchQuery({
      queryKey: queryKeys.categories,
      queryFn: () => fetch('/api/categories').then(res => res.json()),
      staleTime: 30 * 60 * 1000, // Categories change infrequently
    })
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.departments,
      queryFn: () => fetch('/api/departments').then(res => res.json()),
      staleTime: 30 * 60 * 1000,
    })
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.locations,
      queryFn: () => fetch('/api/locations').then(res => res.json()),
      staleTime: 30 * 60 * 1000,
    })
  },
}
