// Local update server for testing auto-updates
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3333;

// Serve update files
app.use('/releases', express.static(path.join(__dirname, '../dist/make')));

// Mock GitHub API endpoints
app.get('/repos/:owner/:repo/releases/latest', (req, res) => {
  const version = require('../package.json').version;
  
  res.json({
    tag_name: `v${version}`,
    name: `v${version}`,
    prerelease: false,
    assets: [
      {
        name: 'Datagres.dmg',
        browser_download_url: `http://localhost:${PORT}/releases/Datagres.dmg`
      },
      {
        name: `Datagres-darwin-arm64-${version}.zip`,
        browser_download_url: `http://localhost:${PORT}/releases/zip/darwin/arm64/Datagres-darwin-arm64-${version}.zip`
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Local update server running at http://localhost:${PORT}`);
  console.log(`📦 Serving updates from: ${path.join(__dirname, '../dist/make')}`);
  console.log('\nTo test:');
  console.log('1. Update your main/index.js to use localhost:');
  console.log(`   repo: 'localhost:${PORT}/repos/seepatcode/datagres'`);
  console.log('2. Build and run the app');
  console.log('3. Bump version and build again');
  console.log('4. Check for updates in the app');
});