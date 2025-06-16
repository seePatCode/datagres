import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2 } from 'lucide-react'
import type { GenerateSQLRequest } from '@shared/types'

interface SqlAiPromptProps {
  isOpen: boolean
  onClose: () => void
  onInsertSql: (sql: string) => void
  connectionString: string
  tableName?: string
  position?: { top: number; left: number }
}

export function SqlAiPrompt({ 
  isOpen, 
  onClose, 
  onInsertSql, 
  connectionString,
  tableName,
  position 
}: SqlAiPromptProps) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // AI SQL generation mutation
  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      // Get table info if we have a table name
      let columns: string[] = []
      let targetTable = tableName || 'table'
      
      if (tableName) {
        try {
          const schemaResult = await window.electronAPI.fetchTableSchema(connectionString, tableName)
          columns = schemaResult.schema?.columns.map(col => col.name) || []
        } catch {
          // Continue without schema
        }
      }
      
      const tableInfo: GenerateSQLRequest = {
        prompt: userPrompt,
        tableName: targetTable,
        columns
      }
      
      const result = await window.electronAPI.generateSQL(userPrompt, tableInfo)
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate SQL')
      }
      
      return result
    },
    onSuccess: (data) => {
      if (data.sql) {
        onInsertSql(data.sql)
        handleClose()
      }
    }
  })

  const handleClose = () => {
    setPrompt('')
    generateMutation.reset()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !generateMutation.isPending) {
      generateMutation.mutate(prompt.trim())
    }
  }

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="absolute z-50 w-96 bg-background border rounded-lg shadow-lg p-2"
      style={{
        top: position?.top || '50%',
        left: position?.left || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)'
      }}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want in plain English..."
          className="flex-1 h-8 text-sm"
          disabled={generateMutation.isPending}
        />
        {generateMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </form>
      {generateMutation.error && (
        <div className="mt-2 text-xs text-destructive px-6">
          {generateMutation.error.message}
        </div>
      )}
      <div className="mt-1 text-xs text-muted-foreground px-6">
        Press Enter to generate SQL, Esc to cancel
      </div>
    </div>
  )
}