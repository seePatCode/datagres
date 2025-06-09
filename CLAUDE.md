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

### Package Management
- **Always use pnpm** for this project
- **For Electron and other packages with post-install scripts**, use the `--shamefully-hoist` flag:
  ```bash
  pnpm add -D electron --shamefully-hoist
  ```
- This prevents issues where post-install scripts create files in wrong locations
- If you encounter "module not found" errors after installing, try reinstalling with `--shamefully-hoist`

### Monaco Editor Integration
- **Async Loading Pattern**: Schema data often loads after Monaco editor mounts
  - Track both editor ready state and data availability with separate state/refs
  - Use `useEffect` with both dependencies to setup features when both are ready
  - Don't rely on data being available in the `onMount` callback
- **React Hooks Closures**: Callbacks may capture stale state values
  - Use refs (`useRef`) to access current values in callbacks
  - Sync state changes to refs with `useEffect` 
  - Use `useCallback` with empty deps array when using refs
- **Context-Aware Completions**: Analyze text before cursor to provide smart suggestions
  - Parse current position in SQL syntax (after column, operator, keyword, etc.)
  - Provide contextually appropriate suggestions (columns vs operators vs values)
  - Use `model.getValueInRange()` to get text before cursor position

### Testing Strategy
- **Always implement in a TDD approach**
- **E2E Tests**: Playwright tests in `tests/e2e/` cover complete user journeys
- **Test Mode**: Set `NODE_ENV=test` for consistent mocking
- **Mock Data**: Deterministic test database responses in main process
- **IMPORTANT**: Never run `npm start` in Claude Code - only the user should run it. Find alternative verification methods or ask the user to test

### Pre-Implementation Verification Checklist
Before claiming an implementation is complete, verify the following without running `npm start`:

1. **TypeScript Compilation**
   ```bash
   npx tsc --noEmit
   ```
   - Should complete without errors
   - Fix any type errors before proceeding

2. **Module Dependencies**
   ```bash
   # Check if all imports resolve correctly
   node -e "require('./path/to/new/file')"
   
   # For Electron-specific issues
   node -e "require('electron')"
   ```
   - Verify new files can be loaded
   - Check for missing dependencies

3. **Component Structure Verification**
   ```bash
   # Verify component exports and imports
   node -e "
   const fs = require('fs');
   const content = fs.readFileSync('path/to/component.tsx', 'utf8');
   console.log('✓ Imports:', content.includes('import'));
   console.log('✓ Export:', content.includes('export'));
   console.log('✓ Props:', content.includes('Props'));
   "
   ```

4. **Integration Points**
   ```bash
   # Check that new code is properly integrated
   grep -n "NewComponent" src/renderer/App.tsx
   grep -n "new-handler" src/main/index.js
   ```

5. **Build Process**
   ```bash
   # Quick build check (faster than full start)
   timeout 10s npm run build || echo "Build check complete"
   ```

6. **Common Error Patterns**
   - Missing shadcn/ui components: Install with `pnpm dlx shadcn@latest add [component]`
   - Electron not found: Check with `node -e "require('electron')"`
   - Import path errors: Verify `@/` aliases and relative paths
   - Missing IPC handlers: Check main/preload/renderer integration

7. **Logic Testing**
   ```bash
   # Test specific functions in isolation
   node -e "
   // Copy and test logic functions
   function myFunction() { ... }
   console.log(myFunction(testInput));
   "
   ```

8. **Unit Test Coverage (80/20 Rule)**
   Focus on testing the 20% of code that provides 80% of the value:
   
   **Core Features to Test:**
   - Connection string parsing and validation
   - Save/load connection logic
   - Database query builders (WHERE clause construction)
   - Error handling and edge cases
   - State management logic
   
   **Example Unit Test Implementation:**
   ```javascript
   // src/shared/__tests__/validation.test.ts
   describe('validateConnectionString', () => {
     test('accepts valid PostgreSQL URLs', () => {
       expect(validateConnectionString('postgresql://user:pass@localhost/db')).toBe(true);
     });
     test('rejects invalid URLs', () => {
       expect(validateConnectionString('not-a-url')).toBe(false);
     });
   });
   ```
   
   **Run Unit Tests:**
   ```bash
   npm run test:unit
   npm run test:unit:coverage
   ```
   
   **What to Test:**
   - Pure functions (parsers, validators, formatters)
   - Critical business logic (connection management, query building)
   - Error paths and edge cases
   - Data transformations
   
   **What NOT to Test:**
   - UI components (covered by e2e tests)
   - Simple getters/setters
   - Framework code
   - External library integrations

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

## Common Issues and Solutions

### Issue Log
Document issues encountered during development to help future debugging.

#### 1. Electron Failed to Install Correctly (pnpm)
**What Broke:** `npm start` failed with "Electron failed to install correctly" error
**Why It Broke:** When using pnpm, Electron's post-install script creates files in `node_modules/.ignored/electron/` instead of the expected pnpm location `node_modules/.pnpm/electron@VERSION/node_modules/electron/`
**How We Detected:** 
- Running `node -e "require('electron')"` threw the error
- `path.txt` file was missing from the pnpm electron directory
- Found the files existed in `.ignored` directory instead
**How We Fixed (Temporary):**
```bash
# Manual copy (not ideal)
cp node_modules/.ignored/electron/path.txt node_modules/.pnpm/electron@36.4.0/node_modules/electron/
cp -r node_modules/.ignored/electron/dist node_modules/.pnpm/electron@36.4.0/node_modules/electron/
```
**Proper Fix:**
```bash
# Re-install electron with proper flags
pnpm remove electron
pnpm add -D electron --shamefully-hoist
```
**Prevention:** Always use `pnpm add -D electron --shamefully-hoist` when installing Electron. This is documented in the Package Management section.

#### 2. Missing shadcn/ui Components
**What Broke:** Import errors for shadcn components (e.g., Label)
**Why It Broke:** Manually created components or forgot to install them
**How We Detected:** Vite build errors showing missing imports
**How We Fixed:** 
```bash
pnpm dlx shadcn@latest add [component-name]
```

#### 3. Connection String Validation Too Strict
**What Broke:** Valid PostgreSQL connection strings were rejected
**Why It Broke:** Initial validation required specific URL format
**How We Detected:** User feedback that valid strings were rejected
**How We Fixed:** Made validation permissive - only check for non-empty string, let PostgreSQL handle validation

#### 4. UI Flash When Switching Connections
**What Broke:** Connection screen briefly appeared when switching between saved connections
**Why It Broke:** Explorer view required `connectionMutation.isSuccess` which became false during switches
**How We Detected:** Visual glitch during testing
**How We Fixed:** Removed success check from explorer view condition, added `isSwitchingConnection` state

#### 5. Database Switching Shows Same Tables
**What Broke:** Clicking different databases in sidebar showed same tables
**Why It Broke:** Connection strings were parsed and rebuilt, losing original parameters
**How We Detected:** User reported all connections showing same data
**How We Fixed:** Added `originalConnectionString` field to preserve exact user input