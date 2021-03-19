const merge = require('webpack-merge').merge;
const webpack = require('webpack');
const path = require('path');
const baseConfig = require('./webpack.config.base.js');

const config = merge(baseConfig, {
  mode: 'production',
  output: {
    filename: 'rhodonite.min.js',
    chunkFilename: 'rhodonite-[name].min.js',
    path: path.resolve(__dirname, './../../dist/umd'),
    library: 'Rn',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
});

module.exports = config;
