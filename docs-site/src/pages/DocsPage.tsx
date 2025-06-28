import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs'

export default function DocsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Documentation</h1>
        <p className="text-muted-foreground">
          Everything you need to know about using Datagres
        </p>
      </div>

      <Tabs defaultValue="why-datagres" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="why-datagres">Why Datagres</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="ai-features">AI Features</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="why-datagres" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Built for Developers, Not DBAs</CardTitle>
              <CardDescription>
                Datagres is designed for developers who need to quickly check data across multiple databases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">The Problem with Traditional Database Tools</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Most free database tools were built for database administrators who spend all day in one tool. 
                  They're powerful but slow, complex, and require extensive configuration. As a developer, 
                  you just want to quickly check if that migration ran correctly or debug why a query isn't 
                  returning the expected results.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">Datagres Philosophy</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>Speed First:</strong> From launch to browsing data in under 15 seconds. 
                      No waiting for Java to start, no driver downloads, no workspace configuration.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>Zero Configuration:</strong> Paste a connection string and go. 
                      Datagres handles SSL, cloud providers, and connection pooling automatically.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>Keyboard Driven:</strong> Generate SQL with Cmd+K. 
                      Quick connection switching. Navigate with keyboard shortcuts. Your hands never leave the keyboard.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>Developer Workflow:</strong> Quick connection switching for dev/staging/prod. 
                      AI-powered SQL generation. Smart autocomplete that understands your schema.
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-World Speed Comparison</CardTitle>
              <CardDescription>Time from launch to viewing data in a table</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Datagres</span>
                    <span className="text-sm text-green-500">~13 seconds</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Traditional Free Tools</span>
                    <span className="text-sm text-muted-foreground">2-5 minutes</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes: App startup (30s+), driver download, connection setup, navigation to table
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unique Features</CardTitle>
              <CardDescription>What makes Datagres different</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">🔍 Quick Table & Connection Search</h3>
                <p className="text-sm text-muted-foreground">
                  Search and switch between both tables AND database connections instantly. 
                  No more navigating through connection managers and object browsers.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">🤖 Local AI SQL Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Press Cmd+K and describe what you want in plain English. Datagres generates 
                  the SQL locally using Ollama - your schema never leaves your machine.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">☁️ Cloud Provider Auto-Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically configures SSL for Heroku, AWS RDS, Azure, and Google Cloud SQL. 
                  No manual certificate management or connection parameter tweaking.
                </p>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">⚡ Instant Startup</h3>
                <p className="text-sm text-muted-foreground">
                  Native app that starts in under 2 seconds. Auto-reconnects to your last database. 
                  By the time other tools show their splash screen, you're already querying data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>Get Datagres up and running in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">macOS</h3>
                <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                  <li>Download the .dmg file from the releases page</li>
                  <li>Double-click to mount the disk image</li>
                  <li>Drag Datagres to your Applications folder</li>
                  <li>Launch Datagres from Applications</li>
                </ol>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Windows</h3>
                <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                  <li>Download the .exe installer</li>
                  <li>Run the installer and follow the wizard</li>
                  <li>Launch Datagres from the Start menu</li>
                </ol>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Linux</h3>
                <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                  <li>Download the .AppImage file</li>
                  <li>Make it executable: <code className="rounded bg-secondary px-1">chmod +x Datagres-*.AppImage</code></li>
                  <li>Run the AppImage</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>First Connection</CardTitle>
              <CardDescription>Connect to your PostgreSQL database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Datagres accepts standard PostgreSQL connection strings. Just paste your connection string and press Enter.
              </p>
              <div className="rounded bg-secondary p-4">
                <code className="text-sm">postgresql://username:password@host:port/database</code>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Examples:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Local: <code className="rounded bg-secondary px-1">postgresql://user:pass@localhost:5432/mydb</code></li>
                  <li>• Remote: <code className="rounded bg-secondary px-1">postgresql://user:pass@db.example.com:5432/production</code></li>
                  <li>• SSL: <code className="rounded bg-secondary px-1">postgresql://user:pass@host:5432/db?sslmode=require</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Essential Shortcuts</CardTitle>
              <CardDescription>The most important keyboard shortcuts to remember</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">Generate SQL with AI</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+K</kbd>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">New connection</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+N</kbd>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">Show all shortcuts</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+/</kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>Move around your database efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">New query tab</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+T</kbd>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">Close tab</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+W</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered SQL</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Press Cmd+K to generate SQL using plain English. Uses local Ollama models 
                  for complete privacy - your schema never leaves your machine. Also includes 
                  smart error correction and WHERE clause generation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infinite Scrolling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse millions of rows seamlessly. Datagres automatically loads more data as you scroll, 
                  providing a smooth experience even with large datasets.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Smart SQL Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Built-in Monaco editor with intelligent SQL autocompletion, syntax highlighting, 
                  and context-aware suggestions for tables and columns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secure Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your credentials are stored securely in the OS keychain. Automatic SSL detection 
                  for cloud providers ensures your data is always encrypted in transit.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In-Place Data Editing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Edit data directly in the table view with full undo/redo support. 
                  Smart JSON formatting automatically prettifies JSON columns for easy viewing and editing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto-Reconnect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Datagres remembers your connections and automatically reconnects on startup. 
                  Connection strings are preserved exactly as entered, supporting all PostgreSQL parameters.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local AI with Ollama</CardTitle>
              <CardDescription>Privacy-first SQL generation that runs entirely on your machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Setup</h3>
                <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
                  <li>Install Ollama from <code className="rounded bg-secondary px-1">ollama.ai</code></li>
                  <li>Pull the model: <code className="rounded bg-secondary px-1">ollama pull qwen2.5-coder</code></li>
                  <li>Restart Datagres to enable AI features</li>
                </ol>
              </div>
              
              <div>
                <h3 className="mb-2 font-semibold">Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>SQL Generation (Cmd+K):</strong> Describe what you want in plain English 
                      and get accurate SQL queries based on your actual schema.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>Error Correction:</strong> When a query fails, Datagres can suggest 
                      fixes based on the error message and your schema.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">→</span>
                    <div>
                      <strong>WHERE Clause Helper:</strong> Generate complex WHERE clauses by describing 
                      your filtering criteria in natural language.
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="rounded bg-secondary/50 p-4">
                <p className="text-sm">
                  <strong>Privacy Note:</strong> Your schema and data never leave your machine. 
                  All AI processing happens locally via Ollama on localhost:11434.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>Solutions to frequently encountered problems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">SSL Certificate Errors</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  If you're connecting to a cloud database and see SSL errors, Datagres should automatically 
                  detect and configure SSL. If issues persist:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>Try adding <code className="rounded bg-secondary px-1">?sslmode=require</code> to your connection string</li>
                  <li>Check if your IP is whitelisted in your cloud provider's settings</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Authentication Failed</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Common causes and solutions:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>Special characters in passwords need to be URL-encoded</li>
                  <li>Ensure the database name is correct</li>
                  <li>Verify your user has the necessary permissions</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Performance Issues</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  For optimal performance with large tables:
                </p>
                <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                  <li>Use the search/filter feature to reduce dataset size</li>
                  <li>Consider adding indexes to frequently queried columns</li>
                  <li>Check your network connection for latency issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}