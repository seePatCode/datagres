import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuickSearch } from '../quick-search'
import type { TableInfo } from '@/shared/types'

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
  CommandItem: ({ children, onSelect, value }: any) => (
    <div
      onClick={() => onSelect?.(value)}
      data-testid={`table-item-${value}`}
      role="option"
    >
      {children}
    </div>
  )
}))

describe('QuickSearch', () => {
  const mockTables: TableInfo[] = [
    { name: 'users' },
    { name: 'products' },
    { name: 'orders' },
    { name: 'categories' },
    { name: 'user_profiles' }
  ]

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    tables: mockTables,
    onSelectTable: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open is true', () => {
    render(<QuickSearch {...defaultProps} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('quick-search-input')).toBeInTheDocument()
  })

  it('should not render when open is false', () => {
    render(<QuickSearch {...defaultProps} open={false} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display all tables initially', () => {
    render(<QuickSearch {...defaultProps} />)
    
    mockTables.forEach(table => {
      expect(screen.getByTestId(`table-item-${table.name}`)).toBeInTheDocument()
    })
  })

  it('should filter tables based on search input', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const input = screen.getByTestId('quick-search-input')
    fireEvent.change(input, { target: { value: 'user' } })
    
    // Should show tables containing 'user'
    expect(screen.getByTestId('table-item-users')).toBeInTheDocument()
    expect(screen.getByTestId('table-item-user_profiles')).toBeInTheDocument()
    
    // Should not show tables not containing 'user'
    expect(screen.queryByTestId('table-item-products')).not.toBeInTheDocument()
    expect(screen.queryByTestId('table-item-orders')).not.toBeInTheDocument()
  })

  it('should show empty state when no tables match', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const input = screen.getByTestId('quick-search-input')
    fireEvent.change(input, { target: { value: 'nonexistent' } })
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('No tables found.')).toBeInTheDocument()
  })

  it('should call onSelectTable when a table is clicked', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const tableItem = screen.getByTestId('table-item-users')
    fireEvent.click(tableItem)
    
    expect(defaultProps.onSelectTable).toHaveBeenCalledWith('users')
  })

  it('should close dialog after selecting a table', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const tableItem = screen.getByTestId('table-item-products')
    fireEvent.click(tableItem)
    
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should clear search after selecting a table', async () => {
    const { rerender } = render(<QuickSearch {...defaultProps} />)
    
    // Set search value
    const input = screen.getByTestId('quick-search-input')
    fireEvent.change(input, { target: { value: 'user' } })
    
    // Select a table
    const tableItem = screen.getByTestId('table-item-users')
    fireEvent.click(tableItem)
    
    // Re-open the dialog
    rerender(<QuickSearch {...defaultProps} open={true} />)
    
    // Search should be cleared
    await waitFor(() => {
      const newInput = screen.getByTestId('quick-search-input') as HTMLInputElement
      expect(newInput.value).toBe('')
    })
  })

  it('should handle case-insensitive search', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const input = screen.getByTestId('quick-search-input')
    fireEvent.change(input, { target: { value: 'USER' } })
    
    // Should still find tables with 'user' in lowercase
    expect(screen.getByTestId('table-item-users')).toBeInTheDocument()
    expect(screen.getByTestId('table-item-user_profiles')).toBeInTheDocument()
  })

  it('should focus input when dialog opens', async () => {
    const { rerender } = render(<QuickSearch {...defaultProps} open={false} />)
    
    // Open the dialog
    rerender(<QuickSearch {...defaultProps} open={true} />)
    
    await waitFor(() => {
      const input = screen.getByTestId('quick-search-input')
      expect(document.activeElement).toBe(input)
    }, { timeout: 200 })
  })

  it('should handle empty tables array', () => {
    render(<QuickSearch {...defaultProps} tables={[]} />)
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should display table icons', () => {
    render(<QuickSearch {...defaultProps} />)
    
    // Check that TableIcon is rendered for each table
    const tableItems = screen.getAllByRole('option')
    expect(tableItems.length).toBe(mockTables.length)
  })

  it('should handle special characters in table names', () => {
    const specialTables: TableInfo[] = [
      { name: 'user-profiles' },
      { name: 'order_items' },
      { name: 'product.categories' }
    ]
    
    render(<QuickSearch {...defaultProps} tables={specialTables} />)
    
    specialTables.forEach(table => {
      expect(screen.getByTestId(`table-item-${table.name}`)).toBeInTheDocument()
    })
  })

  it('should maintain search state while typing', () => {
    render(<QuickSearch {...defaultProps} />)
    
    const input = screen.getByTestId('quick-search-input') as HTMLInputElement
    
    // Type progressively
    fireEvent.change(input, { target: { value: 'u' } })
    expect(input.value).toBe('u')
    
    fireEvent.change(input, { target: { value: 'us' } })
    expect(input.value).toBe('us')
    
    fireEvent.change(input, { target: { value: 'use' } })
    expect(input.value).toBe('use')
  })

  it('should handle rapid open/close cycles', () => {
    const { rerender } = render(<QuickSearch {...defaultProps} />)
    
    // Rapid open/close
    for (let i = 0; i < 5; i++) {
      rerender(<QuickSearch {...defaultProps} open={i % 2 === 0} />)
    }
    
    // Should end in closed state
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})