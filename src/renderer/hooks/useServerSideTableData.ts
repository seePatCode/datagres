import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SearchOptions, FetchTableDataResponse } from '@/shared/types'

interface UseServerSideTableDataOptions {
  connectionString: string
  tableName: string
  pageSize?: number
  enabled?: boolean
}

interface UseServerSideTableDataReturn {
  data: FetchTableDataResponse['data'] | undefined
  totalRows: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  // Search state
  searchTerm: string // The input value
  setSearchTerm: (term: string) => void
  handleSearchCommit: () => void
  activeSearchTerm: string // The committed search term being used
  // Pagination state
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  // Sorting state
  orderBy: SearchOptions['orderBy']
  setOrderBy: (orderBy: SearchOptions['orderBy']) => void
  // Filter state
  filters: SearchOptions['filters']
  setFilters: (filters: SearchOptions['filters']) => void
}

export function useServerSideTableData({
  connectionString,
  tableName,
  pageSize: initialPageSize = 100,
  enabled = true
}: UseServerSideTableDataOptions): UseServerSideTableDataReturn {
  // Search state - searchInput is what user types, searchTerm is what we search with
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // Only updated on Enter
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  
  // Sorting state
  const [orderBy, setOrderBy] = useState<SearchOptions['orderBy']>([])
  
  // Filter state
  const [filters, setFilters] = useState<SearchOptions['filters']>([])
  
  // Build search options
  const searchOptions = useMemo<SearchOptions>(() => ({
    searchTerm: searchTerm, // Use committed search term, not input
    filters,
    orderBy,
    page,
    pageSize
  }), [searchTerm, filters, orderBy, page, pageSize])
  
  // Fetch table data with search options
  const query = useQuery({
    queryKey: ['server-side-table-data', tableName, connectionString, searchOptions],
    queryFn: async () => {
      const result = await window.electronAPI.fetchTableData(
        connectionString,
        tableName,
        searchOptions
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch table data')
      }
      
      return result
    },
    enabled: enabled && !!connectionString && !!tableName,
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
  
  // Calculate pagination info
  const totalRows = query.data?.totalRows || 0
  const totalPages = Math.ceil(totalRows / pageSize)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1
  
  // Update search input as user types
  const handleSearchInputChange = (input: string) => {
    setSearchInput(input)
  }
  
  // Commit search on Enter key
  const handleSearchCommit = () => {
    if (searchInput !== searchTerm) {
      setSearchTerm(searchInput)
      setPage(1) // Reset to first page on new search
    }
  }
  
  // Reset page when filters change
  const handleFiltersChange = (newFilters: SearchOptions['filters']) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page on filter change
  }
  
  // Reset page when page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1) // Reset to first page when page size changes
  }
  
  return {
    data: query.data?.data,
    totalRows,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    // Search state
    searchTerm: searchInput, // Return the input value for display
    setSearchTerm: handleSearchInputChange, // Update input as user types
    handleSearchCommit, // Commit search on Enter
    activeSearchTerm: searchTerm, // The committed search term
    // Pagination state
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    // Sorting state
    orderBy,
    setOrderBy,
    // Filter state
    filters,
    setFilters: handleFiltersChange
  }
}