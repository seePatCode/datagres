"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { cn } from "@/lib/utils"
import { formatCellValue, formatCellTooltip, isJsonValue } from "@/lib/formatters"

interface EditableDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableName?: string
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void
  editedCells?: Map<string, any> // Map of "rowIndex-columnId" to edited value
  scrollContainerRef?: React.RefObject<HTMLDivElement>
  infiniteScrollContent?: React.ReactNode
  onSortingChange?: (sorting: Array<{id: string, desc: boolean}>) => void
  sorting?: Array<{id: string, desc: boolean}>
}

interface EditableCellProps {
  getValue: () => any
  row: any
  column: any
  table: any
  onEdit: (value: any) => void
  isEdited: boolean
  editedValue?: any
}

function EditableCell({ getValue, row, column, table, onEdit, isEdited, editedValue }: EditableCellProps) {
  const initialValue = getValue()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(editedValue ?? initialValue)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)
  const [cellPosition, setCellPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
      // Auto-resize textarea to fit content
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  useEffect(() => {
    // Update position if cell moves (e.g., due to scrolling)
    if (isEditing && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setCellPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      })
    }
  }, [isEditing])

  const handleClick = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setCellPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      })
    }
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    let finalValue = value
    
    // Try to parse JSON if the initial value was JSON
    if (isJsonValue(initialValue) && typeof value === 'string') {
      try {
        finalValue = JSON.parse(value)
      } catch (e) {
        // If parsing fails, keep it as string
        finalValue = value
      }
    }
    
    if (finalValue !== initialValue) {
      onEdit(finalValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setValue(editedValue ?? initialValue)
      setIsEditing(false)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const displayValue = isEdited ? editedValue : initialValue
  const isJson = isJsonValue(displayValue)

  if (isEditing && cellPosition) {
    // Calculate if we should open upward
    const estimatedHeight = 150 // Estimate max height of expanded textarea
    const spaceBelow = window.innerHeight - cellPosition.top - cellPosition.height
    const shouldOpenUpward = spaceBelow < estimatedHeight && cellPosition.top > estimatedHeight
    
    // Calculate position
    const topPosition = shouldOpenUpward 
      ? cellPosition.top + cellPosition.height - estimatedHeight 
      : cellPosition.top
    
    return (
      <>
        <div ref={cellRef} className="px-2 py-1 h-full opacity-0">
          {/* Placeholder to maintain cell size */}
        </div>
        {/* Floating editor using portal */}
        {createPortal(
          <>
            {/* Invisible backdrop to catch clicks outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={handleBlur}
              style={{ cursor: 'default' }}
            />
            <div
              className="fixed z-50"
              style={{
                top: topPosition + 'px',
                left: cellPosition.left + 'px',
                width: Math.max(cellPosition.width, 300) + 'px',
                minWidth: '300px',
                maxWidth: '800px'
              }}
            >
              <Textarea
                ref={inputRef}
                value={isJsonValue(value) ? JSON.stringify(value, null, 2) : value}
                onChange={handleInput}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="resize-none overflow-hidden font-mono text-vs-ui text-sm px-2 py-1 border-2 border-primary shadow-lg bg-background"
                style={{
                  minHeight: '28px',
                  lineHeight: '20px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              />
            </div>
          </>,
          document.body
        )}
      </>
    )
  }

  return (
    <div 
      ref={cellRef}
      className={cn(
        `font-mono text-vs-ui py-1 px-2 hover:bg-muted/30 transition-colors w-full h-full cursor-text ${
          isJson ? 'whitespace-pre-wrap' : 'truncate'
        }`,
        isEdited && "bg-orange-500/10 relative"
      )}
      title={formatCellTooltip(displayValue)}
      onClick={handleClick}
    >
      {isEdited && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-bl-md" />
      )}
      {displayValue !== null ? (
        <span className="text-foreground">
          {formatCellValue(displayValue)}
        </span>
      ) : (
        <span className="text-muted-foreground italic font-system text-vs-ui-small">
          NULL
        </span>
      )}
    </div>
  )
}

export function EditableDataTable<TData, TValue>({
  columns,
  data,
  tableName,
  columnVisibility,
  onColumnVisibilityChange,
  onCellEdit,
  editedCells = new Map(),
  scrollContainerRef,
  infiniteScrollContent,
  onSortingChange,
  sorting
}: EditableDataTableProps<TData, TValue>) {
  // Create editable columns
  const editableColumns = columns.map((col) => ({
    ...col,
    cell: ({ getValue, row, column, table }: any) => {
      const cellKey = `${row.index}-${column.id}`
      const isEdited = editedCells.has(cellKey)
      const editedValue = editedCells.get(cellKey)

      return (
        <EditableCell
          getValue={getValue}
          row={row}
          column={column}
          table={table}
          onEdit={(value) => onCellEdit?.(row.index, column.id, value)}
          isEdited={isEdited}
          editedValue={editedValue}
        />
      )
    }
  }))

  return (
    <DataTable
      columns={editableColumns}
      data={data}
      tableName={tableName}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={onColumnVisibilityChange}
      scrollContainerRef={scrollContainerRef}
      infiniteScrollContent={infiniteScrollContent}
      onSortingChange={onSortingChange}
      sorting={sorting}
    />
  )
}