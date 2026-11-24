// Bundles the TreeShaking E2E samples the way an application bundles Rhodonite: esbuild with tree shaking, code
// splitting, minification, and `__RN_WEBGPU__: false` to drop the WGSL shaders of a WebGL2-only application.
// Run by `pnpm build-samples` after `dist/esmdev` has been built.
//
// The samples import the package as `rhodonite` (not by relative path) so that esbuild reads the package's
// "sideEffects" field, exactly as it does for an application that installs the package. Two temporary files make
// that resolution point at this repository's dist/esmdev output:
//   - samples/test_e2e/TreeShaking/package.json gives the sample a package name of its own. Without it, the
//     repository's own package.json (also named "rhodonite") would answer the import as a package self-reference.
//   - samples/test_e2e/TreeShaking/node_modules/rhodonite is a package whose exports point at dist/esmdev.
//
// Output (git-ignored):
//   samples/test_e2e/TreeShaking/bundle/       main.js and its chunks, loaded by index.html
//   samples/test_e2e/TreeShaking/bundle-gltf/  mainGltf.js and its chunks; only its metafile is inspected
//   */meta.json                                esbuild's metafile; the E2E test reads it to check the bundle contents
import { existsSync } from 'node:fs';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sampleDir = path.join(projectRoot, 'samples/test_e2e/TreeShaking');

if (!existsSync(path.join(projectRoot, 'dist/esmdev/index.js'))) {
  throw new Error('dist/esmdev is not built. Run `pnpm build-esm-dev` (or `pnpm build`) first.');
}

/** Creates the temporary package files that make `import ... from 'rhodonite'` resolve to dist/esmdev. */
async function createLocalPackage() {
  await writeFile(
    path.join(sampleDir, 'package.json'),
    JSON.stringify({ name: 'rhodonite-treeshaking-sample', private: true, type: 'module' })
  );

  const packageDir = path.join(sampleDir, 'node_modules/rhodonite');
  await mkdir(packageDir, { recursive: true });
  await writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: 'rhodonite',
      type: 'module',
      exports: {
        '.': './dist/esmdev/index.js',
        './optional-materials': './dist/esmdev/foundation/helpers/materials/optionalMaterials.js',
        './dist/*': './dist/*',
      },
      sideEffects: ['./dist/esmdev/_deps/chunk-*.js'],
    })
  );
  await symlink(path.join(projectRoot, 'dist'), path.join(packageDir, 'dist'), process.platform === 'win32' ? 'junction' : 'dir');

  return async () => {
    await rm(path.join(sampleDir, 'node_modules'), { recursive: true, force: true });
    await rm(path.join(sampleDir, 'package.json'), { force: true });
  };
}

const entries = [
  { entry: 'main.ts', outDir: 'bundle' },
  { entry: 'mainGltf.ts', outDir: 'bundle-gltf' },
  { entry: 'mainPbr.ts', outDir: 'bundle-pbr' },
  { entry: 'mainOptional.ts', outDir: 'bundle-optional' },
];

const disposeLocalPackage = await createLocalPackage();

try {
  for (const { entry, outDir } of entries) {
    const outdir = path.join(sampleDir, outDir);
    await rm(outdir, { recursive: true, force: true });

    const result = await build({
      absWorkingDir: projectRoot,
      entryPoints: [path.join(sampleDir, entry)],
      outdir,
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

    await writeFile(path.join(outdir, 'meta.json'), JSON.stringify(result.metafile));

    const entryOutput = Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint != null);
    console.log(`Built the TreeShaking ${entry} bundle (${entryOutput?.[0] ?? 'main.js'})`);
  }
} finally {
  await disposeLocalPackage();
}
