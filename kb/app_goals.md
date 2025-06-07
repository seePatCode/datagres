# Database Explorer - Product Requirements Document

## Project Overview

### Vision
Build the world's fastest database exploration tool that eliminates all friction between developers and their data. From connection string to editing data in under 15 seconds.

### Core Value Proposition
- **Instant Connection**: Paste connection string → Connected
- **Rapid Navigation**: Cmd+K → Table name → See data
- **Smart Filtering**: Natural language → SQL queries
- **Safe Editing**: Edit in grid → Preview SQL → Save

### Target Users
- Developers who work with multiple databases daily
- Teams tired of clunky database GUI tools
- Anyone who values speed and keyboard-driven workflows

## Feature Requirements

### 1. Connection Management

#### 1.1 Instant Connection Setup
```
REQUIREMENT: Support copy-paste connection from common formats
- PostgreSQL: postgresql://user:pass@host:5432/dbname
- MySQL: mysql://user:pass@host:3306/dbname  
- SQLite: sqlite:///path/to/database.db
- MongoDB: mongodb://user:pass@host:27017/dbname
- .env format: DATABASE_URL=postgresql://...
```

#### 1.2 Connection Features
- **Auto-detection**: Identify database type from connection string
- **Multi-line paste**: Extract all database URLs from pasted .env files
- **Quick test**: One-click connection test with clear success/error
- **Recent connections**: Dropdown with last 10 connections
- **Connection status**: Visual indicator (green = connected, red = error)
- **No configuration**: Zero config files or driver installation

### 2. Navigation System

#### 2.1 Command Palette (Cmd+K)
```
BEHAVIOR: Pressing Cmd+K opens command palette
- Fuzzy search across all tables and views
- Show row count next to each table
- Recent tables appear at top
- Show column preview on hover
- Enter key opens selected table
- Escape key closes palette
```

#### 2.2 Schema Cache
- Load all table/view names on connection
- Cache column information in background
- Update cache on schema changes
- Memory-efficient storage for large schemas

### 3. Data Grid View

#### 3.1 Smart Data Loading
```sql
-- Default query for any table
SELECT * FROM [table] 
ORDER BY [primary_key] DESC 
LIMIT 1000
```

#### 3.2 Grid Features
- **Virtual scrolling**: Handle millions of rows without lag
- **Column management**:
  - Resize columns (persist preferences)
  - Reorder columns via drag
  - Pin columns to left
  - Hide/show columns
- **Cell rendering**:
  - JSON pretty print for JSON columns
  - Truncate long text with expand on hover
  - Format dates/timestamps readably
  - Show NULL as gray italic text
- **Selection**:
  - Click row number to select row
  - Shift+click for range selection
  - Cmd+click for multi-select
  - Cmd+A to select all visible

### 4. Filtering System

#### 4.1 Natural Language Filter Bar
```
EXAMPLES:
Input: "john"
SQL: WHERE column1 LIKE '%john%' OR column2 LIKE '%john%' ...

Input: "email:@gmail.com"  
SQL: WHERE email LIKE '%@gmail.com%'

Input: "age:>25"
SQL: WHERE age > 25

Input: "created:2024-01"
SQL: WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'

Input: "status:active age:<30"
SQL: WHERE status = 'active' AND age < 30

Input: "name:john OR name:jane"
SQL: WHERE name LIKE '%john%' OR name LIKE '%jane%'
```

#### 4.2 Filter Features
- **Real-time**: Apply on keyup (300ms debounce)
- **SQL preview**: Show generated WHERE clause
- **Clear button**: One-click filter reset
- **Save filters**: Save commonly used filters
- **Column detection**: Auto-detect column names in search

#### 4.3 Column Header Filters
Click column header to show:
- Sort ascending/descending
- Filter for NULL/NOT NULL
- For numeric: >, <, =, BETWEEN
- For text: Contains, Starts with, Ends with
- For dates: Today, Yesterday, This week, This month
- For booleans: True, False, NULL

### 5. Inline Editing

#### 5.1 Edit Modes
- **Double-click**: Enter edit mode for cell
- **F2**: Edit selected cell
- **Tab**: Save and move right
- **Enter**: Save and move down
- **Escape**: Cancel edit
- **Click outside**: Save and exit edit mode

#### 5.2 Smart Editors
```
COLUMN TYPE → EDITOR
- text/varchar → Text input
- integer/numeric → Number input
- boolean → Checkbox
- date → Date picker
- timestamp → DateTime picker
- json → JSON editor with validation
- foreign key → Dropdown (lazy load options)
- enum → Dropdown with valid values
```

#### 5.3 Edit Tracking
- **Visual indicators**:
  - Yellow background for edited cells
  - Red border for validation errors
  - Green flash on successful save
