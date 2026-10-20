import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.pnpm-store/**', '**/vendor/**', '**/.build/**', '**/samples/test_e2e/**'],
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {},
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.wgsl'],
});
