# Electron Auto-Update Implementation Plan for Datagres

## Executive Summary

This document outlines the implementation plan for adding auto-update functionality to the Datagres Electron application. The recommended approach uses `update-electron-app` which integrates seamlessly with our existing Electron Forge + GitHub publishing setup.

## Current State Analysis

### Existing Infrastructure
- **Build System**: Electron Forge
- **Publishing**: GitHub Releases (already configured)
- **Code Signing**: Configured for both macOS and Windows
- **Installers**: 
  - macOS: DMG with Squirrel.Mac
  - Windows: Squirrel.Windows (MakerSquirrel)
  - Linux: DEB packages

### Missing Components
- No auto-update functionality
- No update UI/UX
- No Squirrel event handling for Windows
- No update preferences or manual check

## Implementation Strategy

### Phase 1: Core Auto-Update (Priority: High)

#### 1.1 Install Dependencies
```bash
npm install --save update-electron-app electron-log
```

#### 1.2 Handle Squirrel Events (Windows)
Add to the very beginning of `src/main/index.js`:
```javascript
// Handle Squirrel events for Windows
if (require('electron-squirrel-startup')) {
  app.quit();
}
```

#### 1.3 Initialize Auto-Updater
Add after app initialization in `src/main/index.js`:
```javascript
const { updateElectronApp } = require('update-electron-app');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'info';

// Initialize auto-updater
updateElectronApp({
  repo: 'seepatcode/datagres',
  updateInterval: '1 hour',
  logger: log,
  notifyUser: true
});
```

### Phase 2: Enhanced User Experience (Priority: Medium)

#### 2.1 Update Events and IPC Communication

Create update service in `src/main/services/updateService.js`:
```javascript
const { app, ipcMain } = require('electron');
const { autoUpdater } = require('update-electron-app');
const log = require('electron-log');

class UpdateService {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.setupEventHandlers();
    this.setupIpcHandlers();
  }

  setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendToRenderer('update-checking');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendToRenderer('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendToRenderer('update-not-available', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.sendToRenderer('update-error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
      this.sendToRenderer('update-download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendToRenderer('update-downloaded', info);
    });
  }

  setupIpcHandlers() {
    ipcMain.handle('check-for-updates', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, result };
      } catch (error) {
        log.error('Manual update check failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('install-update', async () => {
      try {
        autoUpdater.quitAndInstall();
        return { success: true };
      } catch (error) {
        log.error('Install update failed:', error);
        return { success: false, error: error.message };
      }
    });
  }

  sendToRenderer(channel, data) {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = UpdateService;
```

#### 2.2 Preload Script Updates
Add to `src/preload/index.js`:
```javascript
// Auto-update API
checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
installUpdate: () => ipcRenderer.invoke('install-update'),
onUpdateEvent: (callback) => {
  const channels = [
    'update-checking',
    'update-available',
    'update-not-available',
    'update-error',
    'update-download-progress',
    'update-downloaded'
  ];
  
  channels.forEach(channel => {
    ipcRenderer.on(channel, (event, data) => callback(channel, data));
  });
  
  // Return cleanup function
  return () => {
    channels.forEach(channel => {
      ipcRenderer.removeAllListeners(channel);
    });
  };
}
```

#### 2.3 UI Components

Create `src/renderer/components/ui/update-notification.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Download, RefreshCw } from 'lucide-react';

interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cleanup = window.electronAPI.onUpdateEvent((channel, data) => {
      switch (channel) {
        case 'update-checking':
          setUpdateStatus('checking');
          setShow(true);
          break;
        case 'update-available':
          setUpdateStatus('available');
          setUpdateInfo(data);
          break;
        case 'update-not-available':
          setUpdateStatus('not-available');
          setTimeout(() => setShow(false), 3000);
          break;
        case 'update-error':
          setUpdateStatus('error');
          setUpdateInfo(data);
          break;
        case 'update-download-progress':
          setUpdateStatus('downloading');
          setDownloadProgress(data);
          break;
        case 'update-downloaded':
          setUpdateStatus('downloaded');
          setUpdateInfo(data);
          break;
      }
    });

    return cleanup;
  }, []);

  const handleInstall = async () => {
    await window.electronAPI.installUpdate();
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        {updateStatus === 'checking' && (
          <AlertDescription className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking for updates...
          </AlertDescription>
        )}

        {updateStatus === 'available' && (
          <AlertDescription>
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4" />
              New version available: {updateInfo?.version}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              The update will be downloaded in the background.
            </p>
          </AlertDescription>
        )}

        {updateStatus === 'downloading' && downloadProgress && (
          <AlertDescription>
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 animate-pulse" />
              Downloading update... {downloadProgress.percent.toFixed(0)}%
            </div>
            <Progress value={downloadProgress.percent} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
            </p>
          </AlertDescription>
        )}

        {updateStatus === 'downloaded' && (
          <AlertDescription>
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-4 w-4 text-green-500" />
              Update ready to install!
            </div>
            <Button onClick={handleInstall} size="sm" className="w-full">
              Restart and Install Update
            </Button>
          </AlertDescription>
        )}

        {updateStatus === 'not-available' && (
          <AlertDescription className="text-muted-foreground">
            You're running the latest version!
          </AlertDescription>
        )}

        {updateStatus === 'error' && (
          <AlertDescription className="text-destructive">
            Update error: {updateInfo}
          </AlertDescription>
        )}
      </Alert>
    </div>
  );
}
```

