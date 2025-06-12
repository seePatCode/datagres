"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  ColumnOrderState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  scrollContainerRef?: React.RefObject<HTMLDivElement>
  infiniteScrollContent?: React.ReactNode
}

// Draggable Table Header Component
function DraggableTableHeader({
  header,
  table,
}: {
  header: any
  table: any
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    })

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className="px-2 py-1 font-medium text-left border-r border-b border-muted-foreground/40 bg-muted/30 relative h-8 text-vs-ui"
    >
      <div className="flex items-center gap-2 truncate">
        {/* Drag handle - separate from sort area */}
        <div 
          className="cursor-move p-1 -ml-1 hover:bg-muted/50 rounded"
          {...attributes}
          {...listeners}
          title="Drag to reorder column"
        >
          <div className="w-1 h-4 flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
          </div>
        </div>
        
        {/* Sortable content area */}
        <div 
          className={`flex items-center gap-2 truncate flex-1 ${
            header.column.getCanSort() ? "cursor-pointer select-none hover:bg-muted/50 p-1 -m-1 rounded" : ""
          }`}
          onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
        >
          <span className="truncate">
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
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
      </div>
    </TableHead>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableName,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  scrollContainerRef,
  infiniteScrollContent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    columns.map((column) => column.id as string)
  )

  // Use external column visibility if provided, otherwise use internal state
  const columnVisibility = externalColumnVisibility || internalColumnVisibility
  const setColumnVisibility = onColumnVisibilityChange || setInternalColumnVisibility

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // Remove pagination - we'll show all rows for infinite scroll
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
    },
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }

  // Update column sizes based on content (VSCode-style)
  React.useEffect(() => {
    const rows = table.getRowModel().rows
    const headers = table.getHeaderGroups()[0]?.headers || []
    
    headers.forEach((header, columnIndex) => {
      // Get the header text length
      const headerText = String(header.column.columnDef.header || '')
      const headerLength = headerText.length
      
      // Sample first 20 rows to estimate content width
      const sampleRows = rows.slice(0, 20)
      const maxContentLength = sampleRows.reduce((max, row) => {
        const cellValue = String(row.getVisibleCells()[columnIndex]?.getValue() || '')
        return Math.max(max, cellValue.length)
      }, headerLength)
      
      // Calculate width based on monospace font (roughly 7px per character for 14px font)
      const estimatedWidth = Math.max(maxContentLength * 7 + 16, 60)
      
      // Constrain to reasonable bounds for VSCode-style tables
      const finalWidth = Math.min(Math.max(estimatedWidth, 60), 180)
      
      // Update column size
      header.column.columnDef.size = finalWidth
    })
  }, [table.getRowModel().rows])

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 min-h-0 rounded-md border overflow-hidden flex flex-col">
          <div ref={scrollContainerRef} className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableTableHeader
                        key={header.id}
                        header={header}
                        table={table}
                      />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/20 transition-colors h-8"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="p-0 border-r border-b border-muted-foreground/40 h-8 align-middle"
                        style={{ 
                          width: cell.column.getSize(),
                          minWidth: cell.column.columnDef.minSize,
                          maxWidth: cell.column.columnDef.maxSize 
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
            {infiniteScrollContent}
          </div>
        </div>
      </div>
    </DndContext>
  )
}