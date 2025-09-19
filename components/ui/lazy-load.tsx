'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface LazyLoadProps {
  children: ReactNode
  height?: number
  className?: string
  threshold?: number
  placeholder?: ReactNode
}

export function LazyLoad({ 
  children, 
  height = 200, 
  className = '', 
  threshold = 0.1,
  placeholder 
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setHasLoaded(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  const defaultPlaceholder = (
    <div 
      className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse"
      style={{ height }}
    >
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {hasLoaded ? children : (placeholder || defaultPlaceholder)}
    </div>
  )
}

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
}

export function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  placeholder 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setIsLoaded(true)
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
        >
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          )}
        </div>
      )}
      
      {isInView && (
        <img
          src={error ? '/images/placeholder.png' : src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}

// Hook for lazy loading data
export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  threshold: number = 0.1
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  useEffect(() => {
    if (!shouldLoad || data) return

    setLoading(true)
    setError(null)

    fetchFn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [shouldLoad, fetchFn, data])

  return { ref, data, loading, error }
}
