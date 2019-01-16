const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');

const config = merge(baseConfig, {
  mode: 'production',
  output: {
    filename: 'rhodonite.min.js',
    chunkFilename: "rhodonite-[name].min.js"
  }
});

module.exports = config;
