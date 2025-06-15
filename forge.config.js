const { MakerDMG } = require('@electron-forge/maker-dmg');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerZIP } = require('@electron-forge/maker-zip');
const path = require('path');

module.exports = {
  packagerConfig: {
    name: 'Datagres',
    executableName: 'datagres',
    icon: path.join(__dirname, 'build', 'icon'),
    appBundleId: 'com.datagres.app',
    appCategoryType: 'public.app-category.developer-tools',
    osxSign: process.env.APPLE_IDENTITY ? {
      identity: process.env.APPLE_IDENTITY,
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: path.join(__dirname, 'build', 'entitlements.mac.plist'),
      'entitlements-inherit': path.join(__dirname, 'build', 'entitlements.mac.plist'),
      'signature-flags': 'library'
    } : undefined,
    osxNotarize: process.env.APPLE_ID && process.env.APPLE_PASSWORD ? {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    } : undefined,
    asar: {
      unpack: '**/node_modules/{electron-store,keytar}/**/*'
    },
    ignore: [
      /^\/src/,
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/\.github/,
      /^\/tests/,
      /^\/dist/,
      /^\/\.env/,
      /^\/\.npmrc/,
      /^\/\.gitignore/,
      /^\/\.eslintrc/,
      /^\/electron\.vite\.config/,
      /^\/forge\.config/,
      /^\/tailwind\.config/,
      /^\/postcss\.config/,
      /^\/tsconfig/,
      /^\/vite\.config/,
      /^\/CLAUDE\.md/,
      /^\/README\.md/,
      /^\/LICENSE/
    ]
  },
  makers: [
    new MakerDMG({
      name: 'Datagres',
      overwrite: true,
      debug: false,
      background: undefined,
      contents: [
        {
          x: 448,
          y: 344,
          type: 'link',
          path: '/Applications'
        },
        {
          x: 192,
          y: 344,
          type: 'file'
        }
      ],
      format: 'ULFO'
    }),
    new MakerSquirrel({
      name: 'Datagres',
      authors: 'Datagres Team',
      description: 'Database Explorer',
      exe: 'datagres.exe',
      iconUrl: 'https://raw.githubusercontent.com/seepatcode/datagres/main/build/icon.ico',
      setupIcon: path.join(__dirname, 'build', 'icon.ico'),
      noMsi: true,
      certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
      certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD
    }),
    new MakerDeb({
      options: {
        maintainer: 'Datagres Team',
        homepage: 'https://github.com/seepatcode/datagres',
        icon: path.join(__dirname, 'build', 'icon.png'),
        categories: ['Development'],
        section: 'devel',
        description: 'Database Explorer - The world\'s fastest database exploration tool'
      }
    }),
    new MakerZIP({})
  ],
  plugins: [],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'seepatcode',
          name: 'datagres'
        },
        prerelease: false,
        draft: true
      }
    }
  ],
  hooks: {
    preMake: async () => {
      // Ensure the app is built before making distributables
      const { execSync } = require('child_process');
      console.log('Building app with electron-vite...');
      execSync('npm run build', { stdio: 'inherit' });
    }
  }
};