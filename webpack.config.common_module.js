const merge = require('webpack-merge')
const path = require('path')
const baseConfig = require('./webpack.config.base.js')

const config = merge(baseConfig, {
  mode: 'development',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, "dist/esm"),
    // library: "Rn",
    // libraryExport: 'default',
    libraryTarget: "commonjs-module"
  },
})

module.exports = config
