import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'
import type { GenerateSQLRequest } from '@shared/types'

interface AiSqlInputProps {
  tableName: string
  columns: string[]
  onSqlGenerated: (sql: string) => void
  className?: string
}

export function AiSqlInput({ tableName, columns, onSqlGenerated, className }: AiSqlInputProps) {
  const [prompt, setPrompt] = useState('')
  const [showAI, setShowAI] = useState(false)

  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const tableInfo: GenerateSQLRequest = {
        prompt: userPrompt,
        tableName,
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
        onSqlGenerated(data.sql)
        setPrompt('')
        
        // Show feedback based on method
        if (data.method === 'pattern') {
          console.log('Generated SQL using pattern matching')
        } else if (data.method === 'fallback') {
          console.log('Using default query:', data.message)
        }
      }
    },
    onError: (error) => {
      console.error('AI generation failed:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !generateMutation.isPending) {
      generateMutation.mutate(prompt.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  if (!showAI) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAI(true)}
        className="h-8 px-2"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        AI
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask AI: e.g. "show all active users" or "count by status"`}
            className="h-8 pl-8 pr-2 text-sm"
            disabled={generateMutation.isPending}
            autoFocus
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!prompt.trim() || generateMutation.isPending}
          className="h-8"
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Generate'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowAI(false)
            setPrompt('')
          }}
          className="h-8 px-2"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}