const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";

module.exports = {
  entry: [
    'react-hot-loader',
    './src/index.jsx',
    './styles/main.scss'
  ],
  devtool: 'eval-source-map',
  output: {
    publicPath: '/',
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.scss$/, 
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap&localIdentName=[local]___[hash:base64:5]!sass?outputStyle=expanded'),
        exclude: ['node_modules']
      }
    ]
  },
  devServer: {
    contentBase: "./public",
    noInfo: true,
    hot: true,
    inline: true,
    historyApiFallback: true,
    port: PORT,
    host: HOST
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin("style.css", {
      allChunks: true
    }),
    new DashboardPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      files: {
        css: ['style.css'],
        js: [ "bundle.js"],
      }
    })
  ]
}
