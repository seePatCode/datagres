import { useState, useEffect } from 'react'
import { Info, Loader2, AlertCircle, Key, Hash, Type, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TableSchema } from '@shared/types'

interface TableInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableName: string
  schemaName?: string
  connectionString: string
}

export function TableInfoDialog({
  open,
  onOpenChange,
  tableName,
  schemaName,
  connectionString,
}: TableInfoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null)

  useEffect(() => {
    if (open && tableName) {
      fetchTableSchema()
    }
  }, [open, tableName, connectionString])

  const fetchTableSchema = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await window.electronAPI.fetchTableSchema(connectionString, tableName)
      if (result.success && result.schema) {
        setTableSchema(result.schema)
      } else {
        setError(result.error || 'Failed to fetch table schema')
      }
    } catch (err) {
      setError('Failed to fetch table information')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (dataType: string) => {
    if (dataType.includes('int') || dataType.includes('numeric') || dataType.includes('decimal')) {
      return <Hash className="h-3 w-3" />
    }
    if (dataType.includes('char') || dataType.includes('text')) {
      return <Type className="h-3 w-3" />
    }
    return <FileText className="h-3 w-3" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Table Information: {schemaName ? `${schemaName}.${tableName}` : tableName}
          </DialogTitle>
          <DialogDescription>
            View columns, data types, and constraints for this table
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {tableSchema && !loading && (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-2 py-2 text-xs font-medium text-muted-foreground border-b">
                <div className="col-span-3">Column Name</div>
                <div className="col-span-3">Data Type</div>
                <div className="col-span-2">Nullable</div>
                <div className="col-span-2">Default</div>
                <div className="col-span-2">Constraints</div>
              </div>

              {/* Table Rows */}
              {tableSchema.columns.map((column, index) => (
                <div
                  key={column.name}
                  className={`grid grid-cols-12 gap-2 px-2 py-2 text-sm hover:bg-muted/50 rounded ${
                    index % 2 === 0 ? 'bg-muted/20' : ''
                  }`}
                >
                  <div className="col-span-3 font-mono flex items-center gap-2 min-w-0">
                    {column.isPrimaryKey && (
                      <Key className="h-3 w-3 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                    )}
                    <span className="truncate" title={column.name}>
                      {column.name}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 text-muted-foreground min-w-0">
                    <span className="flex-shrink-0">{getTypeIcon(column.dataType)}</span>
                    <span className="font-mono text-xs truncate" title={column.dataType}>
                      {column.dataType}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={column.nullable ? 'secondary' : 'default'} className="text-xs">
                      {column.nullable ? 'NULL' : 'NOT NULL'}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-muted-foreground min-w-0">
                    {column.defaultValue ? (
                      <code className="text-xs bg-muted px-1 py-0.5 rounded inline-block max-w-full truncate" title={column.defaultValue}>
                        {column.defaultValue}
                      </code>
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="flex gap-1 flex-wrap">
                      {column.isPrimaryKey && (
                        <Badge variant="default" className="text-xs">PK</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div>Total Columns: {tableSchema.columns.length}</div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}