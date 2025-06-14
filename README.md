# Datagres

<div align="center">
  <img src="build/icon.png" alt="Datagres Logo" width="120" height="120">
  
  <h3>The world's fastest database exploration tool</h3>
  
  <p>Connect to your PostgreSQL database and start exploring data in under 15 seconds</p>
  
  [![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)
  [![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F.svg)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
</div>

## ✨ Features

- **⚡ Lightning Fast** - Connection to data view in under 15 seconds
- **⌨️ Keyboard-First** - Navigate efficiently without touching the mouse
  - `Shift+Shift` - Quick table search (like Spotlight)
  - `↑↓` - Navigate through tables and results
  - `Cmd+E` - Open SQL editor
  - `Cmd+Enter` - Execute query
- **🔒 Secure** - Passwords stored in OS keychain, connections encrypted
- **📜 Infinite Scroll** - Browse millions of rows seamlessly
- **🎨 Beautiful UI** - Modern interface built with Tailwind CSS and shadcn/ui
- **💾 Smart Caching** - Intelligent data caching with TanStack Query
- **🔍 SQL Editor** - Built-in Monaco editor with intelligent autocompletion
- **☁️ Cloud Ready** - Auto-detects and configures SSL for Heroku, AWS, Azure
- **🔄 Auto-Reconnect** - Automatically connects to your last used database

## ⌨️ Keyboard Navigation

![Keyboard Navigation Flow](docs/keyboard-navigation.svg)

## 🚀 Quick Start

### Download

Download the latest release for your platform:

- **macOS**: [Datagres.dmg](#) (Coming soon)
- **Windows**: [Datagres.exe](#) (Coming soon)
- **Linux**: [Datagres.AppImage](#) (Coming soon)

### Connect to Your Database

1. Launch Datagres
2. Paste your PostgreSQL connection string:
   ```
   postgresql://user:password@localhost:5432/mydb
   ```
3. Press Enter - you're connected!

## 🏗️ Architecture

Datagres follows Electron's three-process architecture for security and performance:

### High-Level Architecture

![Architecture Overview](docs/architecture.svg)

### Data Flow

![Data Flow](docs/data-flow-simple.svg)

<details>
<summary>View Additional Architecture Details</summary>

For a comprehensive technical deep-dive, see our [Architecture Documentation](ARCHITECTURE.md) which includes:
- Detailed process architecture
- State management patterns
- Security implementation
- Performance optimizations
- Testing strategies

### Component Architecture
![Component Architecture](kb/data-flow-architecture.png)

### State Management
![State Management](kb/state-management-overview.png)

</details>

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (for testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/seepatcode/datagres.git
cd datagres

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Available Scripts

```bash
pnpm run dev          # Start development server
pnpm test            # Run E2E tests
pnpm test:unit       # Run unit tests
pnpm run build       # Build for production
pnpm run dist        # Package for distribution
```

### Project Structure

```
datagres/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.js    # IPC handlers
│   │   └── services/   # Business logic
│   ├── preload/        # Preload scripts
│   ├── renderer/       # React application
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   └── store/      # Redux store
│   └── shared/         # Shared types
├── tests/              # E2E and unit tests
├── build/              # Build assets
└── kb/                 # Knowledge base
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

1. **Use pnpm** for package management
2. **Follow TDD** - Write tests first
3. **Use TypeScript** for type safety
4. **Follow existing patterns** - Check similar code first
5. **Never manually create shadcn components** - Use `pnpm dlx shadcn@latest add [component]`

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/seepatcode/datagres/issues).

## 📊 Performance

Datagres is built for speed:

- **Connection time**: < 2 seconds
- **First data render**: < 1 second
- **Virtual scrolling**: Handle millions of rows
- **Memory efficient**: Intelligent data windowing

## 🔧 Tech Stack

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop apps
- **[React](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Redux Toolkit](https://redux-toolkit.js.org/)** - State management
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[TanStack Table](https://tanstack.com/table)** - Data grid
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - Code editor
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[Vitest](https://vitest.dev/)** - Unit testing

## 📜 License

This project is released under the [Unlicense](LICENSE) and is in the public domain.

---

<div align="center">
  Made with ❤️ for the database community
  
  <a href="https://github.com/seepatcode/datagres">GitHub</a>
</div>