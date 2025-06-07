import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  // Calculate optimal column widths based on content
  const calculateColumnWidths = () => {
    const rows = table.getRowModel().rows
    const headers = table.getHeaderGroups()[0]?.headers || []
    
    return headers.map((header, columnIndex) => {
      // Get the header text length
      const headerText = String(header.column.columnDef.header || '')
      const headerLength = headerText.length
      
      // Sample first 10 rows to estimate content width
      const sampleRows = rows.slice(0, 10)
      const maxContentLength = sampleRows.reduce((max, row) => {
        const cellValue = String(row.getVisibleCells()[columnIndex]?.getValue() || '')
        return Math.max(max, cellValue.length)
      }, headerLength)
      
      // Calculate width based on content length (rough estimate: 8px per character + padding)
      const estimatedWidth = Math.max(maxContentLength * 8 + 24, 80)
      
      // Constrain to our min/max bounds
      return Math.min(Math.max(estimatedWidth, 80), 160)
    })
  }

  const columnWidths = calculateColumnWidths()

  return (
    <div className="space-y-4">
      {/* Table Info */}
      <div data-testid="table-info" className="text-sm text-muted-foreground">
        Showing {data.length} rows{tableName && ` from ${tableName}`}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto scrollbar-thin" data-testid="enhanced-table">
        <Table className="w-full" style={{ tableLayout: 'fixed' }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-10">
                {headerGroup.headers.map((header, headerIndex) => {
                  const width = columnWidths[headerIndex]
                  
                  return (
                    <TableHead 
                      key={header.id}
                      data-testid="column-header"
                      className={`px-3 py-2 font-medium text-left border-r border-border/50 bg-muted/30 ${
                        header.column.getCanSort() ? "cursor-pointer select-none hover:bg-muted/50" : ""
                      }`}
                      style={{ 
                        width: `${width}px`,
                        minWidth: '80px',
                        maxWidth: '160px'
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </span>
                        {header.column.getCanSort() && (
                          <div data-testid="sort-indicator" className="flex flex-col flex-shrink-0">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <div className="h-4 w-4 flex flex-col justify-center items-center">
                                <ChevronUp className="h-2 w-2 opacity-50" />
                                <ChevronDown className="h-2 w-2 opacity-50" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-testid="data-row"
                  data-state={row.getIsSelected() && "selected"}
                  className={`h-9 ${rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/40`}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const width = columnWidths[cellIndex]
                    
                    return (
                      <TableCell 
                        key={cell.id}
                        className="px-3 py-1 border-r border-border/30 overflow-hidden"
                        style={{ 
                          width: `${width}px`,
                          minWidth: '80px',
                          maxWidth: '160px'
                        }}
                        title={String(cell.getValue() || '')}
                      >
                      <div className="truncate text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow className="h-20">
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No data found in this table.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}