'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number // Distance from bottom in pixels
  rootMargin?: string
}

export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 500, rootMargin = '0px' } = options
  const [isFetching, setIsFetching] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries

      if (entry.isIntersecting && !isFetching) {
        setIsFetching(true)
        callback()
      }
    },
    [callback, isFetching]
  )

  useEffect(() => {
    const options = {
      root: null,
      rootMargin,
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver(handleIntersection, options)

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, rootMargin])

  const reset = useCallback(() => {
    setIsFetching(false)
  }, [])

  return { loadMoreRef, isFetching, reset }
}
