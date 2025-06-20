import { useState, useEffect, useRef } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { TableIcon } from 'lucide-react'
import type { TableInfo, SchemaInfo } from '@shared/types'

interface QuickSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: TableInfo[]  // Keep for backward compatibility
  schemas?: SchemaInfo[]  // New: schemas with their tables
  onSelectTable: (tableName: string, schemaName?: string) => void
}

export function QuickSearch({ open, onOpenChange, tables, schemas, onSelectTable }: QuickSearchProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Build flat list of all tables with schema info
  const allTables = schemas ? schemas.flatMap(schema => 
    schema.tables.map(table => ({
      ...table,
      schemaName: schema.name,
      displayName: schema.name === 'public' ? table.name : `${schema.name}.${table.name}`
    }))
  ) : tables.map(table => ({ ...table, displayName: table.name }))

  // Filter tables based on search
  const filteredTables = allTables.filter(table =>
    table.displayName.toLowerCase().includes(search.toLowerCase())
  )

  // Handle table selection
  const handleSelect = (table: typeof allTables[0]) => {
    onSelectTable(table.name, table.schemaName)
    onOpenChange(false)
    setSearch('')
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        placeholder="Search tables..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No tables found.</CommandEmpty>
        <CommandGroup heading="Tables">
          {filteredTables.map((table) => (
            <CommandItem
              key={`${table.schemaName || 'public'}.${table.name}`}
              value={table.displayName}
              onSelect={() => handleSelect(table)}
              className="flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4 text-muted-foreground" />
              <span>{table.displayName}</span>
              {table.schemaName && table.schemaName !== 'public' && (
                <span className="text-xs text-muted-foreground ml-auto">{table.schemaName}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}