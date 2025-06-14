# Datagres Architecture

This document provides a detailed overview of Datagres's architecture and technical design.

## Overview

Datagres is built on Electron's three-process architecture, ensuring security through process isolation and optimal performance through dedicated processes for different concerns.

## High-Level Architecture

![Architecture Overview](docs/architecture.svg)

## Data Flow

The application follows a unidirectional data flow pattern:

![Data Flow](docs/data-flow-simple.svg)

## Process Architecture

### 1. Main Process (`src/main/`)

The main process is the entry point of the application and handles:

- **IPC Communication**: Manages all inter-process communication
- **Database Operations**: Direct PostgreSQL connections using `pg` library
- **Security**: Credential storage using OS keychain (keytar) and encrypted storage
- **Window Management**: Creates and manages application windows
- **Menu Building**: Native application menus

Key files:
- `index.js` - IPC handlers and app lifecycle (streamlined to 147 lines)
- `services/connectionStore.js` - Secure credential storage
- `services/databaseService.js` - PostgreSQL operations
- `services/windowManager.js` - Window lifecycle
- `services/menuBuilder.js` - Application menus

### 2. Preload Script (`src/preload/`)

Acts as a secure bridge between the renderer and main processes:

- Exposes a limited API surface through `contextBridge`
- Prevents direct access to Node.js APIs from the renderer
- Validates and sanitizes IPC messages

### 3. Renderer Process (`src/renderer/`)

The UI layer built with modern web technologies:

- **React 19.1**: Component-based UI with hooks
- **TypeScript**: Full type safety
- **Redux Toolkit**: Application state management
- **TanStack Query**: Server state and caching
- **TanStack Table**: Virtual scrolling data grid
- **Tailwind CSS + shadcn/ui**: Modern styling

## State Management

![State Management](kb/state-management-overview.png)

### Redux Store Structure

```typescript
{
  connection: {
    isConnected: boolean
    connectionString: string
    savedConnections: SavedConnection[]
    databases: DatabaseInfo[]
  },
  settings: {
    theme: 'light' | 'dark'
    autoConnect: boolean
  },
  ui: {
    selectedDatabase: string
    selectedTable: string
    searchQuery: string
  },
  tabs: {
    tabs: Tab[]
    activeTabId: string
  }
}
```

### Data Flow Pattern

1. User Action → React Component
2. Component → Redux Action or TanStack Query Mutation
3. Action/Mutation → IPC Call via Window API
4. Main Process → Database Operation
5. Response → State Update
6. State Update → UI Re-render

## Security Architecture

### Credential Storage

- **Passwords**: Stored in OS keychain using `keytar`
  - macOS: Keychain Access
  - Windows: Windows Credential Manager
  - Linux: Secret Service API
- **Connection Metadata**: Encrypted using `electron-store`
- **Graceful Fallback**: Works without keytar, storing encrypted passwords

### Process Isolation

- No direct Node.js access from renderer
- All database operations in main process
- Validated IPC communication
- Content Security Policy enforced

## Performance Optimizations

### Virtual Scrolling

- TanStack Table with virtualization
- Only renders visible rows
- Handles millions of rows efficiently
- 100 rows loaded per page

### Caching Strategy

- TanStack Query caches all data fetches
- Stale-while-revalidate pattern
- Optimistic updates for better UX
- Intelligent cache invalidation

### Bundle Optimization

- Separate builds for each process
- Tree shaking and minification
- Lazy loading for heavy components
- Module bundling with electron-vite

## Module System

### Path Aliases

- `@/` → `src/renderer/`
- `@shared/` → `src/shared/`
- `@services/` → `src/main/services/`
- `@utils/` → `src/main/utils/`

### Build Configuration

```javascript
// electron.vite.config.mjs
{
  main: {
    // CommonJS for Node.js compatibility
    build: {
      rollupOptions: {
        external: ['electron', 'pg', ...],
        output: { inlineDynamicImports: true }
      }
    }
  },
  renderer: {
    // ES Modules for modern browsers
    resolve: {
      alias: { '@': '/src/renderer' }
    }
  }
}
```

## Database Architecture

### Connection Management

```javascript
// Automatic SSL detection for cloud providers
if (host.includes('amazonaws.com') || 
    host.includes('heroku') || 
    host.includes('azure')) {
  ssl = { rejectUnauthorized: false }
}
```

### Query Execution

- Prepared statements for security
- Connection pooling for performance
- Automatic reconnection handling
- Transaction support

## Testing Architecture

### E2E Tests (Playwright)

- Complete user journeys
- Visual regression testing
- Cross-platform testing
- Mock data in test mode

### Unit Tests (Vitest)

- Pure function testing
- Component testing
- State management testing
- Service layer testing

## Deployment Architecture

### Distribution

- Electron Builder for packaging
- Code signing for security
- Auto-update support
- Cross-platform builds

### Platform-Specific Features

- **macOS**: Native menu bar, dock integration
- **Windows**: System tray, native notifications
- **Linux**: AppImage for distribution

## Future Architecture Considerations

### Planned Improvements

1. **Plugin System**: Allow third-party extensions
2. **Multi-Database**: Support for MySQL, SQLite, MongoDB
3. **Collaboration**: Real-time collaborative features
4. **Cloud Sync**: Sync connections across devices
5. **Performance**: WebAssembly for heavy computations

### Scalability

- Modular service architecture
- Clear separation of concerns
- Extensible IPC protocol
- Plugin-ready architecture