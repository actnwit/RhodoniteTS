// Bundles samples/test_e2e/TreeShaking the way an application bundles Rhodonite: esbuild with tree shaking, code
// splitting, minification, and `__RN_WEBGPU__: false` to drop the WGSL shaders of a WebGL2-only application.
// Run by `pnpm build-samples` after `dist/esmdev` has been built.
//
// Output (git-ignored): samples/test_e2e/TreeShaking/bundle/
//   main.js and its chunks  loaded by the sample's index.html
//   meta.json               esbuild's metafile; the E2E test reads it to check what the bundle contains
import { existsSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sampleDir = path.join(projectRoot, 'samples/test_e2e/TreeShaking');
const outDir = path.join(sampleDir, 'bundle');

if (!existsSync(path.join(projectRoot, 'dist/esmdev/index.js'))) {
  throw new Error('dist/esmdev is not built. Run `pnpm build-esm-dev` (or `pnpm build`) first.');
}

await rm(outDir, { recursive: true, force: true });

const result = await build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(sampleDir, 'main.ts')],
  outdir: outDir,
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: 'es2022',
  platform: 'browser',
  define: { __RN_WEBGPU__: 'false' },
  metafile: true,
  logLevel: 'warning',
});

await writeFile(path.join(outDir, 'meta.json'), JSON.stringify(result.metafile));

const entryOutput = Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint != null);
console.log(`Built the TreeShaking sample bundle (${entryOutput?.[0] ?? 'main.js'})`);
