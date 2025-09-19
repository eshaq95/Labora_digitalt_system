'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  networkRequests: number
  cacheHitRate: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }))
        }
        
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          console.log('Navigation timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstPaint: navEntry.responseEnd - navEntry.requestStart,
          })
        }
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation'] })

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }))
      }
    }, 5000)

    return () => {
      observer.disconnect()
      clearInterval(memoryInterval)
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
        <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
        <div>Network: {metrics.networkRequests}</div>
        <div>Cache: {metrics.cacheHitRate.toFixed(1)}%</div>
      </div>
    </div>
  )
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // Warn if render takes longer than 16ms (60fps)
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`)
      }
      
      performance.mark(`${componentName}-render-end`)
      performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`)
    }
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    performance.mark(`${componentName}-render-start`)
  }, [componentName])
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const measureApiCall = (url: string, startTime: number, endTime: number) => {
    const duration = endTime - startTime
    
    if (duration > 1000) { // Warn if API call takes longer than 1 second
      console.warn(`API call to ${url} took ${duration.toFixed(2)}ms`)
    }
    
    // Track in performance timeline
    performance.mark(`api-${url}-end`)
    performance.measure(`api-${url}`, `api-${url}-start`, `api-${url}-end`)
  }

  const trackApiCall = async <T>(url: string, fetchFn: () => Promise<T>): Promise<T> => {
    const startTime = performance.now()
    performance.mark(`api-${url}-start`)
    
    try {
      const result = await fetchFn()
      const endTime = performance.now()
      measureApiCall(url, startTime, endTime)
      return result
    } catch (error) {
      const endTime = performance.now()
      measureApiCall(url, startTime, endTime)
      throw error
    }
  }

  return { trackApiCall }
}
