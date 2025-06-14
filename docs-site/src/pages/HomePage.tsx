import { Button } from '@/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/card'
import { ArrowRight, Zap, Keyboard, Lock, Database } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent" />
        <div className="container relative py-24 text-center">
          <img 
            src="/datagres/icon.png" 
            alt="Datagres" 
            className="mx-auto mb-8 h-32 w-32 drop-shadow-2xl"
          />
          <h1 className="mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
            Datagres
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            The Lightning-Fast PostgreSQL Explorer. Connect to your database and start browsing data in under 15 seconds.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="https://github.com/seepatcode/datagres/releases">
              <Button size="lg" className="gap-2">
                Download Now <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link to="/demo">
              <Button size="lg" variant="outline">Try Interactive Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-24">
        <h2 className="mb-12 text-center text-4xl font-bold">Why Developers Love Datagres</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-violet-500/10" />
            <CardHeader>
              <Zap className="mb-4 h-10 w-10 text-violet-500" />
              <CardTitle>Instant Connection</CardTitle>
              <CardDescription>
                Connect in under 2 seconds. No JDBC drivers, no connection pools to configure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block rounded bg-secondary p-3 text-xs">
                postgresql://user:pass@localhost/mydb
              </code>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10" />
            <CardHeader>
              <Keyboard className="mb-4 h-10 w-10 text-blue-500" />
              <CardTitle>Keyboard First</CardTitle>
              <CardDescription>
                Built for speed. Quick table search, tab navigation, and smart SQL completion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Shift+Shift</kbd>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+N</kbd>
                <kbd className="rounded bg-secondary px-2 py-1 text-xs">Cmd+Enter</kbd>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-green-500/10" />
            <CardHeader>
              <Lock className="mb-4 h-10 w-10 text-green-500" />
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Passwords in OS keychain. SSL auto-detection. Code-signed and notarized.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span> macOS Keychain
                <span className="text-green-500">✓</span> SSL/TLS
                <span className="text-green-500">✓</span> Notarized
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="bg-secondary/30">
        <div className="container py-24">
          <h2 className="mb-12 text-center text-4xl font-bold">Performance That Scales</h2>
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-5xl font-bold">< 2s</div>
              <p className="text-muted-foreground">Connection Time</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold">1M+</div>
              <p className="text-muted-foreground">Rows Handled</p>
            </div>
            <div>
              <div className="mb-2 text-5xl font-bold">60 FPS</div>
              <p className="text-muted-foreground">Smooth Scrolling</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <Database className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-4 text-4xl font-bold">Ready to Explore Your Data?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Download Datagres now and experience the fastest way to browse PostgreSQL databases.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="https://github.com/seepatcode/datagres/releases">
            <Button size="lg">Download for Free</Button>
          </a>
          <a href="https://github.com/seepatcode/datagres">
            <Button size="lg" variant="outline">View Source Code</Button>
          </a>
        </div>
      </section>
    </div>
  )
}