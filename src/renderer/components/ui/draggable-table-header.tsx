import * as React from "react"
import { flexRender } from "@tanstack/react-table"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp } from "lucide-react"
import { TableHead } from "@/components/ui/table"

interface DraggableTableHeaderProps {
  header: any
  table: any
}

export function DraggableTableHeader({
  header,
  table,
}: DraggableTableHeaderProps) {
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
      
      {/* Column resize handle */}
      <div
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-colors hover:bg-primary ${
          header.column.getIsResizing() ? 'bg-primary' : ''
        }`}
        style={{ opacity: header.column.getIsResizing() ? 1 : undefined }}
      />
    </TableHead>
  )
}