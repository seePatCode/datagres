import { memo, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from "@/components/ui/button"
import { TitleBar } from "@/components/ui/title-bar"
import { DatabaseSidebar } from "@/components/ui/database-sidebar"
import { TableView } from "@/components/ui/table-view"
import { SQLQueryView } from "@/components/ui/sql-query-view"
// SaveConnectionDialog removed - connections are now auto-saved
import { QuickSearch } from "@/components/ui/quick-search"
import { EditConnectionDialog } from "@/components/ui/edit-connection-dialog"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { X } from 'lucide-react'
import { useDoubleShift } from '@/hooks/useDoubleShift'
import { useTabManagement } from '@/hooks/useTabManagement'
import type { AppDispatch } from '@/store/store'
import type { SavedConnection } from '@shared/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import {
  selectActiveConnection,
  selectCurrentDatabase,
  selectTables,
  selectSchemas,
  selectSavedConnections,
  loadAndConnectToSavedConnection,
  saveConnection,
  loadSavedConnections,
  deleteConnection,
  updateConnectionName,
} from '@/store/slices/connectionSlice'
import {
  selectTabs,
  selectActiveTabId,
  selectRecentTables,
  selectStarredTables,
  selectOrAddTableTab,
  setActiveTab,
  closeAllTabs,
  closeOtherTabs,
  addQueryTab,
  toggleTableStar,
  isTableStarred,
} from '@/store/slices/tabsSlice'
import {
  selectCanGoBack,
  selectCanGoForward,
  navigateBack,
  navigateForward,
  pushNavigationEntry,
} from '@/store/slices/uiSlice'

const MemoizedTableView = memo(TableView)
const MemoizedSQLQueryView = memo(SQLQueryView)

interface ExplorerViewProps {
  onShowHelp?: () => void
}

