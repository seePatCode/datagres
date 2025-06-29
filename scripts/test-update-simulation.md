# Testing Auto-Updates Without Publishing

## Option 1: Draft Release (Recommended)

1. Build your current version locally:
   ```bash
   npm run dist
   ```

2. Create a draft release manually on GitHub:
   - Go to https://github.com/seepatcode/datagres/releases/new
   - Tag: Create new tag `v0.3.3` (or next version)
   - Check "This is a pre-release"
   - Upload your built files from `dist/make/`
   - Save as DRAFT (don't publish yet)

3. Install the older version and run it

4. Publish the draft release

5. Check for updates in the app

## Option 2: Test Branch Release

1. Create a test branch:
   ```bash
   git checkout -b test/auto-update-0.3.3
   npm version patch --no-git-tag-version
   git add .
   git commit -m "test: auto-update to 0.3.3"
   git tag v0.3.3-test
   git push origin test/auto-update-0.3.3 --tags
   ```

2. The GitHub Action will create a release

3. Test the update

4. Clean up:
   ```bash
   # Delete the test tag/release from GitHub
   git push origin :v0.3.3-test
   git checkout main
   git branch -D test/auto-update-0.3.3
   ```

## Option 3: Local Mock Server (Advanced)

1. Install the local test server dependencies:
   ```bash
   npm install --save-dev express
   ```

2. Temporarily modify `src/main/index.js`:
   ```javascript
   // Change this line:
   repo: 'seepatcode/datagres',
   // To:
   repo: 'localhost:3333/repos/seepatcode/datagres',
   ```

3. Run the mock server:
   ```bash
   node scripts/test-update-locally.js
   ```

4. Build and test

5. Remember to revert the changes!