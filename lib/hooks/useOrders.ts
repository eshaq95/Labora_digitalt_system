import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Order = {
  id: string
  orderNumber: string
  supplierId: string
  supplier?: { name: string }
  requester?: { name: string; email: string }
  requestedBy: string
  status: 'REQUESTED' | 'APPROVED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requestedDate: string
  expectedDate?: string
  notes?: string
  lines: {
    quantityOrdered: number
    unitPrice?: number
    item: { name: string; sku: string }
    requestedDepartment?: { name: string }
  }[]
  createdAt?: string
}

export type OrdersResponse = {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type OrdersFilters = {
  page?: number
  limit?: number
  status?: string
}

// Fetch orders with pagination and filtering
async function fetchOrders(filters: OrdersFilters = {}): Promise<OrdersResponse> {
  const params = new URLSearchParams()
  
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.limit) params.set('limit', filters.limit.toString())
  if (filters.status) params.set('status', filters.status)
  
  const response = await fetch(`/api/orders?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  return response.json()
}

// Fetch single order
async function fetchOrder(id: string): Promise<Order> {
  const response = await fetch(`/api/orders/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch order')
  }
  return response.json()
}

// Create order
async function createOrder(order: Partial<Order>): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!response.ok) {
    throw new Error('Failed to create order')
  }
  return response.json()
}

// Update order status
async function updateOrderStatus({ id, status }: { id: string; status: string }): Promise<Order> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error('Failed to update order status')
  }
  return response.json()
}

// Hook to fetch orders with caching
export function useOrders(filters: OrdersFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 1 * 60 * 1000, // 1 minute for orders (they change frequently)
    gcTime: 3 * 60 * 1000, // 3 minutes cache time
  })
}

// Hook to fetch single order
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes for single order
  })
}

// Hook to create order
export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (newOrder) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      // Add to cache
      queryClient.setQueryData(['orders', newOrder.id], newOrder)
    },
  })
}

// Hook to update order status with optimistic updates
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateOrderStatus,
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders', id] })
      
      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(['orders', id])
      
      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(['orders', id], {
          ...previousOrder,
          status
        })
      }
      
      return { previousOrder }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(['orders', id], context.previousOrder)
      }
    },
    onSuccess: (updatedOrder) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
