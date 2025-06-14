# Releasing Datagres

This document describes how to create a new release of Datagres.

## Automated Releases (Recommended)

We use GitHub Actions to automatically build and release Datagres for all platforms.

### Creating a Release

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Commit the version change**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

3. **Create and push a tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **GitHub Actions will automatically**:
   - Build the app for macOS, Windows, and Linux
   - Create a draft release with all artifacts
   - Upload the built applications

5. **Finalize the release**:
   - Go to [GitHub Releases](https://github.com/seepatcode/datagres/releases)
   - Edit the draft release
   - Add release notes
   - Publish the release

## Manual Release (Local)

If you need to build and release manually:

### macOS
```bash
pnpm run dist:mac
# Output: dist/Datagres-1.0.0.dmg
```

### Windows
```bash
pnpm run dist:win
# Output: dist/Datagres Setup 1.0.0.exe
```

### Linux
```bash
pnpm run dist:linux
# Output: dist/Datagres-1.0.0.AppImage
```

## Code Signing (Optional)

### macOS

For signed and notarized macOS builds, you'll need:

1. **Apple Developer Certificate**
2. **Set GitHub Secrets**:
   - `MAC_CERTS`: Base64 encoded .p12 certificate
   - `MAC_CERTS_PASSWORD`: Certificate password
   - `APPLE_ID`: Your Apple ID
   - `APPLE_ID_PASS`: App-specific password
   - `APPLE_TEAM_ID`: Your Apple Team ID

### Windows

For signed Windows builds:

1. **Code Signing Certificate**
2. **Set GitHub Secrets**:
   - `WINDOWS_CERTS`: Base64 encoded certificate
   - `WINDOWS_CERTS_PASSWORD`: Certificate password

## Release Checklist

- [ ] All tests pass (`pnpm test` and `pnpm test:unit`)
- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md (if maintaining one)
- [ ] Commit version changes
- [ ] Create and push version tag
- [ ] Verify GitHub Actions build succeeds
- [ ] Add release notes to GitHub release
- [ ] Update README.md download links (once released)

## Troubleshooting

### Build Fails on GitHub Actions

1. Check the [Actions tab](https://github.com/seepatcode/datagres/actions) for error logs
2. Common issues:
   - Missing dependencies: Ensure all are in `package.json`
   - Platform-specific code: Test on all platforms locally
   - Native modules: May need rebuild configuration

### Local Build Issues

1. **Clean and rebuild**:
   ```bash
   rm -rf node_modules dist out
   pnpm install
   pnpm run build
   ```

2. **Electron rebuild** (for native modules):
   ```bash
   pnpm add -D @electron/rebuild
   npx electron-rebuild
   ```