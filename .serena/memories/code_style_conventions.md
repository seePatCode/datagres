# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - All strict type-checking options
- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx
- **Path aliases**: 
  - `@/*` → `./src/renderer/*`
  - `@shared/*` → `./src/shared/*`

## Code Organization
- **Main Process** (`src/main/`) - JavaScript only
  - Entry point: `index.js`
  - Services in `services/` auto-bundled
- **Preload** (`src/preload/`) - JavaScript only
- **Renderer** (`src/renderer/`) - TypeScript/React
  - Components in `components/`
  - Redux store in `store/`
  - Hooks in `hooks/`

## React/TypeScript Patterns
- React 19 with functional components
- TypeScript interfaces for props
- Redux Toolkit for state management
- TanStack Query for server state
- Forward refs with React.forwardRef
- Strict typing - no implicit any

## Component Development Rules
- **NEVER manually create shadcn components**
- Use: `npx --legacy-peer-deps shadcn@latest add [component]`
- Follow existing patterns in `src/renderer/components/`
- Use Tailwind CSS with cn() utility for className merging
- Components use cva (class-variance-authority) for variants

## IPC Communication Pattern
1. Add handler in `src/main/index.js`
2. Expose in `src/preload/index.js`
3. Add types in `src/shared/types.ts`
4. Use via Redux/React Query

## Response Format
All IPC responses: `{success: boolean, error?: string, ...data}`

## Important Rules
- NO COMMENTS in code unless explicitly requested
- Use npm only (not yarn/pnpm)
- Run `npm run typecheck` before claiming completion
- Test mode: `NODE_ENV=test` for mocking