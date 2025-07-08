import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import type { ExecuteSQLResponse } from '@shared/types'

interface UseInfiniteQueryExecutionOptions {
  connectionString: string
  query: string
  enabled?: boolean
  pageSize?: number
}

export function useInfiniteQueryExecution({
  connectionString,
  query,
  enabled = false,
  pageSize = 100
}: UseInfiniteQueryExecutionOptions) {
  
  const queryKey = ['executeSQL', connectionString, query, pageSize]
  
  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading, error, isError } = useInfiniteQuery<ExecuteSQLResponse>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await window.electronAPI.executeSQL(connectionString, {
        query,
        page: pageParam as number,
        pageSize
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Query execution failed')
      }
      
      return result
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Only paginate if we have pagination info
      if (lastPage.totalRows && lastPage.page && lastPage.pageSize) {
        const totalPages = Math.ceil(lastPage.totalRows / lastPage.pageSize)
        const nextPage = lastPage.page + 1
        return nextPage <= totalPages ? nextPage : undefined
      }
      return undefined
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Aggregate all rows from all pages
  const allRows = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.data?.rows || [])
  }, [data])
  
  // Get metadata from the first page
  const firstPage = data?.pages?.[0]
  const columns = firstPage?.data?.columns || []
  const totalRows = firstPage?.totalRows
  const autoLimitApplied = firstPage?.autoLimitApplied || false
  const queryTime = data?.pages?.reduce((sum, page) => sum + (page.queryTime || 0), 0) || 0
  
  const isLoadingMore = isFetchingNextPage
  
  return {
    data: columns.length > 0 ? { columns, rows: allRows } : null,
    totalRows,
    autoLimitApplied,
    queryTime,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isLoadingMore,
    error: error as Error | null,
    isError,
  }
}