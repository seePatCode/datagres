# Task Completion Checklist

When completing any coding task in Datagres, follow these steps:

## 1. Code Quality Verification
- **MANDATORY**: Run `npm run typecheck` or `npm run lint` to ensure TypeScript compilation passes
- If errors found, fix them before claiming completion
- Verify all imports resolve correctly

## 2. Module Resolution Check
For new files or significant changes:
- Run `node -e "require('./path/to/file')"` to verify module resolution
- Check that path aliases (`@/`, `@shared/`) work correctly

## 3. Integration Verification
For IPC/database operations:
- Verify handler exists: `grep -n "handler-name" src/main/index.js`
- Check preload exposure in `src/preload/index.js`
- Ensure TypeScript types added to `src/shared/types.ts`

## 4. Component Development
If adding UI components:
- Never create shadcn components manually
- Use: `npx --legacy-peer-deps shadcn@latest add [component]`
- Follow existing patterns in the codebase

## 5. Testing (if applicable)
- Run relevant tests: `npm test` or `npm run test:unit`
- For UI changes, consider running `npm test:headed`

## 6. Final Checks
- Ensure no test code or debug logs remain
- Verify code follows project conventions
- Check that sensitive data isn't exposed
- Consider if CLAUDE.md needs updates for significant changes

## Important Reminders
- NEVER run `npm start` in Claude Code
- Always use npm (not yarn/pnpm)
- Don't add comments unless requested
- Follow existing code patterns