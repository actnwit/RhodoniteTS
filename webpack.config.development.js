const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');

const config = merge(baseConfig, {
  mode: 'development',
  output: {
    filename: 'rhodonite.js',
    chunkFilename: "rhodonite-[name].js"
  }
});

module.exports = config;
