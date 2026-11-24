// Unbundled ESM build: every source module under src/ is emitted as its own JavaScript file at the same
// relative path, so that bundlers of applications can tree-shake the modules an application does not use.
//
// - TypeScript sources: src/foundation/math/Vector3.ts -> <outDir>/foundation/math/Vector3.js
// - Shader sources (processed by shaderity): src/webgl/.../X.frag -> <outDir>/webgl/.../X.frag.js
// - Imports that resolve outside src/ (npm packages, vendor/*.js) are bundled once into <outDir>/_deps/
//   with code splitting, so the output also runs directly in browsers without an import map.
//   VERSION-FILE is the exception: it is inlined into version.js by esbuild-plugin-version.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { build, context } from 'esbuild';

const shaderFilePattern = /\.(wgsl|glsl|vs|fs|vert|frag)$/;
const inlinedImportPattern = /VERSION-FILE$/;
const depsDirName = '_deps';

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isSourceEntry(fileName) {
  if (shaderFilePattern.test(fileName)) {
    return true;
  }
  return fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.test.ts');
}

/**
 * Collects every module under srcDir as an esbuild entry point, keyed by its absolute path.
 * The value is the output path relative to outDir, without the `.js` extension esbuild appends.
 */
function collectSourceEntries(srcDir, excludedFiles) {
  const entries = new Map();
  const walk = dir => {
    for (const dirent of readdirSync(dir, { withFileTypes: true })) {
      const absPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        walk(absPath);
      } else if (isSourceEntry(dirent.name) && !excludedFiles.has(absPath)) {
        const relPath = toPosix(path.relative(srcDir, absPath));
        entries.set(absPath, relPath.endsWith('.ts') ? relPath.slice(0, -'.ts'.length) : relPath);
      }
    }
  };
  walk(srcDir);
  return entries;
}

function isBareSpecifier(specifier) {
  return !specifier.startsWith('.') && !path.isAbsolute(specifier);
}

/** Output name (relative to the _deps directory, without extension) of a dependency bundled into _deps. */
function depOutName(specifier, resolvedPath, projectRoot) {
  const name = isBareSpecifier(specifier) ? specifier : toPosix(path.relative(projectRoot, resolvedPath));
  return name.replace(/\.(m?js|cjs)$/, '').replace(/^@/, '').replace(/[/\\]/g, '__');
}

function relativeImportPath(fromOutPath, toOutPath) {
  const rel = toPosix(path.relative(path.dirname(fromOutPath), toOutPath));
  return rel.startsWith('.') ? rel : `./${rel}`;
}

/**
 * esbuild plugin that turns every import of the source tree into an external import of the corresponding
 * output file, and every import that leaves the source tree into an external import of _deps/.
 * It must be listed before the shaderity plugin, which otherwise claims the shader imports.
 */
function createUnbundlePlugin({ srcDir, projectRoot, entries, deps }) {
  return {
    name: 'rhodonite-unbundle',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /.*/ }, async args => {
        if (args.kind === 'entry-point' || args.pluginData?.rhodoniteUnbundleInner) {
          return undefined;
        }
        const importerOutName = entries.get(args.importer);
        if (importerOutName == null || inlinedImportPattern.test(args.path)) {
          // Imports inside _deps bundles, or files inlined into their importer.
          return undefined;
        }

        let resolvedPath;
        if (shaderFilePattern.test(args.path)) {
          resolvedPath = path.resolve(args.resolveDir, args.path);
        } else {
          const result = await pluginBuild.resolve(args.path, {
            kind: args.kind,
            importer: args.importer,
            resolveDir: args.resolveDir,
            pluginData: { rhodoniteUnbundleInner: true },
          });
          if (result.errors.length > 0) {
            return { errors: result.errors };
          }
          resolvedPath = result.path;
        }

        let targetOutName = entries.get(resolvedPath);
        if (targetOutName == null) {
          if (resolvedPath.startsWith(srcDir + path.sep)) {
            return {
              errors: [{ text: `${args.path} resolves to ${resolvedPath}, which is not an entry of the unbundled build` }],
            };
          }
          let depName = deps.get(resolvedPath);
          if (depName == null) {
            depName = depOutName(args.path, resolvedPath, projectRoot);
            deps.set(resolvedPath, depName);
          }
          targetOutName = `${depsDirName}/${depName}`;
        }

        return {
          path: relativeImportPath(`${importerOutName}.js`, `${targetOutName}.js`),
          external: true,
        };
      });
    },
  };
}

/**
 * Builds the unbundled ESM output.
 *
 * @param {object} options
 * @param {string} options.projectRoot - absolute path of the repository root
 * @param {string} options.srcDir - absolute path of src/
 * @param {string} options.outDir - absolute path of the output directory
 * @param {string[]} options.excludedEntries - absolute paths of source files not to emit (e.g. the IIFE entry)
 * @param {object} options.esbuildOptions - shared esbuild options (minify, sourcemap, target, platform, ...)
 * @param {object[]} options.plugins - plugins that load source files (shaderity, version)
 * @param {boolean} options.watch - keep watching after the first build
 * @param {object[]} options.extraPlugins - plugins appended to the source build (e.g. declaration emit)
 */
export async function buildUnbundled({
  projectRoot,
  srcDir,
  outDir,
  excludedEntries,
  esbuildOptions,
  plugins,
  watch,
  extraPlugins = [],
}) {
  const entries = collectSourceEntries(srcDir, new Set(excludedEntries));
  const deps = new Map();
  let builtDepsKey = '';

  const buildDeps = async () => {
    const depsKey = [...deps.entries()].map(([p, n]) => `${p}=${n}`).join('\n');
    if (depsKey === builtDepsKey) {
      return;
    }
    builtDepsKey = depsKey;
    await build({
      ...esbuildOptions,
      // Dependencies are bundled separately with their own name map, which could diverge from the main build.
      mangleProps: undefined,
      reserveProps: undefined,
      mangleCache: undefined,
      absWorkingDir: projectRoot,
      entryPoints: [...deps.entries()].map(([absPath, outName]) => ({ in: absPath, out: outName })),
      outdir: path.join(outDir, depsDirName),
      bundle: true,
      splitting: true,
      format: 'esm',
      chunkNames: 'chunk-[hash]',
      plugins,
    });
  };

  const depsPlugin = {
    name: 'rhodonite-unbundle-deps',
    setup(pluginBuild) {
      pluginBuild.onEnd(async result => {
        if (result.errors.length === 0) {
          await buildDeps();
        }
      });
    },
  };

  const options = {
    ...esbuildOptions,
    absWorkingDir: projectRoot,
    entryPoints: [...entries.entries()].map(([absPath, outName]) => ({ in: absPath, out: outName })),
    outdir: outDir,
    bundle: true,
    splitting: false,
    format: 'esm',
    plugins: [createUnbundlePlugin({ srcDir, projectRoot, entries, deps }), ...plugins, depsPlugin, ...extraPlugins],
  };

  if (watch) {
    const buildContext = await context(options);
    await buildContext.watch();
    return buildContext;
  }
  await build(options);
  return undefined;
}
