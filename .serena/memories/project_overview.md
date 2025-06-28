# Datagres Project Overview

## Purpose
Datagres is a lightning-fast PostgreSQL database explorer built with Electron. It's designed for developers who value speed and keyboard efficiency, allowing connection to browsing data in under 15 seconds.

## Tech Stack
- **Electron** (v36.4.0) - Cross-platform desktop application framework
- **React** (v19.1.0) - UI library with TypeScript
- **TypeScript** (v5.8.3) - Type safety for renderer process
- **Redux Toolkit** (v2.8.2) - State management
- **TanStack Query** (v5.80.6) - Server state management with intelligent caching
- **TanStack Table** (v8.21.3) - Virtual scrolling for millions of rows
- **Tailwind CSS** (v3.4.17) + shadcn/ui - Component library
- **Monaco Editor** (v4.7.0) - SQL editor with autocomplete
- **PostgreSQL** (pg v8.16.0) - Database driver
- **Electron Forge** (v7.8.1) - Build system
- **Webpack** (v5.99.9) - Module bundler

## Key Features
- Zero config PostgreSQL explorer
- Keyboard-first navigation (Shift+Shift for quick search)
- Secure credential storage (keytar + electron-store)
- AI-powered SQL generation via Ollama
- Virtual scrolling for performance
- Cloud SSL auto-detection (AWS, Heroku, Azure)

## Architecture
Three-process Electron architecture:
1. **Main Process** (JavaScript) - IPC handlers, services
2. **Preload Script** (JavaScript) - Secure context bridge
3. **Renderer Process** (TypeScript/React) - UI

## Security
- Passwords stored in OS keychain
- Connection metadata encrypted
- All database operations through preload layer
- Privacy-first AI (local Ollama processing)