import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// The compiled E2E samples are git-ignored (see samples/**/main.js* in .gitignore).
// Run `pnpm build-samples` beforehand, otherwise no E2E test can be discovered.
if (!existsSync('./samples/test_e2e/common/testHelpers.js')) {
  throw new Error('E2E samples are not compiled. Run `pnpm build-samples` before `pnpm test-e2e`.');
}

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.pnpm-store/**'],
    include: ['samples/test_e2e/**/*test.js'],
    globals: true,
    // One Chrome instance and one test at a time: visual regression tests must run in a
    // stable environment, and spawning a browser per CPU core saturates the machine
    // (CPU/GPU) without improving the results.
    maxWorkers: 1,
    fileParallelism: false,
    environment: 'puppeteer',
    globalSetup: 'vitest-environment-puppeteer/global-init',
    testTimeout: 1000000,
  },
  resolve: {},
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.wgsl'],
});
