"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "./data-table"
import { Input } from "./input"
import { cn } from "@/lib/utils"

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (value !== initialValue) {
      onEdit(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setValue(editedValue ?? initialValue)
      setIsEditing(false)
    }
  }

  const displayValue = isEdited ? editedValue : initialValue

  if (isEditing) {
    return (
      <div className="px-2 py-1 h-full">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-6 px-1 py-0 text-sm border-primary"
        />
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "font-mono text-vs-ui truncate py-1 px-2 hover:bg-muted/30 transition-colors w-full h-full cursor-text",
        isEdited && "bg-orange-500/10 relative"
      )}
      title={displayValue !== null ? String(displayValue) : 'NULL'}
      onClick={handleClick}
    >
      {isEdited && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-bl-md" />
      )}
      {displayValue !== null ? (
        <span className="text-foreground">
          {String(displayValue)}
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
  infiniteScrollContent
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
    />
  )
}