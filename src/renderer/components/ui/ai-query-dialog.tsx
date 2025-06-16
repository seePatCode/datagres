import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Sparkles, Code, Database } from 'lucide-react'
import type { TableInfo, GenerateSQLRequest } from '@shared/types'

interface AiQueryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: TableInfo[]
  onCreateQuery: (query: string, isAi?: boolean) => void
  connectionString: string
}

export function AiQueryDialog({ 
  open, 
  onOpenChange, 
  tables, 
  onCreateQuery,
  connectionString 
}: AiQueryDialogProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [showAiResults, setShowAiResults] = useState(false)

  // AI SQL generation mutation
  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // Try to detect which table the user is referring to
      const lowerPrompt = prompt.toLowerCase()
      let targetTable = tables[0]?.name || 'table'
      
      // Find table mentioned in prompt
      for (const table of tables) {
        if (lowerPrompt.includes(table.name.toLowerCase())) {
          targetTable = table.name
          break
        }
      }
      
      // Get columns for the target table
      const schemaResult = await window.electronAPI.fetchTableSchema(connectionString, targetTable)
      const columns = schemaResult.schema?.columns.map(col => col.name) || []
      
      const tableInfo: GenerateSQLRequest = {
        prompt,
        tableName: targetTable,
        columns
      }
      
      const result = await window.electronAPI.generateSQL(prompt, tableInfo)
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate SQL')
      }
      
      return result
    },
    onSuccess: (data) => {
      if (data.sql) {
        onCreateQuery(data.sql, true)
        onOpenChange(false)
        setSearch('')
      }
    }
  })

  // Handle direct SQL input
  const handleDirectSQL = () => {
    if (search.trim()) {
      onCreateQuery(search, false)
      onOpenChange(false)
      setSearch('')
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault()
      // If it looks like SQL, use it directly
      const trimmed = search.trim().toLowerCase()
      if (trimmed.startsWith('select') || trimmed.startsWith('with') || 
          trimmed.startsWith('insert') || trimmed.startsWith('update') || 
          trimmed.startsWith('delete')) {
        handleDirectSQL()
      } else {
        // Otherwise, try AI generation
        generateMutation.mutate(search)
      }
    }
  }

  // Show AI results when we have a non-SQL search term
  useEffect(() => {
    const trimmed = search.trim().toLowerCase()
    const looksLikeSQL = trimmed.startsWith('select') || trimmed.startsWith('with') || 
                        trimmed.startsWith('insert') || trimmed.startsWith('update') || 
                        trimmed.startsWith('delete') || trimmed.includes(';')
    
    setShowAiResults(search.length > 0 && !looksLikeSQL)
  }, [search])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      // Reset state when closing
      setSearch('')
      generateMutation.reset()
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        ref={inputRef}
        placeholder="Type a query in English or SQL..."
        value={search}
        onValueChange={setSearch}
        onKeyDown={handleKeyDown}
        className="text-base"
      />
      <CommandList>
        {search.trim() && (
          <>
            {showAiResults ? (
              <>
                <CommandGroup heading="Natural Language Query">
                  <CommandItem
                    onSelect={() => generateMutation.mutate(search)}
                    disabled={generateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Generate SQL from: "{search}"</div>
                      <div className="text-xs text-muted-foreground">
                        {generateMutation.isPending ? 'Generating...' : 'Press Enter to generate SQL'}
                      </div>
                    </div>
                  </CommandItem>
                </CommandGroup>
                
                <CommandSeparator />
                
                <CommandGroup heading="Example Queries">
                  <CommandItem
                    onSelect={() => setSearch('show all active users')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span>show all active users</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => setSearch('count orders by status')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span>count orders by status</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => setSearch('customers from last month')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Database className="h-3 w-3 text-muted-foreground" />
                    <span>customers from last month</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : (
              <CommandGroup heading="SQL Query">
                <CommandItem
                  onSelect={handleDirectSQL}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">Execute SQL Query</div>
                    <div className="text-xs text-muted-foreground font-mono">{search}</div>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </>
        )}
        
        {!search && (
          <CommandEmpty>
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">
                Type a query in plain English or SQL
              </p>
              <p className="text-xs text-muted-foreground">
                Examples: "show active users" or "SELECT * FROM users"
              </p>
            </div>
          </CommandEmpty>
        )}
        
        {generateMutation.error && (
          <div className="px-2 py-1.5 text-sm text-destructive">
            Error: {generateMutation.error.message}
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}