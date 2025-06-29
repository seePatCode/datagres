import { useState, useEffect } from 'react'
import { Keyboard, Search, Database, Table, FileText, Command } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface ShortcutItemProps {
  keys: string[]
  description: string
  icon?: React.ReactNode
}

function ShortcutItem({ keys, description, icon }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm">{description}</span>
      </div>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-b-2 border-muted-foreground/20 rounded">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

interface HelpDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function HelpDialog({ open, onOpenChange, trigger }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('0.3.4')
  
  // Use controlled state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen
  const setDialogOpen = onOpenChange || setIsOpen

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdKey = isMac ? '⌘' : 'Ctrl'

  useEffect(() => {
    // Fetch app version when dialog opens
    if (dialogOpen && window.electronAPI?.appVersion) {
      window.electronAPI.appVersion.then(version => {
        setAppVersion(version)
      }).catch(() => {
        setAppVersion('0.3.4')
      })
    }
  }, [dialogOpen])

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts & Help
          </DialogTitle>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts and features
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="shortcuts" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="search">Search Tips</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shortcuts" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Command className="h-4 w-4" />
                Global Shortcuts
              </h3>
              <div className="space-y-1">
                <ShortcutItem keys={['Shift', 'Shift']} description="Quick search (tables & connections)" icon={<Search className="h-4 w-4" />} />
                <ShortcutItem keys={[cmdKey, 'N']} description="New connection" icon={<Database className="h-4 w-4" />} />
                <ShortcutItem keys={[cmdKey, 'R']} description="Refresh current view" />
                <ShortcutItem keys={[cmdKey, '/']} description="Show keyboard shortcuts (this dialog)" icon={<Keyboard className="h-4 w-4" />} />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table View Shortcuts
              </h3>
              <div className="space-y-1">
                <ShortcutItem keys={['Enter']} description="Search with WHERE clause" />
                <ShortcutItem keys={[cmdKey, 'Enter']} description="Force search (bypasses autocomplete)" />
                <ShortcutItem keys={[cmdKey, 'S']} description="Save table changes" />
                <ShortcutItem keys={['Click Header']} description="Sort by column" />
                <ShortcutItem keys={['Drag Header']} description="Reorder columns" />
                <ShortcutItem keys={['Click Cell']} description="Edit cell value" />
                <ShortcutItem keys={['Escape']} description="Cancel cell edit" />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Navigation
              </h3>
              <div className="space-y-1">
                <ShortcutItem keys={[cmdKey, '1-9']} description="Switch to tab 1-9" />
                <ShortcutItem keys={[cmdKey, 'W']} description="Close current tab" />
                <ShortcutItem keys={[cmdKey, 'Shift', 'W']} description="Close all tabs" />
                <ShortcutItem keys={[cmdKey, 'Alt', 'W']} description="Close other tabs" />
                <ShortcutItem keys={[cmdKey, '[']} description="Navigate back" />
                <ShortcutItem keys={[cmdKey, ']']} description="Navigate forward" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-3">Quick Search (Shift+Shift)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Press Shift twice to open the quick search dialog:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Search Tables:</strong> Find and jump to any table in your database</li>
                <li>• <strong>Switch Connections:</strong> Quickly switch between saved database connections</li>
                <li>• <strong>Fuzzy Matching:</strong> Type partial names to filter results</li>
                <li>• <strong>Keyboard Navigation:</strong> Use arrow keys to select, Enter to confirm</li>
                <li>• <strong>Multi-Environment:</strong> Perfect for switching between dev/staging/prod</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3">SQL WHERE Clause Search</h3>
              <p className="text-sm text-muted-foreground mb-3">
                The search bar above tables accepts SQL WHERE clauses for powerful filtering:
              </p>
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                <code className="block text-sm">status = 'active'</code>
                <code className="block text-sm">age &gt; 21 AND city = 'New York'</code>
                <code className="block text-sm">name LIKE '%john%'</code>
                <code className="block text-sm">created_at &gt; '2024-01-01'</code>
                <code className="block text-sm">id IN (1, 2, 3, 4, 5)</code>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3">Search Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Autocomplete suggests column names as you type</li>
                <li>• Operators are suggested after column names</li>
                <li>• Boolean columns show true/false options</li>
                <li>• Press Enter to execute the search</li>
                <li>• Click the search icon as an alternative</li>
                <li>• Use {cmdKey}+Enter to force search when autocomplete is open</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-3">Table Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Infinite Scroll:</strong> Tables load more data as you scroll</li>
                <li>• <strong>Server-side Sorting:</strong> Click column headers to sort by that column</li>
                <li>• <strong>Column Reordering:</strong> Drag column headers to reorder</li>
                <li>• <strong>Column Visibility:</strong> Hide/show columns via the ••• menu</li>
                <li>• <strong>Inline Editing:</strong> Click any cell to edit its value</li>
                <li>• <strong>Batch Saving:</strong> Edit multiple cells and save all at once</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3">Connection Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Saved Connections:</strong> Save frequently used databases</li>
                <li>• <strong>Secure Storage:</strong> Passwords stored in system keychain</li>
                <li>• <strong>Quick Connect:</strong> Click any saved connection to connect</li>
                <li>• <strong>Auto-reconnect:</strong> Automatically connects to last used database</li>
                <li>• <strong>Multiple Databases:</strong> Work with multiple connections in tabs</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-3">Performance</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Virtual Scrolling:</strong> Handles millions of rows efficiently</li>
                <li>• <strong>Lazy Loading:</strong> Data loads on demand as you scroll</li>
                <li>• <strong>Query Caching:</strong> Results cached for 5 minutes</li>
                <li>• <strong>Optimized Rendering:</strong> Only visible cells are rendered</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">{cmdKey}+/</kbd> anytime to show this help</span>
          <span>Datagres v{appVersion}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}