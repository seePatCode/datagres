import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Server, Database, User, Key, AlertCircle } from 'lucide-react'

interface ConnectionStringPreviewProps {
  connectionString: string
  className?: string
}

interface ParsedConnection {
  valid: boolean
  error?: string
  host?: string
  port?: number
  database?: string
  username?: string
  hasPassword?: boolean
  ssl?: boolean
  format?: string
}

export function ConnectionStringPreview({ connectionString, className = '' }: ConnectionStringPreviewProps) {
  const parsed = useMemo<ParsedConnection>(() => {
    if (!connectionString.trim()) {
      return { valid: false }
    }

    try {
      // Try to parse the connection string
      const result = window.electronAPI.connectionStringUtils.parse(connectionString)
      
      return {
        valid: true,
        host: result.host || 'localhost',
        port: result.port || 5432,
        database: result.database || '',
        username: result.username || '',
        hasPassword: !!result.password,
        ssl: result.params?.sslmode === 'require' || result.params?.ssl === 'true',
        format: result.originalFormat
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid connection string'
      }
    }
  }, [connectionString])

  if (!connectionString.trim()) {
    return null
  }

  if (!parsed.valid) {
    return (
      <Card className={`${className} border-destructive/50`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Invalid connection string</span>
          </div>
          {parsed.error && (
            <p className="text-xs text-muted-foreground mt-1">{parsed.error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Connection Details</h3>
          <Badge variant="outline" className="text-xs">
            {parsed.format === 'url' ? 'URL Format' : 'Key-Value Format'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Server className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Host:</span>
            <span className="font-mono">{parsed.host}:{parsed.port}</span>
          </div>
          
          {parsed.database && (
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Database:</span>
              <span className="font-mono">{parsed.database}</span>
            </div>
          )}
          
          {parsed.username && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono">{parsed.username}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {parsed.hasPassword && (
              <div className="flex items-center gap-1">
                <Key className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Password provided</span>
              </div>
            )}
            
            {parsed.ssl && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <span className="text-green-600">SSL enabled</span>
              </div>
            )}
          </div>
        </div>
        
        {!parsed.database && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ No database specified - will connect to default database
          </p>
        )}
      </CardContent>
    </Card>
  )
}