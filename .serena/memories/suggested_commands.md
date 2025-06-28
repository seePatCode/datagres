# Suggested Commands for Datagres Development

## Development Commands
- `npm run dev` - Start development server with hot reload
- `npm start` - Start the Electron app (NEVER run in Claude Code - user only)

## Code Quality Commands (Run after completing tasks)
- `npm run typecheck` or `npm run lint` - Check TypeScript compilation (MUST run before claiming completion)
- `node -e "require('./path/to/file')"` - Verify module resolution

## Testing Commands
- `npm test` - Run Playwright e2e tests
- `npm test:headed` - Run tests with visible browser
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:coverage` - Run unit tests with coverage
- `npm run test:unit:ui` - Run Vitest UI

## Build & Distribution Commands
- `npm run make` or `npm run dist` - Build and package for all platforms
- `npm run dist:mac` - Build for macOS only
- `npm run dist:win` - Build for Windows only
- `npm run dist:linux` - Build for Linux only

## Package Management
- `npm install` - Install dependencies (always use npm, never yarn or pnpm)
- `npm install --save-dev <package>` - Add dev dependency
- `npx --legacy-peer-deps shadcn@latest add [component]` - Add shadcn component (use --legacy-peer-deps due to React 19)

## macOS System Commands
- `git` - Version control
- `ls` - List directory contents
- `cd` - Change directory
- `rg` (ripgrep) - Fast search tool (preferred over grep/find)
- `open` - Open files/directories in Finder

## Integration Verification
- `grep -n "handler-name" src/main/index.js` - Check IPC handler exists
- Check imports resolve before running