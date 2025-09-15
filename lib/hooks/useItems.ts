import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Item = {
  id: string
  sku: string
  name: string
  description?: string
  manufacturer?: string
  unit: string
  orderUnit?: string
  conversionFactor?: number
  minStock: number
  maxStock?: number
  currentStock: number
  salesPrice?: number
  requiresLotNumber: boolean
  expiryTracking: boolean
  hazardous: boolean
  storageTemp?: string
  notes?: string
  hmsCodes?: string
  defaultLocationId?: string
  department?: { name: string }
  category?: { name: string }
  defaultLocation?: { name: string }
}

export type ItemsResponse = {
  items: Item[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type ItemsFilters = {
  page?: number
  limit?: number
  search?: string
  category?: string
  department?: string
}

// Fetch items with pagination and filtering
async function fetchItems(filters: ItemsFilters = {}): Promise<ItemsResponse> {
  const params = new URLSearchParams()
  
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.limit) params.set('limit', filters.limit.toString())
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.department) params.set('department', filters.department)
  
  const response = await fetch(`/api/items?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch items')
  }
  
  return response.json()
}

// Fetch single item
async function fetchItem(id: string): Promise<Item> {
  const response = await fetch(`/api/items/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch item')
  }
  return response.json()
}

// Create item
async function createItem(item: Partial<Item>): Promise<Item> {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!response.ok) {
    throw new Error('Failed to create item')
  }
  return response.json()
}

// Update item
async function updateItem({ id, ...item }: Partial<Item> & { id: string }): Promise<Item> {
  const response = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!response.ok) {
    throw new Error('Failed to update item')
  }
  return response.json()
}

// Delete item
async function deleteItem(id: string): Promise<void> {
  const response = await fetch(`/api/items/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete item')
  }
}

// Hook to fetch items with caching
export function useItems(filters: ItemsFilters = {}) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => fetchItems(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for items (they change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  })
}

// Hook to fetch single item
export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => fetchItem(id),
    enabled: !!id, // Only run if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes for single item
  })
}

// Hook to create item with optimistic updates
export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createItem,
    onSuccess: (newItem) => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: ['items'] })
      
      // Add the new item to the cache
      queryClient.setQueryData(['items', newItem.id], newItem)
    },
  })
}

// Hook to update item with optimistic updates
export function useUpdateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateItem,
    onMutate: async (updatedItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['items', updatedItem.id] })
      
      // Snapshot previous value
      const previousItem = queryClient.getQueryData(['items', updatedItem.id])
      
      // Optimistically update
      queryClient.setQueryData(['items', updatedItem.id], updatedItem)
      
      return { previousItem }
    },
    onError: (err, updatedItem, context) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(['items', updatedItem.id], context.previousItem)
      }
    },
    onSuccess: (updatedItem) => {
      // Invalidate items list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

// Hook to delete item
export function useDeleteItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['items', deletedId] })
      
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
