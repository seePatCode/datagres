# Datagres Auto-Updater Documentation

## Overview

Datagres uses the `update-electron-app` package to automatically check for and download updates from GitHub releases. The auto-updater runs only in packaged/production builds and checks for updates every hour.

## Electron Update Methods Comparison

According to Electron's official documentation, there are several approaches:

1. **`update-electron-app`** (Currently used by Datagres)
   - Easiest drop-in solution
   - Pre-configured for GitHub releases
   - Minimal setup required
   - Built on top of Electron's autoUpdater module

2. **Native `autoUpdater` module**
   - More control over update process
   - Platform-specific behaviors
   - Requires more configuration
   - Direct access to all update events

3. **`electron-updater`**
   - Third-party solution with more features
   - Supports more update sources
   - More complex but flexible

## Platform-Specific Behaviors

### macOS
- Uses Squirrel.Mac framework
- **Requires code signing** (critical for updates to work)
- Supports automatic background downloads
- Updates installed on app quit

### Windows
- Uses Squirrel.Windows framework
- Requires app to be installed (not portable)
- Handles `--squirrel-*` launch arguments
- Updates can be installed immediately

### Linux
- **No built-in auto-update support**
- Electron recommends using system package managers
- Our implementation shows "updates not supported" on Linux

## Architecture

### 1. Initialization (`src/main/index.js`)
```javascript
updateElectronApp({
  repo: 'seepatcode/datagres',
  updateInterval: '1 hour',
  logger: log,
  notifyUser: false  // We handle notifications ourselves
})
```

- Only initializes when `app.isPackaged` is true
- Uses GitHub releases as the update source
- Checks for updates every hour automatically
- Logging is handled by electron-log

### 2. Update Service (`src/main/services/updateService.js`)
The UpdateService class handles:
- Event listeners for autoUpdater events
- IPC handlers for manual update checks
- Communication with the renderer process
- Differentiating between automatic and manual update checks

Key behaviors:
- **Automatic checks**: Silent, only show notification if update is available
- **Manual checks**: Show dialogs for all states (checking, not available, errors)
- **Download progress**: Tracked and sent to renderer
- **Installation**: Requires user action via the UpdateNotification component

### 3. Renderer Integration

#### Update Notification Component (`src/renderer/components/ui/update-notification.tsx`)
- Listens for update events via `window.electronAPI.onUpdateEvent`
- Shows a toast notification only when:
  - An update is available
  - Update is downloading (with progress)
  - Update is downloaded and ready to install
- Does NOT show notifications for:
  - Checking for updates
  - No updates available
  - Errors during automatic checks

#### Menu Integration
- "Check for Updates..." menu item triggers manual check
- Handled via `useMenuActions` hook
- Calls `window.electronAPI.checkForUpdates()`

## Update Flow

### Automatic Update Check (Every Hour)
1. `update-electron-app` triggers check in background
2. If update available → UpdateNotification appears
3. Update downloads automatically in background
4. When complete → "Restart and Install Update" button appears
5. User clicks button → App quits and installs update

### Manual Update Check (Menu)
1. User clicks "Check for Updates..."
2. Shows native dialog: "Checking for updates..."
3. Results:
   - **Update available**: Shows notification toast
   - **No update**: Shows dialog "You're running the latest version!"
   - **Error**: Shows error dialog

## Current Issues & Root Causes

### 1. Version Detection Problems
The auto-updater sometimes reports "latest version" even when newer versions exist. Based on Electron documentation, possible causes:

1. **GitHub Release Requirements Not Met**:
   - Release must be "published" (not draft)
   - Assets must be fully uploaded
   - **Code signing**: On macOS, unsigned builds cannot be updated
   
2. **Platform-Specific Issues**:
   - macOS: ATS (App Transport Security) restrictions
   - Windows: Missing or incorrect Application User Model ID
   - First-run update checks may fail due to file locks

3. **update-electron-app Limitations**:
   - Uses GitHub API which has rate limits
   - Caching at CDN level can delay visibility
   - Pre-release versions may not be detected correctly

### 2. No Automatic Restart Prompt
This is actually **expected behavior** according to Electron docs:
- `autoUpdater` automatically downloads but doesn't force restart
- The `quitAndInstall()` method must be explicitly called
- Our implementation correctly shows a notification, but could be more persistent

### 3. Silent Failures
By design, our UpdateService only shows errors for manual checks. However, Electron recommends:
- Always listen to the `error` event
- Log all update events for debugging
- Consider showing non-intrusive error indicators

## Electron's Recommended Best Practices

### 1. Server Configuration
For GitHub releases (via update.electronjs.org):
- Ensure repository is public
- Use semantic versioning (no 'v' prefix in version field)
- Publish releases (not drafts)
- Include all platform assets in one release

### 2. Error Handling
```javascript
autoUpdater.on('error', (error) => {
  // Don't throw, just log and notify
  log.error('Update error:', error)
  // Consider retry logic
})
```

### 3. Update Flow
Electron recommends:
1. Check for updates on app start (after window ready)
2. Check periodically (we do every hour ✓)
3. Allow manual checks (we have this ✓)
4. Show download progress (we do this ✓)
5. Give user control over restart timing (we do this ✓)

### 4. Code Signing Requirements
- **macOS**: Must be signed with Developer ID certificate
- **Windows**: Should be signed but not required
- Without signing, macOS updates will fail silently

## File Locations

- **Main Process**:
  - `/src/main/index.js` - Initializes update-electron-app
  - `/src/main/services/updateService.js` - Handles update events and IPC
  
- **Renderer Process**:
  - `/src/renderer/components/ui/update-notification.tsx` - UI component
  - `/src/renderer/hooks/useMenuActions.ts` - Menu action handler
  - `/src/renderer/App.tsx` - Includes UpdateNotification component

- **Preload**:
  - `/src/preload/index.js` - Exposes update APIs to renderer

## Configuration

The updater is configured with:
- **Repository**: `seepatcode/datagres`
- **Check Interval**: 1 hour
- **Notification**: Custom (not using default Electron notifications)
- **Logger**: electron-log for debugging

## Debugging

Check logs at:
- **macOS**: `~/Library/Logs/Datagres/main.log`
- **Windows**: `%USERPROFILE%\AppData\Roaming\Datagres\logs\main.log`
- **Linux**: `~/.config/Datagres/logs/main.log`

Look for lines containing:
- "Checking for updates..."
- "Update available:"
- "Update not available:"
- "Update error:"
- "Update downloaded:"

## Potential Improvements

Based on Electron's official recommendations:

1. **Add Retry Logic**: Implement exponential backoff for failed update checks
2. **Better Error Visibility**: Show subtle indicators when automatic checks fail
3. **Persistent Update Badge**: Add a badge to show when updates are ready
4. **Check on Focus**: Consider checking for updates when app regains focus
5. **Version Comparison Logging**: Log more details about version comparison
6. **Manual Update Feed URL**: Allow power users to specify custom update endpoints

## Key Differences from Standard autoUpdater

Our implementation using `update-electron-app`:
- Abstracts away feed URL configuration
- Automatically handles GitHub releases
- Manages update intervals internally
- Simplifies error handling
- Less granular control over update process

Direct `autoUpdater` usage would give us:
- More control over timing
- Custom server support
- Platform-specific optimizations
- Better error handling granularity
- Custom update UI flows