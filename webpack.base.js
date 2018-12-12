const webpack = require('webpack')
const path = require('path')

const srcPath = path.join(__dirname, './src')
const distPath = path.join(__dirname, './dist')

const webpackConfig = {
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, srcPath)],
        loader: 'babel-loader'
      },
      {
        test: /\.(png|jpg|gif|ico|svg|woff)$/,
        loader: 'url-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader'
      }
    ]
  }
}

module.exports = webpackConfig
