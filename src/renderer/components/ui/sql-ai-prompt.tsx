import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2 } from 'lucide-react'
import type { GenerateSQLRequest, TableSchema } from '@shared/types'

interface SqlAiPromptProps {
  isOpen: boolean
  onClose: () => void
  onInsertSql: (sql: string) => void
  connectionString: string
  tableName?: string
  schemas?: TableSchema[]
  position?: { top: number; left: number }
}

export function SqlAiPrompt({ 
  isOpen, 
  onClose, 
  onInsertSql, 
  connectionString,
  tableName,
  schemas = [],
  position 
}: SqlAiPromptProps) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // AI SQL generation mutation
  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      // Try to detect which table the user is referring to
      const lowerPrompt = userPrompt.toLowerCase()
      let targetTable = tableName || 'table'
      let columns: string[] = []
      
      // Find table mentioned in prompt or use current context
      if (schemas.length > 0) {
        for (const schema of schemas) {
          if (lowerPrompt.includes(schema.tableName.toLowerCase())) {
            targetTable = schema.tableName
            columns = schema.columns.map(col => col.name)
            break
          }
        }
        
        // If no table found in prompt, use the first table or provided tableName
        if (columns.length === 0) {
          const defaultSchema = schemas.find(s => s.tableName === tableName) || schemas[0]
          if (defaultSchema) {
            targetTable = defaultSchema.tableName
            columns = defaultSchema.columns.map(col => col.name)
          }
        }
      }
      
      const tableInfo: GenerateSQLRequest = {
        prompt: userPrompt,
        tableName: targetTable,
        columns,
        allSchemas: schemas  // Pass all schemas for context
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