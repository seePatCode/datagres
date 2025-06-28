# Datagres

<div align="center">
  <img src="build/icon.png" alt="Datagres Logo" width="120" height="120">
  
  <h1>Datagres</h1>
  <p><strong>The Lightning-Fast PostgreSQL Explorer</strong></p>
  
  <p>
    <a href="https://seepatcode.github.io/datagres/">Website</a> •
    <a href="https://seepatcode.github.io/datagres/documentation.html">Documentation</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-features">Features</a>
  </p>
  
  [![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)
  [![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F.svg)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19.1-61DAFB.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
</div>

---

**Datagres** is a desktop application that makes exploring PostgreSQL databases feel instant. Built for developers who value speed and keyboard efficiency, it gets you from connection string to browsing data in under 15 seconds.

## 🎯 Why Datagres?

- **Zero Config**: Just paste your connection string and go
- **Keyboard-First**: Navigate entirely with keyboard shortcuts
- **Secure by Design**: Passwords in OS keychain, encrypted connections
- **Built for Speed**: Virtual scrolling handles millions of rows smoothly
- **Developer Friendly**: Monaco editor with SQL autocomplete

## ✨ Features

- **⚡ Lightning Fast** - Connection to data view in under 15 seconds
- **⌨️ Keyboard-First** - Navigate efficiently without touching the mouse
  - `Shift+Shift` - Quick table search (like Spotlight)
  - `Cmd+N` - New connection
  - `Cmd+1-9` - Jump to any tab
  - `Cmd+Enter` - Execute search
- **🔒 Secure** - Passwords stored in OS keychain, connections encrypted
- **📜 Infinite Scroll** - Browse millions of rows seamlessly
- **🎨 Beautiful UI** - Modern interface built with Tailwind CSS and shadcn/ui
- **💾 Smart Caching** - Intelligent data caching with TanStack Query
- **🔍 SQL Editor** - Built-in Monaco editor with intelligent autocompletion
- **🤖 AI-Powered SQL** - Generate SQL from natural language with `Cmd+K` (requires [Ollama](docs/OLLAMA_SETUP.md))
- **☁️ Cloud Ready** - Auto-detects and configures SSL for Heroku, AWS, Azure
- **🔄 Auto-Reconnect** - Automatically connects to your last used database

## 📦 Installation

### Download Pre-built Binaries

Download the latest release from the [releases page](https://github.com/seepatcode/datagres/releases).

#### macOS Security Notice
Datagres is currently unsigned while we work on getting an Apple Developer certificate. This means macOS will show a security warning when you first open the app. This is normal for unsigned applications and doesn't indicate any security issues with Datagres itself.

**To open Datagres on macOS:**
1. Download the `.dmg` file from releases
2. Open the `.dmg` and drag Datagres to your Applications folder
3. **Right-click** (or Control-click) on Datagres in Applications
4. Select **Open** from the context menu
5. Click **Open** in the security dialog that appears
6. This only needs to be done once - afterwards you can open Datagres normally

**Why is this necessary?** Apple requires developers to pay for a certificate to sign their apps. We're in the process of obtaining this certificate. Once we have it, future versions will open without any warnings.

Alternatively, build from source:

### Build from Source

```bash
# Clone the repository
git clone https://github.com/seepatcode/datagres.git
cd datagres

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for your platform
npm run make
npm run dist
```

## 🚀 Quick Start

1. **Launch Datagres**
2. **Paste your connection string** and press Enter:
   ```
   postgresql://user:password@localhost:5432/mydb
   ```
3. **Start exploring!** Use `Shift+Shift` to quickly search tables

## ⌨️ Keyboard Shortcuts

### Essential
- `Shift+Shift` - Quick search (tables & connections)
- `Cmd+N` - New connection
- `Cmd+/` - Show all shortcuts

### Navigation
- `Cmd+1-9` - Jump to specific tab (1-9)
- `Cmd+[` / `Cmd+]` - Navigate back/forward
- `Cmd+W` - Close current tab
- `Ctrl+Tab` - Cycle tabs (Windows/Linux only)

### Table View
- `Cmd+Enter` - Execute search
- `Enter` / `Esc` - Edit/cancel cell edit
- Click headers to sort columns

### SQL Editor
- `Cmd+K` - Generate SQL from natural language (requires [Ollama setup](docs/OLLAMA_SETUP.md))
- `Cmd+Enter` - Execute query
- Full Monaco editor shortcuts apply

## 🛠️ Development

**Prerequisites**: Node.js 18+, npm 8+, PostgreSQL (for testing)

```bash
# Development
npm run dev          # Start with hot reload
npm test            # Run E2E tests
npm run test:unit    # Run unit tests

# Production
npm run make        # Build application
npm run dist        # Package for distribution
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

1. **Use npm** for package management
2. **Follow TDD** - Write tests first
3. **Use TypeScript** for type safety
4. **Follow existing patterns** - Check similar code first
5. **Never manually create shadcn components** - Use `npx shadcn@latest add [component]`

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