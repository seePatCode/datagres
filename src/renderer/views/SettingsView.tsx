import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Settings, Bot, Terminal, Info, ArrowLeft } from 'lucide-react'
import { 
  selectAISettings, 
  setAIProvider, 
  setAISettings,
  selectTheme,
  setTheme,
  selectSqlLivePreview,
  setSqlLivePreview
} from '@/store/slices/settingsSlice'
import { navigateBack } from '@/store/slices/uiSlice'
import type { AIProvider, AISettings } from '@shared/types'

export function SettingsView() {
  const dispatch = useDispatch()
  const aiSettings = useSelector(selectAISettings)
  const theme = useSelector(selectTheme)
  const sqlLivePreview = useSelector(selectSqlLivePreview)
  
  const [ollamaModel, setOllamaModel] = useState(aiSettings.ollamaConfig?.model || 'qwen2.5-coder:latest')
  const [ollamaUrl, setOllamaUrl] = useState(aiSettings.ollamaConfig?.url || 'http://localhost:11434')
  
  // Update local state when aiSettings change (e.g., from localStorage)
  useEffect(() => {
    if (aiSettings.ollamaConfig) {
      setOllamaModel(aiSettings.ollamaConfig.model || 'qwen2.5-coder:latest')
      setOllamaUrl(aiSettings.ollamaConfig.url || 'http://localhost:11434')
    }
  }, [aiSettings.ollamaConfig])
  const [claudeStatus, setClaudeStatus] = useState<'checking' | 'installed' | 'not-installed'>('checking')

  // No need to sync here - it's now handled in the Redux slice

  // Check Claude CLI availability
  useEffect(() => {
    if (aiSettings.provider === 'claude-code') {
      window.electronAPI.executeShellCommand('which claude').then((result) => {
        if (result.success && result.output) {
          setClaudeStatus('installed')
        } else {
          setClaudeStatus('not-installed')
        }
      }).catch(() => {
        setClaudeStatus('not-installed')
      })
    }
  }, [aiSettings.provider])

  const handleProviderChange = (provider: AIProvider) => {
    dispatch(setAIProvider(provider))
  }

  const handleSaveOllamaSettings = () => {
    const newSettings: AISettings = {
      ...aiSettings,
      ollamaConfig: {
        model: ollamaModel,
        url: ollamaUrl
      }
    }
    dispatch(setAISettings(newSettings))
  }

  const handleGoBack = () => {
    dispatch(navigateBack())
  }

  // Handle escape key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch(navigateBack())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your Datagres preferences
          </p>
        </div>

        <Separator />

        {/* AI Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant Settings
            </CardTitle>
            <CardDescription>
              Configure which AI provider to use for SQL generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>AI Provider</Label>
              <RadioGroup value={aiSettings.provider} onValueChange={handleProviderChange}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="ollama" id="ollama" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="ollama" className="font-medium cursor-pointer">
                      Ollama (Local)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use locally running Ollama for privacy-first AI assistance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 mt-4">
                  <RadioGroupItem value="claude-code" id="claude-code" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="claude-code" className="font-medium cursor-pointer">
                      Claude Code CLI
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Use Claude via the Claude Code CLI for more advanced capabilities
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Ollama Configuration */}
            {aiSettings.provider === 'ollama' && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Ollama Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="ollama-model">Model</Label>
                  <Input
                    id="ollama-model"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="qwen2.5-coder:latest"
                  />
                  <p className="text-xs text-muted-foreground">
                    The Ollama model to use for SQL generation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ollama-url">Ollama URL</Label>
                  <Input
                    id="ollama-url"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                  <p className="text-xs text-muted-foreground">
                    The URL where Ollama is running
                  </p>
                </div>
                <Button 
                  onClick={handleSaveOllamaSettings}
                  size="sm"
                  className="mt-2"
                >
                  Save Ollama Settings
                </Button>
              </div>
            )}

            {/* Claude Code Configuration */}
            {aiSettings.provider === 'claude-code' && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Claude Code Configuration</h4>
                
                {claudeStatus === 'checking' ? (
                  <p className="text-sm text-muted-foreground">Checking Claude CLI installation...</p>
                ) : claudeStatus === 'installed' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <p className="text-sm text-green-600">Claude CLI is installed and ready to use</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Claude will use your existing authentication. If not authenticated, run "claude login" in your terminal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-orange-500 rounded-full" />
                      <p className="text-sm text-orange-600">Claude CLI not found</p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>To use Claude Code CLI:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Download and install Claude Code from <a href="https://claude.ai/code" className="text-primary underline" onClick={(e) => { e.preventDefault(); window.electronAPI.executeShellCommand('open https://claude.ai/code') }}>claude.ai/code</a></li>
                        <li>Open the Claude Code app at least once</li>
                        <li>The CLI should be automatically available at /usr/local/bin/claude</li>
                        <li>If not found, check your PATH or restart your terminal</li>
                      </ol>
                      <p className="text-xs mt-2 text-orange-600">
                        Note: If you have a different "claude" command from npm, it may conflict. 
                        The official Claude Code CLI is installed by the desktop app, not via npm.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of Datagres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup value={theme} onValueChange={(value: any) => dispatch(setTheme(value))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* SQL Editor Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              SQL Editor
            </CardTitle>
            <CardDescription>
              Configure SQL editor behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="live-preview">Live Preview</Label>
                <p className="text-sm text-muted-foreground">
                  Show query results as you type (experimental)
                </p>
              </div>
              <Button
                id="live-preview"
                variant={sqlLivePreview ? "default" : "outline"}
                size="sm"
                onClick={() => dispatch(setSqlLivePreview(!sqlLivePreview))}
              >
                {sqlLivePreview ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}