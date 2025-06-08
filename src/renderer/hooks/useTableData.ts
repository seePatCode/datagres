/**
 * Custom hook for managing table data operations
 * Separates table data logic from UI components
 */

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TableInfo } from '../../shared/types'

export function useTableData(connectionString: string) {
  const queryClient = useQueryClient()
  const [selectedTable, setSelectedTable] = useState('')
  const [currentTableData, setCurrentTableData] = useState<{
    columns: string[]
    rows: any[][]
  } | null>(null)
  const [recentTables, setRecentTables] = useState<TableInfo[]>([])

  // Fetch table data mutation
  const tableDataMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const result = await window.electronAPI.fetchTableData(connectionString, tableName)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch table data')
      }
      return result
    },
    onSuccess: (data) => {
      setSelectedTable(data.tableName || '')
      setCurrentTableData(data.data || null)
      
      // Update recent tables
      const tableName = data.tableName || ''
      setRecentTables(prev => {
        const filtered = prev.filter(t => t.name !== tableName)
        return [{ name: tableName }, ...filtered].slice(0, 5)
      })
      
      // Cache the data
      queryClient.setQueryData(
        ['table-data', connectionString, data.tableName],
        data.data
      )
    }
  })

  // Select table handler
  const selectTable = useCallback((tableName: string) => {
    tableDataMutation.mutate(tableName)
  }, [tableDataMutation])

  // Refresh current table
  const refreshTable = useCallback(() => {
    if (selectedTable) {
      tableDataMutation.mutate(selectedTable)
    }
  }, [selectedTable, tableDataMutation])

  // Clear table selection
  const clearSelection = useCallback(() => {
    setSelectedTable('')
    setCurrentTableData(null)
  }, [])

  return {
    // State
    selectedTable,
    currentTableData,
    recentTables,
    
    // Loading states
    isLoadingTable: tableDataMutation.isPending,
    tableError: tableDataMutation.error,
    
    // Actions
    selectTable,
    refreshTable,
    clearSelection,
    
    // Table data
    tableData: tableDataMutation.data
  }
}