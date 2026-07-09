import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';
import shaderity from 'esbuild-plugin-shaderity';
import version from 'esbuild-plugin-version';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../..');

const targets = {
  'esm-dev': {
    entry: 'src/index.ts',
    outDir: 'dist/esmdev',
    outfile: 'index.js',
    format: 'esm',
    sourcemap: 'inline',
    minify: false,
  },
  'esm-prod': {
    entry: 'src/index.ts',
    outDir: 'dist/esm',
    outfile: 'index.js',
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
    plugins: [
      shaderity({ filter: /\.(wgsl|glsl|vs|fs|vert|frag)$/ }),
      version({ filter: /VERSION-FILE$/ }),
      ...(shouldWatch ? [createDeclarationPlugin()] : []),
    ],
  };
}

await rm(outDir, { recursive: true, force: true });

if (shouldWatch) {
  const buildContext = await context(createOptions());
  await buildContext.watch();
  console.log(`Watching ${targetName}...`);
} else {
  await build(createOptions());
  await emitDeclarations();
}