export function ExplorerView({ onShowHelp }: ExplorerViewProps = {}) {
  const dispatch = useDispatch<AppDispatch>()
  
  // Redux state
  const activeConnection = useSelector(selectActiveConnection)
  const currentDatabase = useSelector(selectCurrentDatabase)
  const tables = useSelector(selectTables)
  const schemas = useSelector(selectSchemas)
  const savedConnections = useSelector(selectSavedConnections)
  const connectionString = activeConnection?.connectionString || ''
  const tabs = useSelector(selectTabs(connectionString))
  const activeTabId = useSelector(selectActiveTabId(connectionString))
  const recentTables = useSelector(selectRecentTables(connectionString))
  const starredTables = useSelector(selectStarredTables(connectionString))
  // Removed showSaveDialog and pendingConnectionString - connections are now auto-saved
  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)
  
  // Find current connection from saved connections
  const currentConnection = activeConnection?.savedConnectionId
    ? savedConnections.find(c => c.id === activeConnection.savedConnectionId)
    : undefined
  
  // Local state
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SavedConnection | null>(null)
  
  // Set up double-shift keyboard shortcut
  useDoubleShift({
    onDoubleShift: () => setQuickSearchOpen(true)
  })
  
  
  // Actions
  const handleConnectionChange = (connectionId: string) => {
    dispatch(loadAndConnectToSavedConnection(connectionId))
  }
  
  const handleTableSelect = (tableName: string, schemaName?: string) => {
    if (connectionString) {
      // If schema is provided, use fully qualified name
      const tabName = schemaName && schemaName !== 'public' ? `${schemaName}.${tableName}` : tableName
      dispatch(selectOrAddTableTab({ connectionString, tableName: tabName }))
    }
  }
  
  const { closeTab: handleCloseTab, updateTab: handleUpdateTab } = useTabManagement(connectionString || '')
  
  const handleCloseAllTabs = () => {
    if (connectionString) {
      dispatch(closeAllTabs({ connectionString }))
    }
  }
  
  const handleCloseOtherTabs = (tabId: string) => {
    if (connectionString) {
      dispatch(closeOtherTabs({ connectionString, tabId }))
    }
  }
  
  const handleSetActiveTabId = (tabId: string) => {
    if (connectionString) {
      dispatch(setActiveTab({ connectionString, tabId }))
      dispatch(pushNavigationEntry({ type: 'tab', tabId }))
    }
  }
  
  const handleNewQueryTab = (query?: string) => {
    if (connectionString) {
      // Ensure query is a string (not an event)
      const queryString = typeof query === 'string' ? query : undefined
      dispatch(addQueryTab({ connectionString, initialQuery: queryString }))
    }
  }
  
  
  // handleSaveConnection removed - connections are now auto-saved
  
  const handleNavigateBack = () => dispatch(navigateBack())
  const handleNavigateForward = () => dispatch(navigateForward())
  
  const handleEditConnection = (connection: SavedConnection) => {
    setEditingConnection(connection)
    setEditDialogOpen(true)
  }
  
  const handleDeleteConnection = async (connectionId: string) => {
    await dispatch(deleteConnection(connectionId))
    dispatch(loadSavedConnections())
  }
  
  const handleSaveEdit = async (newName: string) => {
    if (editingConnection) {
      await dispatch(updateConnectionName({ connectionId: editingConnection.id, newName }))
      dispatch(loadSavedConnections())
      setEditDialogOpen(false)
      setEditingConnection(null)
    }
  }
  
  const handleToggleTableStar = (tableName: string) => {
    if (connectionString) {
      dispatch(toggleTableStar({ connectionString, tableName }))
    }
  }
  
  const checkIsTableStarred = (tableName: string) => {
    const state = { tabs: { starredTables: { [connectionString]: starredTables } } }
    return starredTables.some(t => t.name === tableName)
  }
  
  // getDefaultConnectionName removed - connections are now auto-saved

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Fixed header area */}
      <div className="flex-none">
        <TitleBar 
          title={(() => {
            const activeTab = tabs.find(t => t.id === activeTabId)
            if (!activeTab) return `Datagres - ${currentDatabase}`
            if (activeTab.type === 'table') return `Datagres - ${activeTab.tableName}`
            return `Datagres - ${activeTab.title}`
          })()}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          canGoBack={!!canGoBack}
          canGoForward={!!canGoForward}
        />
      </div>
      
      {/* Main layout with resizable panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          <ResizablePanel defaultSize={25} minSize={5} maxSize={95}>
            <div className="h-full w-full overflow-hidden">
              <DatabaseSidebar
                connections={savedConnections}
                currentConnection={currentConnection}
                tables={tables}
                schemas={schemas}
                recentTables={recentTables}
                starredTables={starredTables}
                onConnectionChange={handleConnectionChange}
                onTableSelect={handleTableSelect}
                onToggleTableStar={handleToggleTableStar}
                isTableStarred={checkIsTableStarred}
                selectedTable={(() => {
                  const activeTab = tabs.find(t => t.id === activeTabId)
                  return activeTab && activeTab.type === 'table' ? activeTab.tableName : ''
                })()}
                onNewQuery={handleNewQueryTab}
                onEditConnection={handleEditConnection}
                onDeleteConnection={handleDeleteConnection}
                connectionString={connectionString}
                className="h-full"
              />
            </div>
          </ResizablePanel>
          
          {/* Resize handle */}
          <ResizableHandle />
          
          {/* Main content panel */}
          <ResizablePanel defaultSize={75} minSize={5}>
            {tabs.length > 0 ? (
              <Tabs value={activeTabId || ''} onValueChange={handleSetActiveTabId} className="h-full flex flex-col">
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
                              <span className="max-w-[150px] truncate">
                                {tab.type === 'table' ? tab.tableName : tab.title}
                              </span>
                            </TabsTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCloseTab(tab.id)
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleCloseTab(tab.id)}>
                            <span className="flex items-center justify-between w-full">
                              Close
                              <span className="text-xs text-muted-foreground ml-4">⌘W</span>
                            </span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={handleCloseAllTabs}>
                            <span className="flex items-center justify-between w-full">
                              Close All
                              <span className="text-xs text-muted-foreground ml-4">⌘⇧W</span>
                            </span>
                          </ContextMenuItem>
                          <ContextMenuItem 
                            onClick={() => handleCloseOtherTabs(tab.id)}
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
                    className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden h-full"
                    forceMount
                  >
                    {tab.type === 'table' ? (
                      <MemoizedTableView
                        key={`${tab.id}_${tab.tableName}`}
                        tableName={tab.tableName}
                        connectionString={connectionString}
                        initialSearchTerm={tab.searchTerm}
                        initialPageSize={(tab as any).pageSize || DEFAULT_PAGE_SIZE}
                        onSearchChange={(searchTerm) => handleUpdateTab(tab.id, { searchTerm })}
                        tables={tables}
                      />
                    ) : (
                      <MemoizedSQLQueryView
                        key={tab.id}
                        connectionString={connectionString}
                        initialQuery={tab.query}
                        onQueryChange={(query) => handleUpdateTab(tab.id, { query })}
                        tables={tables}
                      />
                    )}
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
      
      {/* SaveConnectionDialog removed - connections are now auto-saved */}
      
      {/* Quick Search Dialog */}
      <QuickSearch
        open={quickSearchOpen}
        onOpenChange={setQuickSearchOpen}
        tables={tables}
        schemas={schemas}
        onSelectTable={handleTableSelect}
        savedConnections={savedConnections}
        onSelectConnection={handleConnectionChange}
        currentConnectionId={activeConnection?.savedConnectionId}
      />
      
      {/* Edit Connection Dialog */}
      {editingConnection && (
        <EditConnectionDialog
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          connectionName={editingConnection.name}
          connectionString={editingConnection.originalConnectionString || ''}
          isLoading={false}
          onSave={handleSaveEdit}
          onCancel={() => {
            setEditDialogOpen(false)
            setEditingConnection(null)
          }}
        />
      )}
    </div>
  )
}