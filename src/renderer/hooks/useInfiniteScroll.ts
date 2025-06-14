import { useEffect, useRef, useCallback } from 'react'
import { INFINITE_SCROLL_THRESHOLD } from '@/constants'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number // Distance from bottom in pixels to trigger load
  rootRef?: React.RefObject<HTMLElement> // Reference to scrollable container
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = INFINITE_SCROLL_THRESHOLD,
  rootRef
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Set up observer when sentinel is ready
  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = rootRef?.current
    
    if (!sentinel) return

    // Small delay to ensure layout is complete
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && hasMore && !isLoading) {
              onLoadMore()
            }
          })
        },
        {
          root: root,
          rootMargin: `0px 0px ${threshold}px 0px`,
          threshold: 0.1
        }
      )

      if (sentinelRef.current) {
        observer.observe(sentinelRef.current)
      }

      return () => {
        observer.disconnect()
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [hasMore, isLoading, onLoadMore, threshold, rootRef])

  return { sentinelRef }
}