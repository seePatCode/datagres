# Datagres Project Structure

## Root Directory
- `CLAUDE.md` - Instructions for Claude Code
- `README.md` - Project documentation
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `forge.config.js` - Electron Forge configuration
- `webpack.*.config.js` - Webpack configs for main/preload/renderer

## Source Code (`src/`)
### Main Process (`src/main/`)
- `index.js` - Entry point, IPC handlers
- `services/`
  - `connectionStore.js` - Secure credential storage
  - `databaseService.js` - PostgreSQL operations
  - `aiService.js` - Local AI SQL generation
  - `windowManager.js` - Window lifecycle
  - `menuBuilder.js` - Native menu construction

### Preload Script (`src/preload/`)
- `index.js` - Context bridge for secure API exposure

### Renderer Process (`src/renderer/`)
- `index.tsx` - React app entry point
- `index.css` - Global styles with Tailwind
- `components/` - React components
  - `ui/` - shadcn/ui components
- `hooks/` - Custom React hooks
- `store/` - Redux store
  - `slices/` - Redux slices
- `views/` - Main view components
- `lib/` - Utilities and helpers

### Shared (`src/shared/`)
- `types.ts` - Shared TypeScript types

## Other Directories
- `tests/` - E2E and unit tests
- `build/` - Build assets (icons, etc.)
- `kb/` - Knowledge base documentation
- `dist/` - Build output (gitignored)
- `out/` - Electron Forge output (gitignored)

## Key Files to Know
- IPC handlers: `src/main/index.js`
- Database logic: `src/main/services/databaseService.js`
- Type definitions: `src/shared/types.ts`
- Redux store: `src/renderer/store/`