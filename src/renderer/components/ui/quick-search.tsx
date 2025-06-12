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
import type { TableInfo } from '@/shared/types'

interface QuickSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: TableInfo[]
  onSelectTable: (tableName: string) => void
}

export function QuickSearch({ open, onOpenChange, tables, onSelectTable }: QuickSearchProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter tables based on search
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(search.toLowerCase())
  )

  // Handle table selection
  const handleSelect = (tableName: string) => {
    onSelectTable(tableName)
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
              key={table.name}
              value={table.name}
              onSelect={() => handleSelect(table.name)}
              className="flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4 text-muted-foreground" />
              <span>{table.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}