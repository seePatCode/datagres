interface TableStatusBarProps {
  rowCount: number
  totalRows: number
  columnCount: number
  activeSearchTerm: string
  unsavedChangesCount: number
  isLoadingMore: boolean
}

export function TableStatusBar({
  rowCount,
  totalRows,
  columnCount,
  activeSearchTerm,
  unsavedChangesCount,
  isLoadingMore,
}: TableStatusBarProps) {
  const formatRowCount = (count: number) => {
    if (count < 1000) return count.toLocaleString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`
    return `${(count / 1000000).toFixed(1)}M`
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20 text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          {formatRowCount(rowCount)} of {formatRowCount(totalRows)} rows
          {activeSearchTerm && ` WHERE ${activeSearchTerm}`}
        </span>
        {columnCount > 0 && (
          <span>{columnCount} columns</span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {unsavedChangesCount > 0 && (
          <span className="text-orange-600">
            {unsavedChangesCount} unsaved change{unsavedChangesCount > 1 ? 's' : ''}
          </span>
        )}
        {isLoadingMore && (
          <span className="text-cyan-600">Loading more...</span>
        )}
      </div>
    </div>
  )
}