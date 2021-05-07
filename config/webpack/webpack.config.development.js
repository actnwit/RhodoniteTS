const merge = require('webpack-merge').merge;
const webpack = require('webpack');
const path = require('path');
const baseConfig = require('./webpack.config.base.js');

const config = merge(baseConfig, {
  mode: 'development',
  output: {
    filename: 'rhodonite.js',
    chunkFilename: 'rhodonite-[name].js',
    path: path.resolve(__dirname, './../../dist/umd'),
    library: 'Rn',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
});

module.exports = config;
