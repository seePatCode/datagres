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

  // Helper to trigger intersection
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

describe('useInfiniteScroll', () => {
  let mockObserver: MockIntersectionObserver
  let observerInstances: MockIntersectionObserver[] = []

  beforeEach(() => {
    observerInstances = []
    global.IntersectionObserver = vi.fn((callback, options) => {
      mockObserver = new MockIntersectionObserver(callback, options)
      observerInstances.push(mockObserver)
      return mockObserver as any
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create an intersection observer on mount', () => {
    const onLoadMore = vi.fn()
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1)
  })

  it('should call onLoadMore when sentinel becomes visible and hasMore is true', () => {
    const onLoadMore = vi.fn()
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    // Create a mock element and assign it to the ref
    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    // Re-render to trigger effect with the element
    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))
    rerender()

    // Trigger intersection
    act(() => {
      mockObserver.triggerIntersection(true, 1)
    })

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('should not call onLoadMore when isLoading is true', () => {
    const onLoadMore = vi.fn()
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: true
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: true
    }))
    rerender()

    act(() => {
      mockObserver.triggerIntersection(true, 1)
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn()
    
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: false,
      isLoading: false
    }))

    const mockElement = document.createElement('div')
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: mockElement,
      writable: true
    })

    const { rerender } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: false,
      isLoading: false
    }))
    rerender()

    act(() => {
      mockObserver.triggerIntersection(true, 1)
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when sentinel is not intersecting', () => {
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

    act(() => {
      mockObserver.triggerIntersection(false, 0)
    })

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should use custom threshold in rootMargin', () => {
    const onLoadMore = vi.fn()
    const customThreshold = 500
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false,
      threshold: customThreshold
    }))

    const observerOptions = (global.IntersectionObserver as any).mock.calls[0][1]
    expect(observerOptions.rootMargin).toBe(`0px 0px ${customThreshold}px 0px`)
  })

  it('should use provided root element', () => {
    const onLoadMore = vi.fn()
    const rootElement = document.createElement('div')
    const rootRef = { current: rootElement }
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false,
      rootRef
    }))

    const observerOptions = (global.IntersectionObserver as any).mock.calls[0][1]
    expect(observerOptions.root).toBe(rootElement)
  })

  it('should disconnect observer on unmount', () => {
    const onLoadMore = vi.fn()
    
    const { unmount } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: false
    }))

    const disconnectSpy = vi.spyOn(mockObserver, 'disconnect')
    
    unmount()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should re-create observer when dependencies change', () => {
    const onLoadMore = vi.fn()
    
    const { rerender } = renderHook(
      ({ hasMore }) => useInfiniteScroll({
        onLoadMore,
        hasMore,
        isLoading: false
      }),
      { initialProps: { hasMore: true } }
    )

    expect(global.IntersectionObserver).toHaveBeenCalledTimes(1)

    // Change hasMore prop
    rerender({ hasMore: false })

    // Should create a new observer
    expect(global.IntersectionObserver).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple intersection entries', () => {
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

    // Observe multiple elements
    const mockElement2 = document.createElement('div')
    mockObserver.observe(mockElement2)

    act(() => {
      mockObserver.triggerIntersection(true, 1)
    })

    // Should still only call onLoadMore once per intersection event
    expect(onLoadMore).toHaveBeenCalledTimes(2) // Once for each element
  })
})