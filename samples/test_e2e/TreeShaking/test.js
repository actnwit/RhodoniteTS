import { readFileSync } from 'node:fs';
import { testCheckWindowRendered } from '../common/testFunc';

const setURL = 'http://localhost:8082/samples/test_e2e/TreeShaking';

// esbuild's metafile of the sample bundle, written by scripts/build-tree-shaking-sample.mjs (pnpm build-samples).
const readMetafile = () => JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle/meta.json', 'utf8'));

/** The source modules that the entry chunk and its static imports contain, i.e. what loads before main.ts runs. */
const staticallyLoadedModules = metafile => {
  const outputs = metafile.outputs;
  const entry = Object.keys(outputs).find(path => outputs[path].entryPoint != null);
  const chunks = new Set();
  const stack = [entry];
  while (stack.length > 0) {
    const chunk = stack.pop();
    if (chunks.has(chunk)) {
      continue;
    }
    chunks.add(chunk);
    for (const imported of outputs[chunk].imports) {
      if (imported.kind === 'import-statement') {
        stack.push(imported.path);
      }
    }
  }
  const modules = [];
  for (const chunk of chunks) {
    for (const [path, input] of Object.entries(outputs[chunk].inputs)) {
      if (input.bytesInOutput > 0) {
        modules.push(path);
      }
    }
  }
  return modules;
};

test('regression test TreeShaking', async () => {
  await testCheckWindowRendered(browser, setURL, expect, 0.01);
});

test('TreeShaking bundle leaves out what the sample does not use', () => {
  const modules = staticallyLoadedModules(readMetafile());

  // Sanity check: the bundle is built from the unbundled ESM output.
  expect(modules.some(path => path.endsWith('dist/esmdev/foundation/system/Engine.js'))).toBe(true);

  const unexpected = modules.filter(
    path =>
      // Gizmos are registered only by registerGizmos() (the registry itself is part of the core).
      (/\/foundation\/gizmos\//.test(path) && !path.endsWith('/GizmoRegistry.js')) ||
      // The XR module is loaded only when XR is enabled.
      /\/dist\/esmdev\/xr\//.test(path) ||
      // __RN_WEBGPU__ = false drops every WGSL shader.
      /\/webgpu\/shaderity_shaders\//.test(path) ||
      // Material factories are imported one by one, never through the MaterialHelper namespace.
      path.endsWith('/foundation/helpers/MaterialHelper.js') ||
      // KTX2 (Zstandard decoder, ktx-parse) and Rapier are loaded only when they are used.
      /KTX2TextureLoader\.js$|_deps\/(zstddec|ktx-parse)\.js$|RapierPhysicsStrategy\.js$/.test(path)
  );
  expect(unexpected).toEqual([]);
});

test('TreeShaking sample does not download the XR module at runtime', async () => {
  const metafile = readMetafile();
  const xrChunk = Object.entries(metafile.outputs).find(([, output]) =>
    output.entryPoint?.endsWith('dist/esmdev/xr/main.js')
  )?.[0];
  // The XR module stays a lazily loaded chunk of the bundle.
  expect(xrChunk).toBeDefined();
  const xrChunkFileName = xrChunk.split('/').pop();

  const page = await browser.newPage();
  const requestedFiles = [];
  page.on('request', request => requestedFiles.push(request.url().split('/').pop()));
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(setURL);
  await page.waitForFunction(() => window._rendered, { timeout: 2000000 });

  const isXREnabled = await page.evaluate(() => window._isXREnabled);
  await page.close();

  expect(isXREnabled).toBe(false);
  expect(requestedFiles).not.toContain(xrChunkFileName);
  // The page really runs the bundle (not a raw module graph of dist/esmdev).
  expect(requestedFiles).toContain('main.js');
});
