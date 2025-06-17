const { MakerDMG } = require('@electron-forge/maker-dmg');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');
const path = require('path');

const mainConfig = require('./webpack.main.config');
const rendererConfig = require('./webpack.renderer.config');
const preloadConfig = require('./webpack.preload.config');

module.exports = {
  packagerConfig: {
    name: 'Datagres',
    executableName: 'datagres',
    icon: path.join(__dirname, 'build', 'icon'),
    appBundleId: 'com.datagres.app',
    appCategoryType: 'public.app-category.developer-tools',
    // Code signing disabled for now
    // osxSign: process.env.APPLE_IDENTITY ? {
    //   identity: process.env.APPLE_IDENTITY,
    //   hardenedRuntime: true,
    //   gatekeeperAssess: false,
    //   entitlements: path.join(__dirname, 'build', 'entitlements.mac.plist'),
    //   'entitlements-inherit': path.join(__dirname, 'build', 'entitlements.mac.plist'),
    //   'signature-flags': 'library'
    // } : undefined,
    // osxNotarize: process.env.APPLE_ID && process.env.APPLE_PASSWORD ? {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID
    // } : undefined,
    asar: {
      unpack: '**/node_modules/{electron-store,keytar}/**/*'
    }
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
          type: 'file',
          path: 'Datagres.app'
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
  plugins: [
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' data: https://cdn.jsdelivr.net; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' ws://localhost:9001 http://localhost:9001",
      port: 9001,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/main.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.js',
              config: preloadConfig
            }
          }
        ]
      }
    })
  ],
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
  ]
};