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

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

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
                  <span className="text-sm">Quick search (tables & connections)</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Shift+Shift</kbd>
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
                  <span className="text-sm">Jump to tab 1-9</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+1-9</kbd>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">Navigate back</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+[</kbd>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary/50 p-3">
                  <span className="text-sm">Navigate forward</span>
                  <kbd className="rounded bg-background px-2 py-1 text-xs">Cmd+]</kbd>
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
                <CardTitle>Quick Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Press Shift+Shift to instantly search through all tables AND saved connections. 
                  This Spotlight-like feature helps you find tables quickly or switch between databases in seconds.
                  Perfect for developers working with multiple environments (dev, staging, production).
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
          </div>
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