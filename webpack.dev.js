const webpack = require('webpack')
const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const srcPath = path.join(__dirname, './src')
const distPath = path.join(__dirname, './dist')

const webpackConfig = {
  mode: 'development',
  entry: {
    index: [require.resolve('webpack-dev-server/client'), path.join(srcPath, './dev/index.js')]
  },
  devServer: {
    contentBase: path.join(srcPath),
    host: '127.0.0.1',
    compress: true,
    port: '8876'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(srcPath, './dev/index.html'),
      filename: 'index.html',
      inject: 'body'
    })
  ]
}

module.exports = merge(baseConfig, webpackConfig)