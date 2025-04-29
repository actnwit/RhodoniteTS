import { merge } from 'webpack-merge';
import webpack from 'webpack';
import path from 'path';
import baseConfig from './webpack.config.base.js';

const config = merge(baseConfig, {
  mode: 'development',
  output: {
    filename: 'rhodonite.js',
    chunkFilename: 'rhodonite-[name].js',
    path: path.resolve(process.cwd(), 'dist/umd'),
    library: 'Rn',
    // libraryExport: 'default',
    // libraryTarget: 'umd',
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
});

export default config;
