import { merge } from 'webpack-merge';
import webpack from 'webpack';
import path from 'path';
import baseConfig from './webpack.config.base.js';

const config = merge(baseConfig, {
  mode: 'production',
  output: {
    filename: 'rhodonite.min.js',
    chunkFilename: 'rhodonite-[name].min.js',
    path: path.resolve(process.cwd(), 'dist/umd'),
    library: 'Rn',
    // libraryExport: 'default',
    // libraryTarget: 'umd',
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
});

export default config;
