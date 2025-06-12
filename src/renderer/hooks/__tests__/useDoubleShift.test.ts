import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDoubleShift } from '../useDoubleShift'

describe('useDoubleShift', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should call onDoubleShift when shift is pressed twice within timeout', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // First shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).not.toHaveBeenCalled()

    // Second shift press within timeout
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })

  it('should not call onDoubleShift when shift presses are too far apart', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift, timeout: 300 }))

    // First shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    // Wait longer than timeout
    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Second shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).not.toHaveBeenCalled()
  })

  it('should reset count when non-shift key is pressed', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // First shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    // Non-shift key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'A' }))
    })

    // Two more shift presses should now be needed
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).not.toHaveBeenCalled()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })

  it('should handle custom timeout', () => {
    const onDoubleShift = vi.fn()
    const customTimeout = 500
    
    renderHook(() => useDoubleShift({ onDoubleShift, timeout: customTimeout }))

    // First shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    // Wait just under custom timeout
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Second shift press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })

  it('should handle triple shift press correctly', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // Three rapid shift presses
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    // Should only trigger once on the second press
    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })

  it('should cleanup event listeners on unmount', () => {
    const onDoubleShift = vi.fn()
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    const { unmount } = renderHook(() => useDoubleShift({ onDoubleShift }))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
  })

  it('should handle left and right shift keys', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // Mix of left and right shift
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftRight' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })

  it('should not interfere with shift key combinations', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // Shift + another key
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', shiftKey: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    // Should not trigger because 'A' was pressed
    expect(onDoubleShift).not.toHaveBeenCalled()
  })

  it('should handle rapid multiple double-shift sequences', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // First double-shift
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)

    // Second double-shift immediately after
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(2)
  })

  it('should work with different keyboard event properties', () => {
    const onDoubleShift = vi.fn()
    
    renderHook(() => useDoubleShift({ onDoubleShift }))

    // Test with different event properties
    act(() => {
      const event1 = new KeyboardEvent('keydown', { 
        key: 'Shift',
        keyCode: 16,
        which: 16
      })
      const event2 = new KeyboardEvent('keydown', { 
        key: 'Shift',
        keyCode: 16,
        which: 16
      })
      
      window.dispatchEvent(event1)
      window.dispatchEvent(event2)
    })

    expect(onDoubleShift).toHaveBeenCalledTimes(1)
  })
})