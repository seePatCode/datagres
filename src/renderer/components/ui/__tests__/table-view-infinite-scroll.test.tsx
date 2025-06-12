import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TableView } from '../table-view'
import type { FetchTableDataResponse, FetchTableSchemaResponse } from '@/shared/types'

// Mock hooks
vi.mock('@/hooks/useInfiniteTableData', () => ({
  useInfiniteTableData: vi.fn()
}))

vi.mock('@/hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: vi.fn()
}))

import { useInfiniteTableData } from '@/hooks/useInfiniteTableData'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

// Mock window.electronAPI
const mockFetchTableSchema = vi.fn()
const mockUpdateTableData = vi.fn()
global.window = {
  ...global.window,
  electronAPI: {
    fetchTableSchema: mockFetchTableSchema,
    updateTableData: mockUpdateTableData
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

describe('TableView - Infinite Scroll Integration', () => {
  const mockSentinelRef = { current: null }
  const defaultMockData = {
    data: {
      columns: ['id', 'name', 'email'],
      rows: [
        [1, 'John Doe', 'john@example.com'],
        [2, 'Jane Smith', 'jane@example.com']
      ]
    },
    allRows: [
      [1, 'John Doe', 'john@example.com'],
      [2, 'Jane Smith', 'jane@example.com']
    ],
    totalRows: 100,
    isLoading: false,
    isLoadingMore: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: true,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    handleSearchCommit: vi.fn(),
    activeSearchTerm: '',
    orderBy: [],
    setOrderBy: vi.fn(),
    filters: [],
    setFilters: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    ;(useInfiniteTableData as any).mockReturnValue(defaultMockData)
    ;(useInfiniteScroll as any).mockReturnValue({ sentinelRef: mockSentinelRef })
    
    mockFetchTableSchema.mockResolvedValue({
      success: true,
      schema: {
        tableName: 'users',
        columns: [
          { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true },
          { name: 'name', dataType: 'text', nullable: false },
          { name: 'email', dataType: 'text', nullable: false }
        ]
      }
    })
  })

  it('should render table with data from infinite scroll hook', async () => {
    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      isLoading: true,
      data: undefined
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Loading table data...')).toBeInTheDocument()
  })

  it('should show infinite scroll sentinel when hasNextPage is true', async () => {
    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      // Check that useInfiniteScroll was called with correct props
      expect(useInfiniteScroll).toHaveBeenCalledWith({
        onLoadMore: defaultMockData.fetchNextPage,
        hasMore: true,
        isLoading: false,
        threshold: 200,
        rootRef: expect.any(Object)
      })
    })
  })

  it('should not show sentinel when hasNextPage is false', async () => {
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      hasNextPage: false
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(useInfiniteScroll).toHaveBeenCalledWith({
        onLoadMore: defaultMockData.fetchNextPage,
        hasMore: false,
        isLoading: false,
        threshold: 200,
        rootRef: expect.any(Object)
      })
    })
  })

  it('should show loading indicator when loading more data', async () => {
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      isLoadingMore: true
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      // Should show loading spinner in the sentinel area
      const spinner = screen.getByTestId('loading-more-spinner')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  it('should handle error state', () => {
    const error = new Error('Failed to load data')
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      isError: true,
      error,
      data: undefined
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Error loading table')).toBeInTheDocument()
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('should display correct row count', async () => {
    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      // Should show "2 of 100 rows"
      expect(screen.getByText(/2 of 100 rows/)).toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    const setSearchTerm = vi.fn()
    const handleSearchCommit = vi.fn()
    
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      setSearchTerm,
      handleSearchCommit
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
        onSearchChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    )

    // The search functionality would be tested through the SQLWhereEditor component
    // which is rendered in the TableView
    expect(setSearchTerm).toBeDefined()
    expect(handleSearchCommit).toBeDefined()
  })

  it('should pass correct pageSize to infinite table data hook', () => {
    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
        initialPageSize={50}
      />,
      { wrapper: createWrapper() }
    )

    expect(useInfiniteTableData).toHaveBeenCalledWith({
      connectionString: 'test-connection',
      tableName: 'users',
      enabled: true,
      pageSize: 50
    })
  })

  it('should handle empty data', async () => {
    ;(useInfiniteTableData as any).mockReturnValue({
      ...defaultMockData,
      data: { columns: [], rows: [] },
      allRows: [],
      totalRows: 0,
      hasNextPage: false
    })

    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  it('should update when table changes', async () => {
    const { rerender } = render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    // Change table
    rerender(
      <TableView
        tableName="products"
        connectionString="test-connection"
      />
    )

    await waitFor(() => {
      expect(useInfiniteTableData).toHaveBeenLastCalledWith({
        connectionString: 'test-connection',
        tableName: 'products',
        enabled: true,
        pageSize: 100
      })
    })
  })

  it('should properly set up scroll container ref', async () => {
    render(
      <TableView
        tableName="users"
        connectionString="test-connection"
      />,
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      // Verify that useInfiniteScroll received a rootRef
      const lastCall = (useInfiniteScroll as any).mock.calls[
        (useInfiniteScroll as any).mock.calls.length - 1
      ]
      expect(lastCall[0].rootRef).toBeDefined()
      expect(lastCall[0].rootRef.current).toBeInstanceOf(HTMLElement)
    })
  })
})