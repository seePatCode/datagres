import { memo } from 'react'
import { Button } from "@/components/ui/button"
import { TitleBar } from "@/components/ui/title-bar"
import { DatabaseSidebar } from "@/components/ui/database-sidebar"
import { TableView } from "@/components/ui/table-view"
import { SaveConnectionDialog } from "@/components/ui/save-connection-dialog"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { X } from 'lucide-react'
import type { TableInfo, TableTab } from '@shared/types'

const MemoizedTableView = memo(TableView)

interface ExplorerViewProps {
  currentDatabase: string
  tables: TableInfo[]
  recentTables: TableInfo[]
  connections: Array<{
    id: string
    name: string
    database: string
  }>
  currentConnection?: {
    id: string
    name: string
    database: string
  }
  tabs: TableTab[]
  activeTabId: string | null
  connectionString: string
  showSaveDialog: boolean
  pendingConnectionString: string
  onConnectionChange: (connectionId: string) => void
  onTableSelect: (tableName: string) => void
  onCloseTab: (tabId: string) => void
  onCloseAllTabs: () => void
  onCloseOtherTabs: (tabId: string) => void
  setShowSaveDialog: (show: boolean) => void
  onSaveConnection: (name: string) => Promise<void>
  setActiveTabId: (tabId: string) => void
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
}

export function ExplorerView({
  currentDatabase,
  tables,
  recentTables,
  connections,
  currentConnection,
  tabs,
  activeTabId,
  connectionString,
  showSaveDialog,
  pendingConnectionString,
  onConnectionChange,
  onTableSelect,
  onCloseTab,
  onCloseAllTabs,
  onCloseOtherTabs,
  setShowSaveDialog,
  onSaveConnection,
  setActiveTabId,
  onNavigateBack,
  onNavigateForward,
  canGoBack,
  canGoForward
}: ExplorerViewProps) {
  const getDefaultConnectionName = () => {
    try {
      const url = new URL(pendingConnectionString)
      const username = url.username || 'user'
      const host = url.hostname || 'localhost'
      const database = url.pathname.substring(1) || 'database'
      return `${username}@${host}/${database}`
    } catch {
      return 'New Connection'
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Fixed header area */}
      <div className="flex-none">
        <TitleBar 
          title={activeTabId && tabs.find(t => t.id === activeTabId) 
            ? `Datagres - ${tabs.find(t => t.id === activeTabId)!.tableName}` 
            : `Datagres - ${currentDatabase}`}
          onNavigateBack={onNavigateBack}
          onNavigateForward={onNavigateForward}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>
      
      {/* Main layout with resizable panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          <ResizablePanel defaultSize={25} minSize={5} maxSize={95}>
            <DatabaseSidebar
              connections={connections}
              currentConnection={currentConnection}
              tables={tables}
              recentTables={recentTables}
              onConnectionChange={onConnectionChange}
              onTableSelect={onTableSelect}
              selectedTable={tabs.find(t => t.id === activeTabId)?.tableName || ''}
            />
          </ResizablePanel>
          
          {/* Resize handle */}
          <ResizableHandle />
          
          {/* Main content panel */}
          <ResizablePanel defaultSize={75} minSize={5}>
            {tabs.length > 0 ? (
              <Tabs value={activeTabId || ''} onValueChange={setActiveTabId} className="h-full flex flex-col">
                <div className="border-b bg-background">
                  <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
                    {tabs.map(tab => (
                      <ContextMenu key={tab.id}>
                        <ContextMenuTrigger asChild>
                          <div className="relative group">
                            <TabsTrigger 
                              value={tab.id}
                              className="rounded-none border-r data-[state=active]:bg-muted data-[state=active]:shadow-none pr-8"
                            >
                              <span className="max-w-[150px] truncate">{tab.tableName}</span>
                            </TabsTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onCloseTab(tab.id)
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => onCloseTab(tab.id)}>
                            <span className="flex items-center justify-between w-full">
                              Close
                              <span className="text-xs text-muted-foreground ml-4">⌘W</span>
                            </span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={onCloseAllTabs}>
                            <span className="flex items-center justify-between w-full">
                              Close All
                              <span className="text-xs text-muted-foreground ml-4">⌘⇧W</span>
                            </span>
                          </ContextMenuItem>
                          <ContextMenuItem 
                            onClick={() => onCloseOtherTabs(tab.id)}
                            disabled={tabs.length === 1}
                          >
                            Close Others
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </TabsList>
                </div>
                {tabs.map(tab => (
                  <TabsContent 
                    key={tab.id} 
                    value={tab.id} 
                    className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden"
                    forceMount
                  >
                    <MemoizedTableView
                      key={`${tab.id}_${tab.tableName}`}
                      tableName={tab.tableName}
                      connectionString={connectionString}
                      initialSearchTerm={tab.searchTerm}
                      initialPage={tab.page}
                      initialPageSize={tab.pageSize}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a table to view data</h3>
                  <p className="text-muted-foreground">
                    Choose a table from the sidebar to start exploring your data
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Save Connection Dialog */}
      <SaveConnectionDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={onSaveConnection}
        defaultName={getDefaultConnectionName()}
      />
    </div>
  )
}