import { useState } from 'react'
import { Database, Plus, Settings, FileText, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MenuBarProps {
  onNewConnection: () => void
  onShowConnections: () => void
  currentView: 'connect' | 'tables' | 'tableData'
}

interface MenuDropdown {
  label: string
  items: Array<{
    label: string
    shortcut?: string
    action: () => void
    icon?: React.ReactNode
  }>
}

export function MenuBar({ onNewConnection, onShowConnections, currentView }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const menus: MenuDropdown[] = [
    {
      label: 'File',
      items: [
        {
          label: 'New Connection',
          shortcut: 'Cmd+N',
          action: onNewConnection,
          icon: <Plus className="h-4 w-4" />
        },
        {
          label: 'Saved Connections',
          shortcut: 'Cmd+Shift+O',
          action: onShowConnections,
          icon: <Database className="h-4 w-4" />
        }
      ]
    },
    {
      label: 'Edit',
      items: [
        {
          label: 'Settings',
          shortcut: 'Cmd+,',
          action: () => console.log('Settings'),
          icon: <Settings className="h-4 w-4" />
        }
      ]
    },
    {
      label: 'View',
      items: [
        {
          label: 'Command Palette',
          shortcut: 'Cmd+K',
          action: () => console.log('Command Palette'),
          icon: <FileText className="h-4 w-4" />
        }
      ]
    },
    {
      label: 'Help',
      items: [
        {
          label: 'About Datagres',
          action: () => console.log('About'),
          icon: <HelpCircle className="h-4 w-4" />
        }
      ]
    }
  ]

  const handleMenuClick = (menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel)
  }

  const handleItemClick = (action: () => void) => {
    action()
    setActiveMenu(null)
  }

  const handleClickOutside = () => {
    setActiveMenu(null)
  }

  return (
    <>
      {/* Invisible overlay to catch clicks outside */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClickOutside}
        />
      )}
      
      <div className="bg-muted border-b border-border h-8 flex items-center px-3 text-muted-foreground text-sm font-mono select-none">
        <div className="flex items-center gap-1">
          {menus.map((menu) => (
            <div key={menu.label} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs hover:bg-accent hover:text-accent-foreground ${
                  activeMenu === menu.label ? 'bg-accent text-accent-foreground' : ''
                }`}
                onClick={() => handleMenuClick(menu.label)}
              >
                {menu.label}
              </Button>
              
              {activeMenu === menu.label && (
                <div className="absolute top-6 left-0 z-50 min-w-48 bg-popover border border-border rounded-md shadow-lg py-1">
                  {menu.items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemClick(item.action)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.shortcut && (
                        <span className="text-muted-foreground text-xs">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex-1" />
        
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {currentView === 'tables' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Connected</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}