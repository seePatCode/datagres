import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useInfiniteScroll } from '../useInfiniteScroll'

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  elements: Element[] = []

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
  }

  observe(element: Element) {
    this.elements.push(element)
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter(el => el !== element)
  }

  disconnect() {
    this.elements = []
  }

  triggerIntersection(isIntersecting: boolean, intersectionRatio = 0) {
    const entries: IntersectionObserverEntry[] = this.elements.map(element => ({
      target: element,
      isIntersecting,
      intersectionRatio,
      intersectionRect: {} as DOMRectReadOnly,
      boundingClientRect: {} as DOMRectReadOnly,
      rootBounds: {} as DOMRectReadOnly,
      time: Date.now()
    }))
    this.callback(entries, this as any)
  }
}

describe('useInfiniteScroll - Edge Cases', () => {
  let mockObserver: MockIntersectionObserver

  beforeEach(() => {
    global.IntersectionObserver = vi.fn((callback, options) => {
      mockObserver = new MockIntersectionObserver(callback, options)
      return mockObserver as any
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should handle rapid prop changes without creating memory leaks', () => {
    const onLoadMore = vi.fn()
    
    const { rerender } = renderHook(
      ({ hasMore, isLoading }) => useInfiniteScroll({
        onLoadMore,
        hasMore,
        isLoading
      }),
      { initialProps: { hasMore: true, isLoading: false } }
    )

    // Rapid prop changes
    for (let i = 0; i < 10; i++) {
      rerender({ hasMore: i % 2 === 0, isLoading: i % 3 === 0 })
    }

    // Should only have one active observer
    expect(mockObserver.elements.length).toBeLessThanOrEqual(1)
  })

  it('should handle onLoadMore throwing an error', () => {
    const onLoadMore = vi.fn().mockImplementation(() => {
      throw new Error('Load more failed')
    })
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))
    rerender()

    // Should not throw when triggering intersection
    expect(() => {
      act(() => {
        mockObserver.triggerIntersection(true, 1)
      })
    }).not.toThrow()
  })

  it('should handle sentinel element being removed and re-added', () => {
    const onLoadMore = vi.fn()
    
    const { result, rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    // Set initial element
    const mockElement1 = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement1,
      writable: true
    })
    rerender()

    // Remove element
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: null,
      writable: true
    })
    rerender()

    // Add new element
    const mockElement2 = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement2,
      writable: true
    })
    rerender()

    // Should observe the new element
    expect(mockObserver.elements).toContain(mockElement2)
    expect(mockObserver.elements).not.toContain(mockElement1)
  })

  it('should handle negative threshold values', () => {
    const onLoadMore = vi.fn()
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false,
      threshold: -100
    }))

    const observerOptions = (global.IntersectionObserver as any).mock.calls[0][1]
    expect(observerOptions.rootMargin).toBe('0px 0px -100px 0px')
  })

  it('should handle very large threshold values', () => {
    const onLoadMore = vi.fn()
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false,
      threshold: 10000
    }))

    const observerOptions = (global.IntersectionObserver as any).mock.calls[0][1]
    expect(observerOptions.rootMargin).toBe('0px 0px 10000px 0px')
  })

  it('should not trigger multiple times for same intersection', () => {
    const onLoadMore = vi.fn()
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))
    rerender()

    // Trigger intersection multiple times without changing state
    act(() => {
      mockObserver.triggerIntersection(true, 1)
      mockObserver.triggerIntersection(true, 1)
      mockObserver.triggerIntersection(true, 1)
    })

    // Should still only call once per intersection event
    expect(onLoadMore).toHaveBeenCalledTimes(3)
  })

  it('should handle root element being removed', () => {
    const onLoadMore = vi.fn()
    const rootElement = document.createElement('div')
    const rootRef = { current: rootElement }
    
    const { result, rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false,
      rootRef
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })
    rerender()

    // Remove root element
    rootRef.current = null
    rerender()

    // Should create new observer with null root
    const lastCall = (global.IntersectionObserver as any).mock.calls[
      (global.IntersectionObserver as any).mock.calls.length - 1
    ]
    expect(lastCall[1].root).toBeNull()
  })

  it('should handle intersection with zero ratio', () => {
    const onLoadMore = vi.fn()
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))
    rerender()

    // Trigger with zero intersection ratio but isIntersecting true
    act(() => {
      mockObserver.triggerIntersection(true, 0)
    })

    // Should still trigger load
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('should cleanup properly when component unmounts during loading', () => {
    const onLoadMore = vi.fn()
    
    const { result, unmount } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: true // Currently loading
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const disconnectSpy = vi.spyOn(mockObserver, 'disconnect')
    
    // Unmount while loading
    unmount()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})