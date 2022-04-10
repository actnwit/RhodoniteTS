const merge = require('webpack-merge').merge;
const path = require('path');
const baseConfig = require('./webpack.config.base.js');
const webpack = require('webpack');

const config = merge(baseConfig, {
  target: 'node',
  mode: 'development',
  output: {
    filename: 'index.js',
    chunkFilename: 'rhodonite-[name].js',
    path: path.resolve(__dirname, './../../dist/esm'),
    library: {
      name: 'Rn',
      type: 'commonjs2',
    },
    // libraryTarget: 'commonjs2',
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
});

module.exports = config;
