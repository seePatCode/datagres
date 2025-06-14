# Electron Forge Setup

This project has been configured to use Electron Forge alongside the existing electron-vite and electron-builder setup. This provides additional packaging and distribution options.

## Available Commands

### Electron Forge Commands
- `npm start` - Start the app using Electron Forge (builds and runs)
- `npm run package` - Package the app without creating distributables
- `npm run make` - Create platform-specific distributables (DMG, EXE, DEB, ZIP)
- `npm run publish` - Publish releases to GitHub

### Legacy Commands (still available)
- `npm run vite:start` or `npm run dev` - Start with electron-vite (development mode)
- `npm run build` - Build with electron-vite
- `npm run dist:mac` - Build macOS distributables with electron-builder
- `npm run dist:win` - Build Windows distributables with electron-builder
- `npm run dist:linux` - Build Linux distributables with electron-builder

## Configuration

The Electron Forge configuration is in `forge.config.js` and includes:

### Makers (Distributables)
- **DMG** - macOS disk image
- **Squirrel** - Windows installer
- **DEB** - Debian/Ubuntu package
- **ZIP** - Universal ZIP archive

### Code Signing & Notarization

Set these environment variables for code signing:
- `APPLE_IDENTITY` - Apple Developer ID for code signing
- `APPLE_ID` - Apple ID email for notarization
- `APPLE_PASSWORD` - App-specific password for notarization
- `APPLE_TEAM_ID` - Apple Team ID
- `WINDOWS_CERTIFICATE_FILE` - Path to Windows code signing certificate
- `WINDOWS_CERTIFICATE_PASSWORD` - Windows certificate password

### Publishing

The project is configured to publish to GitHub releases. Ensure you have:
- A GitHub personal access token with `repo` scope
- Set the `GITHUB_TOKEN` environment variable

## Building Distributables

### macOS
```bash
npm run make -- --platform=darwin
```

### Windows
```bash
npm run make -- --platform=win32
```

### Linux
```bash
npm run make -- --platform=linux
```

## Icon Files

The build directory contains icon files in multiple formats:
- `icon.png` - Source PNG (1416x1416)
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon

## Integration with electron-vite

The Electron Forge setup uses the VitePlugin to integrate with the existing electron-vite configuration. This means:
- The same build configuration is used
- The same file structure is maintained
- All existing functionality is preserved

The main difference is that Electron Forge handles the packaging and distribution steps, providing more options for creating installers and managing releases.