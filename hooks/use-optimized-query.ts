import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, optimisticUpdates } from '@/lib/react-query-config'

// Generic fetch function with error handling
async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Generic mutation function
async function mutateData<T>(url: string, data?: any, method: string = 'POST'): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Optimized hooks for common data fetching patterns

export function useItems(search?: string, filters?: Record<string, any>) {
  const queryKey = search ? queryKeys.itemSearch(search) : queryKeys.items
  const params = new URLSearchParams()
  
  if (search) params.append('search', search)
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value))
    })
  }

  return useQuery({
    queryKey: [...queryKey, filters],
    queryFn: () => fetchData(`/api/items?${params.toString()}`),
    staleTime: 2 * 60 * 1000, // 2 minutes for frequently changing data
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: queryKeys.item(id),
    queryFn: () => fetchData(`/api/items/${id}`),
    enabled: !!id,
  })
}

export function useInventoryLots(filters?: Record<string, any>) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value))
    })
  }

  return useQuery({
    queryKey: [...queryKeys.inventoryLots, filters],
    queryFn: () => fetchData(`/api/inventory/lots?${params.toString()}`),
    staleTime: 1 * 60 * 1000, // 1 minute for inventory data
  })
}

export function useOrders(filters?: Record<string, any>) {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value))
    })
  }

  return useQuery({
    queryKey: [...queryKeys.orders, filters],
    queryFn: () => fetchData(`/api/orders?${params.toString()}`),
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers,
    queryFn: () => fetchData('/api/suppliers'),
    staleTime: 10 * 60 * 1000, // 10 minutes for reference data
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => fetchData('/api/categories'),
    staleTime: 30 * 60 * 1000, // 30 minutes for reference data
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: () => fetchData('/api/departments'),
    staleTime: 30 * 60 * 1000,
  })
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => fetchData('/api/locations'),
    staleTime: 30 * 60 * 1000,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => fetchData('/api/analytics/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes for dashboard stats
  })
}

// Optimized mutation hooks with optimistic updates

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => mutateData('/api/items', data),
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.items })

      // Snapshot previous value
      const previousItems = queryClient.getQueryData(queryKeys.items)

      // Optimistically update
      const optimisticItem = { ...newItem, id: `temp-${Date.now()}` }
      optimisticUpdates.addItem(optimisticItem)

      return { previousItems }
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.items, context.previousItems)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
  })
}

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => mutateData(`/api/items/${id}`, data, 'PUT'),
    onMutate: async (updatedItem) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.item(id) })

      const previousItem = queryClient.getQueryData(queryKeys.item(id))

      optimisticUpdates.updateItem(id, (old: any) => ({ ...old, ...updatedItem }))

      return { previousItem }
    },
    onError: (err, updatedItem, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(queryKeys.item(id), context.previousItem)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.item(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
  })
}

export function useCreateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => mutateData('/api/receipts', data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLots })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
    },
  })
}

export function useConsumeInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => mutateData('/api/inventory/consumption', data),
    onSuccess: () => {
      // Invalidate inventory-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLots })
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats })
    },
  })
}
