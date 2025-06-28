# Contributing to Datagres

Thank you for your interest in contributing to Datagres! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/datagres.git
   cd datagres
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. **Use npm** - This project uses npm for package management
2. **Install Electron properly** - If you need to reinstall Electron:
   ```bash
   npm install --save-dev electron
   ```
3. **Run in development mode**:
   ```bash
   npm run dev
   ```

## Code Style

- We use TypeScript for type safety
- Follow the existing code patterns
- Use Tailwind CSS for styling
- Components should be functional with hooks

## Testing

- Write tests for new features
- Run tests before submitting PR:
  ```bash
  npm test
  npm run test:unit
  ```
- Ensure all tests pass

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CLAUDE.md if you change development processes
3. Ensure your code follows the existing style
4. Write clear commit messages following conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code changes that don't affect functionality
   - `test:` for test additions or changes

## Component Development

When adding new UI components:
- **Never manually create shadcn components**
- Always use: `npx shadcn@latest add [component]`
- Follow the existing component patterns

## Database Operations

When adding new database functionality:
1. Add IPC handler in `src/main/index.js`
2. Add mock response for test mode
3. Expose via preload script
4. Add TypeScript types
5. Use React Query for data fetching

## Questions?

Feel free to open an issue for any questions about contributing.