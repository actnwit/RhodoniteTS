import { spawn } from 'node:child_process';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';
import shaderity from 'esbuild-plugin-shaderity';
import version from 'esbuild-plugin-version';
import { buildUnbundled } from './unbundled.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');

const targets = {
  // The ESM targets keep one output file per source module (see unbundled.mjs) so that applications
  // bundling Rhodonite can tree-shake what they do not use. The IIFE targets stay single bundles.
  'esm-dev': {
    unbundled: true,
    outDir: 'dist/esmdev',
    format: 'esm',
    sourcemap: 'inline',
    minify: false,
  },
  'esm-prod': {
    unbundled: true,
    outDir: 'dist/esm',
    format: 'esm',
    sourcemap: false,
    minify: true,
  },
  'iife-dev': {
    entry: 'src/iife.ts',
    outDir: 'dist/iifedev',
    outfile: 'iife.global.js',
    format: 'iife',
    globalName: 'Rn',
    sourcemap: 'inline',
    minify: false,
    treeShaking: false,
  },
  'iife-prod': {
    entry: 'src/iife.ts',
    outDir: 'dist/iife',
    outfile: 'iife.global.js',
    format: 'iife',
    globalName: 'Rn',
    sourcemap: false,
    minify: true,
    treeShaking: false,
  },
};

const targetName = process.argv[2];
const shouldWatch = process.argv.includes('--watch');
const target = targets[targetName];

if (target == null) {
  console.error(`Unknown build target: ${targetName ?? '(missing)'}`);
  console.error(`Expected one of: ${Object.keys(targets).join(', ')}`);
  process.exit(1);
}

const outDir = path.resolve(projectRoot, target.outDir);

async function emitDeclarations() {
  const command = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
  const args = [
    '-p',
    'tsconfig.json',
    '--emitDeclarationOnly',
    '--declaration',
    '--declarationDir',
    target.outDir,
    '--rootDir',
    './src',
    '--pretty',
    'false',
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tsc declaration emit failed with exit code ${code}`));
      }
    });
  });

  if (target.unbundled) {
    await writeIndexDeclaration();
  }
}

/**
 * Rewrites the emitted index.d.ts so that the default export is declared as the `Rn` namespace.
 *
 * src/index.ts creates the default export with `enableRnNamespaceDefaults(RnNamespace)`, which returns the
 * namespace object itself; tsc declares it as a constant (`declare const Rn: typeof RnNamespace`), and a constant
 * cannot be used in type positions such as `Rn.ISceneGraphEntity`. Declaring it as the namespace again keeps the
 * types that applications have always used, and matches the runtime value.
 */
async function writeIndexDeclaration() {
  const indexDeclaration = [
    "import * as Rn from './import';",
    "export * from './import';",
    'export default Rn;',
    '',
  ].join('\n');
  await writeFile(path.join(outDir, 'index.d.ts'), indexDeclaration);
}

function createDeclarationPlugin() {
  return {
    name: 'declaration-emit',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length === 0) {
          await emitDeclarations();
        }
      });
    },
  };
}

function createPlugins() {
  return [shaderity({ filter: /\.(wgsl|glsl|vs|fs|vert|frag)$/ }), version({ filter: /VERSION-FILE$/ })];
}

function createUnbundledOptions() {
  return {
    projectRoot,
    srcDir: path.resolve(projectRoot, 'src'),
    outDir,
    excludedEntries: [path.resolve(projectRoot, 'src/iife.ts')],
    esbuildOptions: {
      sourcemap: target.sourcemap,
      minify: target.minify,
      platform: 'browser',
      target: 'es2019',
      logLevel: 'warning',
    },
    plugins: createPlugins(),
    watch: shouldWatch,
    extraPlugins: shouldWatch ? [createDeclarationPlugin()] : [],
  };
}

function createOptions() {
  return {
    absWorkingDir: projectRoot,
    entryPoints: [target.entry],
    outfile: path.join(outDir, target.outfile),
    bundle: true,
    format: target.format,
    globalName: target.globalName,
    sourcemap: target.sourcemap,
    minify: target.minify,
    treeShaking: target.treeShaking,
    platform: 'browser',
    target: 'es2019',
    plugins: [...createPlugins(), ...(shouldWatch ? [createDeclarationPlugin()] : [])],
  };
}

await rm(outDir, { recursive: true, force: true });

if (target.unbundled) {
  await buildUnbundled(createUnbundledOptions());
  if (shouldWatch) {
    console.log(`Watching ${targetName}...`);
  } else {
    await emitDeclarations();
  }
} else if (shouldWatch) {
  const buildContext = await context(createOptions());
  await buildContext.watch();
  console.log(`Watching ${targetName}...`);
} else {
  await build(createOptions());
  await emitDeclarations();
}
