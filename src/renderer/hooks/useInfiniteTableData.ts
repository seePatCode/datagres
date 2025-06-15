import { useState, useMemo, useCallback, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { SearchOptions, FetchTableDataResponse } from '@/shared/types'

interface UseInfiniteTableDataOptions {
  connectionString: string
  tableName: string
  pageSize?: number
  enabled?: boolean
}

interface UseInfiniteTableDataReturn {
  data: FetchTableDataResponse['data'] | undefined
  allRows: any[][]
  totalRows: number
  isLoading: boolean
  isLoadingMore: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  fetchNextPage: () => void
  hasNextPage: boolean
  // Search state
  searchTerm: string
  setSearchTerm: (term: string) => void
  handleSearchCommit: () => void
  activeSearchTerm: string
  // Sorting state
  orderBy: SearchOptions['orderBy']
  setOrderBy: (orderBy: SearchOptions['orderBy']) => void
  // Filter state
  filters: SearchOptions['filters']
  setFilters: (filters: SearchOptions['filters']) => void
}

export function useInfiniteTableData({
  connectionString,
  tableName,
  pageSize: initialPageSize = 100,
  enabled = true
}: UseInfiniteTableDataOptions): UseInfiniteTableDataReturn {
  // Search state
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef(searchInput)
  const searchTermRef = useRef(searchTerm)
  
  // Sorting state
  const [orderBy, setOrderBy] = useState<SearchOptions['orderBy']>([])
  
  // Filter state
  const [filters, setFilters] = useState<SearchOptions['filters']>([])
  
  // Fetch table data with infinite query
  const query = useInfiniteQuery({
    queryKey: ['infinite-table-data', tableName, connectionString, searchTerm, filters, orderBy],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const searchOptions: SearchOptions = {
        searchTerm,
        filters,
        orderBy,
        page: pageParam,
        pageSize: initialPageSize
      }
      
      const result = await window.electronAPI.fetchTableData(
        connectionString,
        tableName,
        searchOptions
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch table data')
      }
      
      return {
        ...result,
        page: pageParam
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil((lastPage.totalRows || 0) / initialPageSize)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    enabled: enabled && !!connectionString && !!tableName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // cacheTime was renamed to gcTime in v5
  })
  
  // Combine all pages of data
  const allRows = useMemo(() => {
    if (!query.data?.pages) return []
    return query.data.pages.flatMap(page => page.data?.rows || [])
  }, [query.data?.pages])
  
  // Get column info from first page
  const data = useMemo(() => {
    if (!query.data?.pages?.[0]?.data) return undefined
    return {
      columns: query.data.pages[0].data.columns,
      rows: allRows
    }
  }, [query.data?.pages, allRows])
  
  const totalRows = query.data?.pages?.[0]?.totalRows || 0
  
  // Handle search input change
  const handleSearchInputChange = useCallback((input: string) => {
    setSearchInput(input)
    searchInputRef.current = input
  }, [])
  
  // Handle search commit (when user presses Enter)
  const handleSearchCommit = useCallback(() => {
    const newSearchTerm = searchInputRef.current
    if (newSearchTerm !== searchTermRef.current) {
      setSearchTerm(newSearchTerm)
      searchTermRef.current = newSearchTerm
    }
  }, [])
  
  // Reset when search/filters change
  const refetch = useCallback(() => {
    query.refetch()
  }, [query])
  
  return {
    data,
    allRows,
    totalRows,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error as Error | null,
    refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: !!query.hasNextPage,
    searchTerm: searchInput,
    setSearchTerm: handleSearchInputChange,
    handleSearchCommit,
    activeSearchTerm: searchTerm,
    orderBy,
    setOrderBy,
    filters,
    setFilters
  }
}