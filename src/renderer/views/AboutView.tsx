import { ArrowLeft, Github, Zap, Command, Shield, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDispatch } from 'react-redux'
import { setCurrentView } from '@/store/slices/uiSlice'
import type { AppDispatch } from '@/store/store'

export function AboutView() {
  const dispatch = useDispatch<AppDispatch>()
  
  const handleBack = () => {
    dispatch(setCurrentView('explorer'))
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">About Datagres</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <img 
              src="logo.png" 
              alt="Datagres Logo" 
              className="h-24 w-24 mx-auto"
            />
            <div>
              <h1 className="text-3xl font-bold">Datagres</h1>
              <p className="text-muted-foreground mt-2">The world's fastest database exploration tool</p>
            </div>
          </div>

          {/* The Story */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">The Story</h2>
            <div className="text-muted-foreground space-y-3">
              <p>
                I used to pay $200+ for DataGrip and loved their interface. But when I started a new role, 
                I couldn't justify the cost, so I switched to DBeaver.
              </p>
              <p>
                While I appreciated that DBeaver was free and it served its purpose, it required way too 
                many clicks just to get to a simple table view.
              </p>
              <p>
                I thought to myself: <span className="italic">"I bet I could build a better SQL viewer in a 
                weekend with the way AI coding is going"</span> — and Datagres was born.
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Built for Speed & Simplicity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">
                    Connection to data view in under 15 seconds
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Command className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Keyboard-Driven</h3>
                  <p className="text-sm text-muted-foreground">
                    Cmd+K navigation, Shift+Shift for quick search
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <MousePointer2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Zero Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste your connection string and start exploring
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Safe Editing</h3>
                  <p className="text-sm text-muted-foreground">
                    Preview SQL before execution, transaction safety
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Technical Details</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Built with Electron, React, and TypeScript</p>
              <p>• Secure credential storage using OS keychain</p>
              <p>• Virtual scrolling for blazing-fast table rendering</p>
              <p>• Currently supports PostgreSQL</p>
            </div>
          </div>

          {/* Contribute */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Feedback & Contributions</h2>
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Found a bug? Have a suggestion? Feel free to open an issue on GitHub.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Note: This is a personal project that already serves my needs perfectly, so there are no 
                promises on feature requests — but I'd love to hear your ideas!
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open('https://github.com/seePatCode/datagres', '_blank')}
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </div>
          </div>

          {/* Version */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Version {process.env.npm_package_version || '1.0.0'}</p>
            <p className="mt-1">Made with ❤️ by someone who just wanted fewer clicks</p>
          </div>
        </div>
      </div>
    </div>
  )
}