#### 2.4 Settings Integration

Add update preferences to settings:
```typescript
// In src/renderer/components/ui/settings-dialog.tsx
interface UpdateSettings {
  autoDownload: boolean;
  checkInterval: '30min' | '1hour' | '6hours' | '24hours' | 'never';
  notifyOnUpdate: boolean;
}

// Add update settings section
<div className="space-y-4">
  <h3 className="text-lg font-medium">Update Settings</h3>
  
  <div className="flex items-center justify-between">
    <Label htmlFor="auto-download">Automatically download updates</Label>
    <Switch
      id="auto-download"
      checked={settings.autoDownload}
      onCheckedChange={(checked) => updateSettings({ autoDownload: checked })}
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="check-interval">Check for updates</Label>
    <Select
      value={settings.checkInterval}
      onValueChange={(value) => updateSettings({ checkInterval: value })}
    >
      <SelectTrigger id="check-interval">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="30min">Every 30 minutes</SelectItem>
        <SelectItem value="1hour">Every hour</SelectItem>
        <SelectItem value="6hours">Every 6 hours</SelectItem>
        <SelectItem value="24hours">Daily</SelectItem>
        <SelectItem value="never">Never</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <Button 
    variant="outline" 
    onClick={() => window.electronAPI.checkForUpdates()}
    className="w-full"
  >
    Check for Updates Now
  </Button>
</div>
```

### Phase 3: Advanced Features (Priority: Low)

#### 3.1 Release Notes Display
- Fetch and display release notes from GitHub
- Show changelog in update notification
- Add "What's New" dialog after update

#### 3.2 Update Analytics
- Track update success/failure rates
- Monitor download speeds
- Log update-related errors

#### 3.3 Beta Channel Support
- Add option to receive pre-release updates
- Implement channel switching
- Separate update streams

## Implementation Checklist

### Immediate Actions (Phase 1)
- [ ] Install update-electron-app and electron-log
- [ ] Add Squirrel event handling at app start
- [ ] Initialize basic auto-updater
- [ ] Test with a dummy version bump

### Short-term Actions (Phase 2)
- [ ] Create UpdateService class
- [ ] Add IPC handlers for update events
- [ ] Build UpdateNotification component
- [ ] Integrate with app settings
- [ ] Add menu item for manual update check

### Long-term Actions (Phase 3)
- [ ] Implement release notes fetching
- [ ] Add update analytics
- [ ] Support beta/stable channels
- [ ] Create update history view

## Testing Strategy

### Local Testing
1. Build the app with current version
2. Bump version in package.json
3. Build and publish to GitHub as draft release
4. Run previous version and verify update detection

### Staging Testing
1. Create pre-release on GitHub
2. Test with beta testers
3. Monitor logs for errors
4. Verify rollback mechanism

### Production Testing
1. Gradual rollout with percentage-based releases
2. Monitor crash reports
3. Track update success metrics
4. Be ready to unpublish if issues arise

## Security Considerations

1. **Code Signing**: Already configured for both platforms
2. **HTTPS Only**: GitHub Releases uses HTTPS
3. **Signature Verification**: Handled by update-electron-app
4. **Rollback Plan**: Keep previous versions available

## Platform-Specific Notes

### macOS
- Updates download to `~/Library/Caches/com.datagres.app/`
- Requires code signing and notarization
- DMG format supported

### Windows
- Updates download to `%LocalAppData%/datagres/`
- Squirrel events must be handled
- Requires code signing certificate

### Linux
- Limited auto-update support with DEB packages
- Consider adding AppImage format for better update support
- Users typically update via package manager

## Success Metrics

1. **Update Adoption Rate**: >80% within 7 days
2. **Update Failure Rate**: <1%
3. **User Satisfaction**: No increase in support tickets
4. **Performance Impact**: <5% CPU during download

## Rollback Plan

If critical issues arise:
1. Unpublish the problematic release
2. Create new release with previous version number + patch
3. Force update to stable version
4. Communicate with users via in-app notification

## Timeline

- **Week 1**: Implement Phase 1 (core functionality)
- **Week 2**: Implement Phase 2 (UI/UX enhancements)
- **Week 3**: Testing and bug fixes
- **Week 4**: Production rollout
- **Month 2**: Phase 3 features based on user feedback

## References

- [update-electron-app Documentation](https://github.com/electron/update-electron-app)
- [Electron Auto-Updater Guide](https://www.electronjs.org/docs/latest/tutorial/updates)
- [Squirrel.Windows Documentation](https://github.com/Squirrel/Squirrel.Windows)
- [Code Signing Best Practices](https://www.electronjs.org/docs/latest/tutorial/code-signing)