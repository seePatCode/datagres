const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  target: 'electron-preload',
  entry: {
    preload: './src/preload/index.js'
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: [/node_modules/, /\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /__tests__/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript'
            ]
          }
        }
      }
    ]
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  output: {
    path: path.resolve(__dirname, '.webpack/preload'),
    filename: 'index.js'
  }
};