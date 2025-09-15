import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface OptimisticAction<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  timestamp: number
}

export function useOptimisticUpdates<T>(queryKey: string[]) {
  const queryClient = useQueryClient()
  const [pendingActions, setPendingActions] = useState<OptimisticAction<T>[]>([])

  // Add optimistic update
  const addOptimisticUpdate = useCallback((action: Omit<OptimisticAction<T>, 'timestamp'>) => {
    const optimisticAction: OptimisticAction<T> = {
      ...action,
      timestamp: Date.now()
    }
    
    setPendingActions(prev => [...prev, optimisticAction])
    
    // Apply optimistic update to cache
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData
      
      switch (action.type) {
        case 'create':
          if (Array.isArray(oldData)) {
            return [action.data, ...oldData]
          } else if (oldData.items) {
            return {
              ...oldData,
              items: [action.data, ...oldData.items]
            }
          }
          return oldData
          
        case 'update':
          if (Array.isArray(oldData)) {
            return oldData.map(item => 
              (item as any).id === (action.data as any).id ? action.data : item
            )
          } else if (oldData.items) {
            return {
              ...oldData,
              items: oldData.items.map((item: any) => 
                item.id === (action.data as any).id ? action.data : item
              )
            }
          }
          return oldData
          
        case 'delete':
          if (Array.isArray(oldData)) {
            return oldData.filter(item => (item as any).id !== (action.data as any).id)
          } else if (oldData.items) {
            return {
              ...oldData,
              items: oldData.items.filter((item: any) => item.id !== (action.data as any).id)
            }
          }
          return oldData
          
        default:
          return oldData
      }
    })
    
    return optimisticAction.id
  }, [queryClient, queryKey])

  // Remove optimistic update (on success)
  const removeOptimisticUpdate = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== actionId))
  }, [])

  // Rollback optimistic update (on error)
  const rollbackOptimisticUpdate = useCallback((actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId)
    if (!action) return

    // Remove from pending actions
    setPendingActions(prev => prev.filter(a => a.id !== actionId))
    
    // Invalidate and refetch to get correct data
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey, pendingActions])

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([])
  }, [])

  return {
    pendingActions,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    rollbackOptimisticUpdate,
    clearPendingActions
  }
}

// Hook for optimistic status updates (common pattern)
export function useOptimisticStatus<T extends { id: string; status: string }>(
  queryKey: string[],
  updateStatusFn: (id: string, status: string) => Promise<T>
) {
  const { addOptimisticUpdate, removeOptimisticUpdate, rollbackOptimisticUpdate } = useOptimisticUpdates<T>(queryKey)

  const updateStatus = useCallback(async (item: T, newStatus: string) => {
    const optimisticItem = { ...item, status: newStatus }
    const actionId = addOptimisticUpdate({
      id: `status-${item.id}-${Date.now()}`,
      type: 'update',
      data: optimisticItem
    })

    try {
      const updatedItem = await updateStatusFn(item.id, newStatus)
      removeOptimisticUpdate(actionId)
      return updatedItem
    } catch (error) {
      rollbackOptimisticUpdate(actionId)
      throw error
    }
  }, [addOptimisticUpdate, removeOptimisticUpdate, rollbackOptimisticUpdate, updateStatusFn])

  return { updateStatus }
}

// Hook for optimistic quantity updates (inventory specific)
export function useOptimisticQuantity<T extends { id: string; quantity: number }>(
  queryKey: string[],
  updateQuantityFn: (id: string, quantity: number) => Promise<T>
) {
  const { addOptimisticUpdate, removeOptimisticUpdate, rollbackOptimisticUpdate } = useOptimisticUpdates<T>(queryKey)

  const updateQuantity = useCallback(async (item: T, newQuantity: number) => {
    const optimisticItem = { ...item, quantity: newQuantity }
    const actionId = addOptimisticUpdate({
      id: `quantity-${item.id}-${Date.now()}`,
      type: 'update',
      data: optimisticItem
    })

    try {
      const updatedItem = await updateQuantityFn(item.id, newQuantity)
      removeOptimisticUpdate(actionId)
      return updatedItem
    } catch (error) {
      rollbackOptimisticUpdate(actionId)
      throw error
    }
  }, [addOptimisticUpdate, removeOptimisticUpdate, rollbackOptimisticUpdate, updateQuantityFn])

  return { updateQuantity }
}

// Toast notifications for optimistic updates
export function useOptimisticToast() {
  const showOptimisticToast = useCallback((
    action: 'create' | 'update' | 'delete',
    entityName: string,
    promise: Promise<any>
  ) => {
    const messages = {
      create: {
        loading: `Oppretter ${entityName}...`,
        success: `${entityName} opprettet`,
        error: `Kunne ikke opprette ${entityName}`
      },
      update: {
        loading: `Oppdaterer ${entityName}...`,
        success: `${entityName} oppdatert`,
        error: `Kunne ikke oppdatere ${entityName}`
      },
      delete: {
        loading: `Sletter ${entityName}...`,
        success: `${entityName} slettet`,
        error: `Kunne ikke slette ${entityName}`
      }
    }

    // Show immediate feedback
    const message = messages[action]
    
    // Handle promise result
    promise
      .then(() => {
        // Success toast (optional, since UI already updated optimistically)
        console.log(message.success)
      })
      .catch((error) => {
        // Error toast (important to show)
        console.error(message.error, error)
      })
  }, [])

  return { showOptimisticToast }
}
