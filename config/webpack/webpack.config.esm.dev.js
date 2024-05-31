const merge = require('webpack-merge').merge;
const path = require('path');
const baseConfig = require('./webpack.config.base.js');
const webpack = require('webpack');

const config = merge(baseConfig, {
  entry: './src/cjs.ts',
  target: 'node',
  mode: 'development',
  output: {
    filename: 'index.js',
    chunkFilename: 'rhodonite-[name].js',
    path: path.resolve(__dirname, './../../dist/esmdev'),
    library: {
      type: 'module',
    },
    chunkLoading: 'import',
    chunkFormat: 'module',
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  experiments: {
    outputModule: true,
  },
  optimization: {
    usedExports: true,
    minimize: true,
  },
});

module.exports = config;
