import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {},
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.wgsl'],
});
