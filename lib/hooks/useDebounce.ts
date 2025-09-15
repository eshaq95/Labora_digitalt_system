import { useState, useEffect, useCallback } from 'react'

// Generic debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Specialized hook for search inputs
export function useDebouncedSearch(initialValue: string = '', delay: number = 300) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const debouncedValue = useDebounce(searchValue, delay)

  const clearSearch = useCallback(() => {
    setSearchValue('')
  }, [])

  return {
    searchValue,
    debouncedValue,
    setSearchValue,
    clearSearch,
    isSearching: searchValue !== debouncedValue
  }
}

// Hook for debounced API calls
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const newTimer = setTimeout(() => {
        callback(...args)
      }, delay)

      setDebounceTimer(newTimer)
    }) as T,
    [callback, delay, debounceTimer]
  )

  const cancel = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [debounceTimer])

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return [debouncedCallback, cancel]
}

// Hook for debounced state updates with immediate UI feedback
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void, boolean] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(immediateValue, delay)
  const isPending = immediateValue !== debouncedValue

  return [immediateValue, debouncedValue, setImmediateValue, isPending]
}

// Hook for search with loading state
export function useDebouncedSearchWithLoading(
  searchFn: (query: string) => Promise<any>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    searchFn(debouncedQuery)
      .then((data) => {
        setResults(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Search failed')
        setResults([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [debouncedQuery, searchFn])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    isSearching: query !== debouncedQuery
  }
}