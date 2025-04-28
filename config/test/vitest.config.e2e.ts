import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    include: ['**/test.js'],
    globals: true,
    environment: 'puppeteer',
    globalSetup: 'vitest-environment-puppeteer/global-init',
    testTimeout: 1000000,
  },
  resolve: {},
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.wgsl'],
});
