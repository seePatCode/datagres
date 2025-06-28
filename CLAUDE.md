# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm start` - Start the Electron app (never run in Claude Code - user only)
- `npm run typecheck` or `npm run lint` - Check TypeScript compilation

### Testing
- `npm test` - Run Playwright e2e tests
- `npm test:headed` - Run tests with visible browser
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:coverage` - Run unit tests with coverage

### Distribution
- `npm run dist` - Build and package for all platforms
- `npm run dist:mac` - Build for macOS only
- `npm run dist:win` - Build for Windows only
- `npm run dist:linux` - Build for Linux only

## Architecture Overview

Datagres is an Electron-based PostgreSQL database explorer using Electron Forge as the build system. The app follows Electron's three-process architecture:

### Main Process (`src/main/`)
- **Entry Point** (`index.js`): Handles all IPC communication and app lifecycle
- **Services** (`services/`): Modular services auto-bundled during build
  - `connectionStore.js`: Secure credential storage (electron-store + keytar)
  - `databaseService.js`: PostgreSQL operations with cloud SSL auto-detection
  - `aiService.js`: Local AI SQL generation via Ollama
  - `windowManager.js`: Window lifecycle management
  - `menuBuilder.js`: Native menu construction

### Preload Script (`src/preload/index.js`)
Exposes limited API via `contextBridge` for security. All database operations go through this layer.

### Renderer Process (`src/renderer/`)
- **React 19** with TypeScript and Redux Toolkit
- **TanStack Query**: Server state with intelligent caching
- **TanStack Table**: Virtual scrolling for millions of rows
- **Monaco Editor**: SQL editor with schema-aware autocomplete
- **Tailwind + shadcn/ui**: Component library (never create manually)

### Build System (Electron Forge + Webpack)
- Three separate Webpack configs for main/preload/renderer
- TypeScript in renderer, JavaScript in main/preload
- Path aliases: `@/` (renderer), `@shared/`, `@services/`, `@utils/`
- All internal services bundled via webpack configuration

## Critical Patterns

### IPC Communication Flow
```
User Action → Redux Action → IPC Call → Main Process → PostgreSQL → Response → Redux Update
```
All IPC responses follow: `{success: boolean, error?: string, ...data}`

### Adding New Database Operations
1. Add handler in `src/main/index.js` with test mode mock
2. Expose in `src/preload/index.js`
3. Add TypeScript types in `src/shared/types.ts`
4. Use in renderer via Redux actions/React Query

### Connection Security
- Passwords stored in OS keychain (keytar)
- Connection metadata encrypted (electron-store)
- Cloud providers (AWS, Heroku, Azure) auto-detected for SSL config
- Graceful fallback when security libs unavailable

### State Management
- **Redux Store**: Persistent app state (current connection, schema cache)
- **React Query**: Server state (table data, query results)
- **Local State**: UI-only state (modals, selections)

## Development Guidelines

### Package Management
**Use npm** for all package management:
```bash
npm install --save-dev electron
```

### Component Development
- **NEVER manually create shadcn components** - use: `npx shadcn@latest add [component]`
- Follow existing patterns in `src/renderer/components/`
- Use TypeScript strictly - run `npm run typecheck` before claiming completion

### Testing Without Running
Before implementation is complete, verify:
1. TypeScript compilation: `npm run typecheck`
2. Module resolution: `node -e "require('./path/to/file')"`
3. Integration points: `grep -n "handler-name" src/main/index.js`
4. Component imports: Check all imports resolve

### Monaco Editor Gotchas
- Schema data loads asynchronously - use refs to access current values
- Don't rely on data in `onMount` - use `useEffect` with dependencies
- Callbacks capture stale state - sync state to refs

### Unit Testing Focus (80/20 Rule)
Test critical business logic only:
- Connection string parsing/validation
- Query builders (WHERE clauses)
- Error handling paths
- State transformations

## Product Features

### Keyboard Navigation
- `Shift+Shift`: Quick table search (Spotlight-style)
- `Cmd+K`: AI SQL generation (requires Ollama)
- `Cmd+N`: New connection
- `Cmd+1-9`: Tab switching

### Performance Features
- Virtual scrolling with intersection observer
- Infinite scroll (100 rows per page)
- Schema caching for instant search
- Connection auto-reconnect on startup

### AI Integration
- Local Ollama model (qwen2.5-coder by default)
- Full schema context sent to model
- Privacy-first: all processing local
- Model configurable in `aiService.js`

## Common Issues and Solutions

### 1. Missing shadcn Components
**Issue**: Import errors for UI components
**Fix**: `npx shadcn@latest add [component-name]`

### 3. Cloud Database SSL Errors
**Issue**: Heroku/AWS connection failures
**Fix**: App auto-detects cloud providers and configures SSL - check `createClient()` in databaseService.js

### 4. Connection String Issues
**Issue**: Valid strings rejected or modified
**Fix**: App preserves `originalConnectionString` to maintain exact user input

## Important Notes

- **NEVER run `npm start` in Claude Code** - only users should run it
- Test mode activated with `NODE_ENV=test` for consistent mocking
- All services in `src/main/services/` are bundled automatically
- Distribution configured for macOS (DMG), Windows (Squirrel), Linux (DEB)
- App ID: `com.datagres.app` for all platforms