- **Undo/Redo**: Ctrl+Z/Ctrl+Shift+Z
- **Bulk operations**: Edit multiple selected cells

#### 5.4 Save System
```
SAVE WORKFLOW:
1. Edit cells → "Save Changes (3)" button appears
2. Click button → Show SQL preview dialog
3. Preview shows:
   UPDATE users SET name = 'John' WHERE id = 1;
   UPDATE users SET email = 'john@example.com' WHERE id = 2;
4. Confirm → Execute with transaction
5. Success → Green toast, cells return to normal
6. Error → Red toast, highlight problem cells
```

### 6. Performance Requirements

#### 6.1 Speed Targets
- **Initial connection**: < 2 seconds
- **Cmd+K to data visible**: < 500ms  
- **Filter application**: < 200ms
- **Scroll performance**: 60fps
- **Cell edit response**: < 50ms

#### 6.2 Scale Targets
- Handle schemas with 1000+ tables
- Display tables with 1M+ rows
- Support 100+ columns without lag
- Handle cells with 10KB+ text

### 7. Keyboard Shortcuts

```
GLOBAL:
Cmd+K          → Open command palette
Cmd+Shift+P    → Open connection dialog
Cmd+R          → Refresh current table
Cmd+W          → Close current tab

GRID:
Cmd+F          → Focus filter bar
F2             → Edit selected cell
Delete         → Clear cell value
Cmd+S          → Save pending changes
Cmd+Z          → Undo last edit
Space          → Toggle row selection

NAVIGATION:
Tab            → Next cell
Shift+Tab      → Previous cell
Arrow keys     → Move selection
Page Up/Down   → Scroll page
Home/End       → Start/end of row
```

### 8. Safety Features

#### 8.1 Connection Safety
- Default to read-only connections
- Explicit toggle for write permissions
- Visual indicator for write mode (red border)

#### 8.2 Edit Safety
- Require explicit save action
- Show SQL preview before execution
- Warn on edits to tables with >10K rows
- Confirm before DELETE operations
- Transaction wrapper for multi-row edits

#### 8.3 Data Integrity
- Validate against column constraints
- Prevent invalid type conversions
- Show foreign key violations
- Rollback on any error

## Technical Specifications

### Supported Databases
1. **PostgreSQL** (9.6+)
2. **MySQL** (5.7+) / MariaDB
3. **SQLite** (3.x)
4. **MongoDB** (4.0+) - basic support

### Architecture Guidelines
- **Frontend**: React with virtualized grid
- **State management**: Lightweight, optimized for speed
- **Connection pooling**: Reuse connections efficiently
- **Worker threads**: Run queries off main thread
- **IndexedDB**: Cache schema and preferences
- **WebSocket**: Optional for real-time updates

### Security Requirements
- Never store passwords in plain text
- Use secure connection protocols
- Sanitize all user inputs
- Implement query timeouts
- Rate limit expensive operations

## Success Metrics

### User Experience Metrics
- Time to first data view: < 10 seconds
- Time to find specific row: < 5 seconds
- Filter application time: < 200ms
- Zero configuration files needed

### Adoption Metrics
- Daily active users
- Average session duration
- Tables accessed per session
- Filters used per session
- Edit operations per session

## Out of Scope (v1)

- Visual query builder
- Schema modification tools
- Database migrations
- User management/permissions
- Charts/visualizations
- Export functionality
- Stored procedure management
- Database monitoring/metrics
- Collaboration features
- Mobile support

## Future Considerations

### Phase 2 Features
- Multi-database connections
- SQL query tabs
- Export to CSV/JSON
- Basic JOIN interface
- Query history

### Phase 3 Features  
- Schema visualization
- Query performance analysis
- Team workspaces
- API access
- Plugin system

## Design Principles

1. **Speed First**: Every millisecond counts
2. **Keyboard Driven**: Mouse is optional
3. **Zero Configuration**: Works out of the box
4. **Show The SQL**: Always show what's happening
5. **Safe By Default**: Protect users from mistakes
6. **Progressive Disclosure**: Simple tasks simple, complex tasks possible

---

## Implementation Notes

### Critical Path
1. Connection system with .env parsing
2. Basic grid with virtual scrolling
3. Cmd+K navigation
4. Natural language filtering
5. Inline editing with save

### Testing Requirements
- Unit tests for SQL generation
- Integration tests for each database type
- Performance benchmarks for large datasets
- Keyboard navigation tests
- Data integrity tests for edits

### Documentation Needs
- Quick start guide
- Keyboard shortcut reference
- Filter syntax guide
- Connection string examples
- Troubleshooting guide