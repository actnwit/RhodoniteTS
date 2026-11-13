import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.pnpm-store/**', '**/vendor/**', '**/.build/**', '**/samples/test_e2e/**'],
    environment: 'happy-dom',
    globals: true,
  },
  resolve: {
    // The repository root VERSION-FILE is not JavaScript. Substitute it so tests can import `src`.
    alias: [
      {
        find: '../VERSION-FILE',
        replacement: fileURLToPath(new URL('./versionFileMock.ts', import.meta.url)),
      },
    ],
  },
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.wgsl'],
});
