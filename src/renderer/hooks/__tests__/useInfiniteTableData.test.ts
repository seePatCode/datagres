import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInfiniteTableData } from '../useInfiniteTableData'
import type { FetchTableDataResponse } from '@/shared/types'

// Mock window.electronAPI
const mockFetchTableData = vi.fn()
global.window = {
  ...global.window,
  electronAPI: {
    fetchTableData: mockFetchTableData
  }
} as any

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => {
    const Provider = QueryClientProvider as any
    return React.createElement(Provider, { client: queryClient }, children)
  }
}

describe('useInfiniteTableData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch initial page of data', async () => {
    const mockResponse: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John'], [2, 'Jane']]
      },
      totalRows: 100,
      page: 1,
      pageSize: 100
    }

    mockFetchTableData.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users',
        pageSize: 100
      }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchTableData).toHaveBeenCalledWith(
      'test-connection',
      'users',
      {
        searchTerm: '',
        filters: [],
        orderBy: [],
        page: 1,
        pageSize: 100
      }
    )

    expect(result.current.data).toEqual({
      columns: ['id', 'name'],
      rows: [[1, 'John'], [2, 'Jane']]
    })
    expect(result.current.totalRows).toBe(100)
    expect(result.current.allRows).toEqual([[1, 'John'], [2, 'Jane']])
  })

  it('should fetch next page when fetchNextPage is called', async () => {
    const mockResponse1: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John'], [2, 'Jane']]
      },
      totalRows: 4,
      page: 1,
      pageSize: 2
    }

    const mockResponse2: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[3, 'Bob'], [4, 'Alice']]
      },
      totalRows: 4,
      page: 2,
      pageSize: 2
    }

    mockFetchTableData
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users',
        pageSize: 2
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasNextPage).toBe(true)

    // Fetch next page
    result.current.fetchNextPage()

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false)
    })

    expect(mockFetchTableData).toHaveBeenCalledTimes(2)
    expect(result.current.allRows).toEqual([
      [1, 'John'],
      [2, 'Jane'],
      [3, 'Bob'],
      [4, 'Alice']
    ])
  })

  it('should handle search term changes', async () => {
    const mockResponse: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John']]
      },
      totalRows: 1,
      page: 1,
      pageSize: 100
    }

    mockFetchTableData.mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users'
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Update search term
    result.current.setSearchTerm('John')
    expect(result.current.searchTerm).toBe('John')
    expect(result.current.activeSearchTerm).toBe('')

    // Commit search
    result.current.handleSearchCommit()
    
    await waitFor(() => {
      expect(result.current.activeSearchTerm).toBe('John')
    })

    expect(mockFetchTableData).toHaveBeenLastCalledWith(
      'test-connection',
      'users',
      expect.objectContaining({
        searchTerm: 'John'
      })
    )
  })

  it('should handle sorting changes', async () => {
    const mockResponse: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John']]
      },
      totalRows: 1,
      page: 1,
      pageSize: 100
    }

    mockFetchTableData.mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users'
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Update order by
    result.current.setOrderBy([{ column: 'name', direction: 'asc' }])

    await waitFor(() => {
      expect(mockFetchTableData).toHaveBeenLastCalledWith(
        'test-connection',
        'users',
        expect.objectContaining({
          orderBy: [{ column: 'name', direction: 'asc' }]
        })
      )
    })
  })

  it('should handle filter changes', async () => {
    const mockResponse: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John']]
      },
      totalRows: 1,
      page: 1,
      pageSize: 100
    }

    mockFetchTableData.mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users'
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Update filters
    result.current.setFilters([
      { column: 'name', operator: 'like', value: '%John%' }
    ])

    await waitFor(() => {
      expect(mockFetchTableData).toHaveBeenLastCalledWith(
        'test-connection',
        'users',
        expect.objectContaining({
          filters: [{ column: 'name', operator: 'like', value: '%John%' }]
        })
      )
    })
  })

  it('should handle API errors', async () => {
    const mockError = new Error('Database connection failed')
    mockFetchTableData.mockRejectedValueOnce(mockError)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users'
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(mockError)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle unsuccessful API responses', async () => {
    mockFetchTableData.mockResolvedValueOnce({
      success: false,
      error: 'Table not found'
    })

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'nonexistent'
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Table not found')
  })

  it('should not fetch when disabled', () => {
    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users',
        enabled: false
      }),
      { wrapper: createWrapper() }
    )

    expect(mockFetchTableData).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('should correctly determine hasNextPage', async () => {
    const mockResponse: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John'], [2, 'Jane']]
      },
      totalRows: 2,
      page: 1,
      pageSize: 2
    }

    mockFetchTableData.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users',
        pageSize: 2
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should not have next page when all data is loaded
    expect(result.current.hasNextPage).toBe(false)
  })

  it('should combine data from multiple pages correctly', async () => {
    const mockResponse1: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[1, 'John'], [2, 'Jane']]
      },
      totalRows: 3,
      page: 1,
      pageSize: 2
    }

    const mockResponse2: FetchTableDataResponse = {
      success: true,
      data: {
        columns: ['id', 'name'],
        rows: [[3, 'Bob']]
      },
      totalRows: 3,
      page: 2,
      pageSize: 2
    }

    mockFetchTableData
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2)

    const { result } = renderHook(
      () => useInfiniteTableData({
        connectionString: 'test-connection',
        tableName: 'users',
        pageSize: 2
      }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    result.current.fetchNextPage()

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false)
    })

    expect(result.current.data).toEqual({
      columns: ['id', 'name'],
      rows: [[1, 'John'], [2, 'Jane'], [3, 'Bob']]
    })
  })
})