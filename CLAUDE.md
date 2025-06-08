# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm start` - Build and start the Electron app in preview mode  
- `npm run build` - Build for production

### Testing
- `npm test` - Run Playwright e2e tests
- `npm test:headed` - Run tests with visible browser (for debugging)
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:coverage` - Run unit tests with coverage report

## Architecture Overview

**Datagres** is an Electron-based PostgreSQL database explorer built for speed and simplicity. The app follows Electron's three-process architecture with a modular design for scalability:

### Main Process (`src/main/`)
- **Entry Point** (`index.js`): IPC handlers and application lifecycle (147 lines, reduced from 766)
- **Services** (`services/`):
  - `connectionStore.js`: Secure storage for database connections using `electron-store` (encrypted) + `keytar` (OS keychain)
  - `databaseService.js`: PostgreSQL operations and test mocking
  - `menuBuilder.js`: Application menu construction
  - `windowManager.js`: Window creation and control
- **Module Bundling**: All services are bundled into a single file during build via electron-vite configuration

### Preload Script (`src/preload/index.js`)
- **Security Bridge**: Exposes safe database API via `contextBridge`
- **API Surface**: Connection management, table data fetching, saved connections

### Renderer Process (`src/renderer/`)
- **React + TypeScript**: Modern React with hooks and strict typing
- **TanStack Query**: Server state management with caching and mutations
- **TanStack Table**: Advanced data grid with virtual scrolling
- **Tailwind + shadcn/ui**: Component library built on Radix UI primitives

### Shared Types (`src/shared/types.ts`)
- **Type Definitions**: Centralized TypeScript types for IPC communication
- **API Contracts**: Ensures type safety between main and renderer processes
- **Data Models**: SavedConnection, TableInfo, API responses

## Key Technical Patterns

### Connection Management
- **Storage**: Connection metadata encrypted in electron-store, passwords in OS keychain
- **Auto-reconnect**: App automatically connects to most recently used database on startup
- **Connection String Parsing**: Robust PostgreSQL URL validation and parsing
- **Security**: Graceful degradation when security libraries unavailable

### Data Flow
```
User Action → React Query Mutation → IPC Call → Main Process → PostgreSQL → Response → UI Update
```

### Component Architecture
- **App.tsx**: Central state manager with view routing (`connect` | `tables` | `tableData`)
- **ConnectionManager**: Persistent CRUD operations for saved connections
- **DataTable**: Virtual scrolling grid with advanced features

### Error Handling
- All IPC operations return `{success: boolean, error?: string, ...data}` pattern
- Graceful fallbacks when optional dependencies (keytar) unavailable
- User-friendly error messages with technical details in console

## Development Guidelines

### Adding Database Operations
1. Add IPC handler in main process (`src/main/index.js`)
2. Add mock response for test mode
3. Expose via preload script (`src/preload/index.js`) 
4. Add TypeScript declaration in App.tsx global interface
5. Use React Query mutation/query in components

### Adding New Services/Modules
1. Create module in `src/main/services/` or `src/main/utils/`
2. Add module path to `externalizeDepsPlugin` exclude list in `electron.vite.config.mjs`
3. Import and use in main process
4. Module will be automatically bundled during build

### Component Development
- Follow existing shadcn/ui patterns for new components
- **NEVER manually create shadcn components** - always use `pnpm dlx shadcn@latest add [component]`
- Use `pnpm` instead of `npx` for better peer dependency management with React 19
- If you have trouble installing a shadcn component, check with the user instead of creating it manually
- Use Tailwind utilities, avoid custom CSS
- Implement proper loading states and error handling
- Add data-testid attributes for e2e testing

### Testing Strategy
- **Always implement in a TDD approach**
- **E2E Tests**: Playwright tests in `tests/e2e/` cover complete user journeys
- **Test Mode**: Set `NODE_ENV=test` for consistent mocking
- **Mock Data**: Deterministic test database responses in main process
- **IMPORTANT**: Never run `npm start` in Claude Code - only the user should run it. Find alternative verification methods or ask the user to test

### Build Configuration
- **electron-vite**: Separate builds for main/preload (CommonJS) and renderer (ES modules)
- **Path Aliases**: 
  - Renderer: `@/` maps to `src/renderer/`
  - Main: `@services` maps to `src/main/services/`, `@utils` maps to `src/main/utils/`
- **Module Bundling**: Internal modules excluded from externalization and bundled via `inlineDynamicImports`
- **TypeScript**: Full type checking in renderer, JavaScript in main/preload
- **ESM Handling**: Dynamic imports for ESM-only packages (e.g., electron-store v10)

## Important Files

### Main Process
- `src/main/index.js` - IPC handlers and app lifecycle
- `src/main/services/connectionStore.js` - Connection storage logic

### Renderer Process  
- `src/renderer/App.tsx` - Central application state and routing
- `src/renderer/components/ui/connection-manager.tsx` - Connection CRUD operations
- `src/renderer/components/ui/data-table.tsx` - Advanced data grid

### Configuration
- `electron.vite.config.mjs` - Multi-process build configuration with module bundling
- `tests/e2e/app.spec.js` - Complete user journey tests

## Product Vision

Datagres aims to be "the world's fastest database exploration tool" with a focus on:
- **Speed**: Connection to data view in under 15 seconds
- **Keyboard-driven**: Cmd+K navigation, minimal mouse usage
- **Zero configuration**: Paste connection string and start exploring
- **Safe editing**: Preview SQL before execution, transaction safety

The app currently supports PostgreSQL with plans for MySQL, SQLite, and MongoDB support in future versions.