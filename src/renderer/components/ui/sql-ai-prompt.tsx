import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Terminal, Check } from 'lucide-react'
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

// Track which commands have been executed
type ExecutedCommands = {
  install?: boolean
  start?: boolean
  model?: boolean
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
  const [executedCommands, setExecutedCommands] = useState<ExecutedCommands>({})
  const [executing, setExecuting] = useState<string | null>(null)
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
    setExecutedCommands({})
    setExecuting(null)
    onClose()
  }
  
  const executeCommand = async (command: string, commandKey: keyof ExecutedCommands) => {
    setExecuting(command)
    try {
      // Check if the handler exists (for hot reload scenarios)
      if (!window.electronAPI.executeShellCommand) {
        console.error('Shell command handler not available. Please restart the app.')
        alert('Please restart the app to enable the setup buttons.')
        setExecuting(null)
        return
      }
      
      const result = await window.electronAPI.executeShellCommand(command)
      if (result.success) {
        setExecutedCommands(prev => ({ ...prev, [commandKey]: true }))
        
        // If all setup commands are done, retry the generation
        if (commandKey === 'model' || 
            (executedCommands.install && executedCommands.start && commandKey === 'model')) {
          // Wait a moment for Ollama to be ready
          setTimeout(() => {
            if (prompt.trim()) {
              generateMutation.mutate(prompt.trim())
            }
          }, 2000)
        }
      } else {
        console.error('Command failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to execute command:', error)
    } finally {
      setExecuting(null)
    }
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
        <div className="mt-2 px-6">
          {generateMutation.error.message.includes('Ollama is not running') ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-medium">Ollama is not installed or running</p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>To use AI SQL generation:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1">
                      1. Install Ollama: <code className="bg-muted px-1 rounded text-[10px]">brew install ollama</code>
                    </span>
                    <Button
                      size="sm"
                      variant={executedCommands.install ? "secondary" : "outline"}
                      className="h-6 px-2 text-xs"
                      onClick={() => executeCommand('brew install ollama', 'install')}
                      disabled={executing !== null || executedCommands.install}
                    >
                      {executedCommands.install ? (
                        <><Check className="h-3 w-3 mr-1" /> Done</>
                      ) : executing === 'brew install ollama' ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Installing...</>
                      ) : (
                        <><Terminal className="h-3 w-3 mr-1" /> Run</>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="flex-1">
                      2. Start Ollama: <code className="bg-muted px-1 rounded text-[10px]">brew services start ollama</code>
                    </span>
                    <Button
                      size="sm"
                      variant={executedCommands.start ? "secondary" : "outline"}
                      className="h-6 px-2 text-xs"
                      onClick={() => executeCommand('brew services start ollama', 'start')}
                      disabled={executing !== null || executedCommands.start || !executedCommands.install}
                    >
                      {executedCommands.start ? (
                        <><Check className="h-3 w-3 mr-1" /> Done</>
                      ) : executing === 'brew services start ollama' ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Starting...</>
                      ) : (
                        <><Terminal className="h-3 w-3 mr-1" /> Run</>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex-1">
                        3. Download AI model: <code className="bg-muted px-1 rounded text-[10px]">ollama pull qwen2.5-coder:latest</code>
                      </span>
                      <Button
                        size="sm"
                        variant={executedCommands.model ? "secondary" : "outline"}
                        className="h-6 px-2 text-xs"
                        onClick={() => executeCommand('ollama pull qwen2.5-coder:latest', 'model')}
                        disabled={executing !== null || executedCommands.model || !executedCommands.start}
                      >
                        {executedCommands.model ? (
                          <><Check className="h-3 w-3 mr-1" /> Done</>
                        ) : executing === 'ollama pull qwen2.5-coder:latest' ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Downloading...</>
                        ) : (
                          <><Terminal className="h-3 w-3 mr-1" /> Run</>
                        )}
                      </Button>
                    </div>
                    {executing === 'ollama pull qwen2.5-coder:latest' && (
                      <p className="text-[10px] text-muted-foreground ml-4">
                        ⏱️ This downloads a 4.7GB model and may take 2-5 minutes depending on your connection...
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="mt-2 pt-2 border-t">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://github.com/seepatcode/datagres/blob/main/docs/OLLAMA_SETUP.md', '_blank');
                    }}
                    className="text-primary hover:underline"
                  >
                    View full setup guide →
                  </a>
                </p>
              </div>
            </div>
          ) : generateMutation.error.message.includes('AI model not installed') ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-medium">AI model not installed</p>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Download the required model:</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-muted px-1 rounded text-[10px] flex-1">ollama pull qwen2.5-coder:latest</code>
                  <Button
                    size="sm"
                    variant={executedCommands.model ? "secondary" : "outline"}
                    className="h-6 px-2 text-xs"
                    onClick={() => executeCommand('ollama pull qwen2.5-coder:latest', 'model')}
                    disabled={executing !== null || executedCommands.model}
                  >
                    {executedCommands.model ? (
                      <><Check className="h-3 w-3 mr-1" /> Done</>
                    ) : executing === 'ollama pull qwen2.5-coder:latest' ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Downloading...</>
                    ) : (
                      <><Terminal className="h-3 w-3 mr-1" /> Run</>
                    )}
                  </Button>
                </div>
                {executing === 'ollama pull qwen2.5-coder:latest' ? (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    ⏱️ This downloads a 4.7GB model and may take 2-5 minutes depending on your connection...
                  </p>
                ) : (
                  <p className="mt-2 text-[10px] text-muted-foreground">This will download a 4.7GB model for SQL generation.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-destructive">{generateMutation.error.message}</p>
          )}
        </div>
      )}
      <div className="mt-1 text-xs text-muted-foreground px-6">
        Press Enter to generate SQL, Esc to cancel
      </div>
    </div>
  )
}