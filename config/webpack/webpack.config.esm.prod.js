import { merge } from 'webpack-merge';
import path from 'path';
import baseConfig from './webpack.config.base.js';
import webpack from 'webpack';

const config = merge(baseConfig, {
  entry: './src/index.ts',
  target: 'node',
  mode: 'production',
  output: {
    filename: 'index.js',
    chunkFilename: 'rhodonite-[name].js',
    path: path.resolve(process.cwd(), 'dist/esm'),
    library: {
      type: 'module',
    },
    chunkLoading: 'import',
    chunkFormat: 'module',
  },
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

export default config;
