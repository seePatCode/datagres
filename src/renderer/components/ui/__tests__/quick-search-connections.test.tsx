import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuickSearch } from '../quick-search'
import type { SavedConnection } from '@shared/types'

// Mock the command dialog components
vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ children, open, onOpenChange }: any) => 
    open ? <div role="dialog">{children}</div> : null,
  CommandInput: ({ placeholder, value, onValueChange, ...props }: any) => (
    <input
      {...props}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="quick-search-input"
    />
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="empty-state">{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div>
      <h3>{heading}</h3>
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, value, disabled }: any) => (
    <div
      onClick={() => !disabled && onSelect?.(value)}
      data-testid={`item-${value}`}
      data-disabled={disabled}
    >
      {children}
    </div>
  ),
}))

describe('QuickSearch with Connections', () => {
  const mockOnSelectTable = vi.fn()
  const mockOnSelectConnection = vi.fn()
  const mockOnOpenChange = vi.fn()

  const mockTables = [
    { name: 'users', schema: 'public' },
    { name: 'orders', schema: 'public' }
  ]

  const mockConnections: SavedConnection[] = [
    { id: '1', name: 'Production DB', host: 'prod.example.com', port: 5432, database: 'prod_db', username: 'admin' },
    { id: '2', name: 'Staging DB', host: 'staging.example.com', port: 5432, database: 'stage_db', username: 'admin' }
  ]

  it('should display both connections and tables', () => {
    render(
      <QuickSearch
        open={true}
        onOpenChange={mockOnOpenChange}
        tables={mockTables}
        onSelectTable={mockOnSelectTable}
        savedConnections={mockConnections}
        onSelectConnection={mockOnSelectConnection}
      />
    )

    // Check that connections are displayed
    expect(screen.getByText('Connections')).toBeDefined()
    expect(screen.getByText('Production DB')).toBeDefined()
    expect(screen.getByText('Staging DB')).toBeDefined()

    // Check that tables are displayed
    expect(screen.getByText('Tables')).toBeDefined()
    expect(screen.getByText('users')).toBeDefined()
    expect(screen.getByText('orders')).toBeDefined()
  })

  it('should filter both connections and tables based on search', () => {
    render(
      <QuickSearch
        open={true}
        onOpenChange={mockOnOpenChange}
        tables={mockTables}
        onSelectTable={mockOnSelectTable}
        savedConnections={mockConnections}
        onSelectConnection={mockOnSelectConnection}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search tables and connections...')
    
    // Search for "prod"
    fireEvent.change(searchInput, { target: { value: 'prod' } })
    
    // Should show Production DB but not Staging DB
    expect(screen.getByText('Production DB')).toBeDefined()
    expect(screen.queryByText('Staging DB')).toBeNull()
    
    // Tables should be hidden as they don't match
    expect(screen.queryByText('users')).toBeNull()
  })

  it('should mark current connection as disabled', () => {
    render(
      <QuickSearch
        open={true}
        onOpenChange={mockOnOpenChange}
        tables={mockTables}
        onSelectTable={mockOnSelectTable}
        savedConnections={mockConnections}
        onSelectConnection={mockOnSelectConnection}
        currentConnectionId="1"
      />
    )

    // Check that current connection shows "Current" label
    expect(screen.getByText('Current')).toBeDefined()
  })

  it('should call onSelectConnection when a connection is selected', () => {
    render(
      <QuickSearch
        open={true}
        onOpenChange={mockOnOpenChange}
        tables={mockTables}
        onSelectTable={mockOnSelectTable}
        savedConnections={mockConnections}
        onSelectConnection={mockOnSelectConnection}
      />
    )

    // Click on Staging DB
    fireEvent.click(screen.getByText('Staging DB'))
    
    expect(mockOnSelectConnection).toHaveBeenCalledWith('2')
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})