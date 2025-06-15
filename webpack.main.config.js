const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: './src/main/index.js',
  target: 'electron-main',
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
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.main.json')
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@services': path.resolve(__dirname, 'src/main/services'),
      '@utils': path.resolve(__dirname, 'src/main/utils'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js'
  }
};