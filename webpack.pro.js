const webpack = require('webpack')
const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base')

const srcPath = path.join(__dirname, './src')
const distPath = path.join(__dirname, './dist')

const webpackConfig = {
  mode: 'development',
  entry: {
    index: [path.join(srcPath, './index.js')]
  },
  output: {
    path: distPath,
    publicPath: './',
    library: 'kJSEditor',
    libraryTarget: 'umd',
    libraryExport: 'default'
  }
}

module.exports = merge(baseConfig, webpackConfig)
