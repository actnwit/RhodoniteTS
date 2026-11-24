import { readFileSync } from 'node:fs';
import { testCheckWindowRendered } from '../common/testFunc';

const setURL = 'http://localhost:8082/samples/test_e2e/TreeShaking';

// esbuild's metafile of the sample bundle, written by scripts/build-tree-shaking-sample.mjs (pnpm build-samples).
const readMetafile = () => JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle/meta.json', 'utf8'));
// The other scenarios are bundled too, but the page never loads them: only their metafiles are inspected.
const readGltfMetafile = () => JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle-gltf/meta.json', 'utf8'));
const readPbrMetafile = () => JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle-pbr/meta.json', 'utf8'));
const readOptionalMetafile = () =>
  JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle-optional/meta.json', 'utf8'));
const readWebGpuMetafile = () =>
  JSON.parse(readFileSync('./samples/test_e2e/TreeShaking/bundle-webgpu/meta.json', 'utf8'));

/**
 * The chunks that the entry chunk statically imports, i.e. what loads before the sample runs.
 * The metafile also lists the lazy chunks as entry points, so the sample entry is selected by its path.
 */
const staticClosureChunks = (metafile, entrySuffix) => {
  const outputs = metafile.outputs;
  const entry = Object.keys(outputs).find(path => outputs[path].entryPoint?.endsWith(entrySuffix));
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
  return chunks;
};

/** The source modules that the entry chunk and its static imports contain. */
const staticallyLoadedModules = (metafile, entrySuffix) => {
  const outputs = metafile.outputs;
  const modules = [];
  for (const chunk of staticClosureChunks(metafile, entrySuffix)) {
    for (const [path, input] of Object.entries(outputs[chunk].inputs)) {
      if (input.bytesInOutput > 0) {
        modules.push(path);
      }
    }
  }
  return modules;
};

/** The total size of the static closure, used as a regression budget. */
const staticallyLoadedBytes = (metafile, entrySuffix) => {
  const outputs = metafile.outputs;
  let bytes = 0;
  for (const chunk of staticClosureChunks(metafile, entrySuffix)) {
    bytes += outputs[chunk].bytes;
  }
  return bytes;
};

test('regression test TreeShaking', async () => {
  await testCheckWindowRendered(browser, setURL, expect, 0.01);
});

test('TreeShaking bundle leaves out what the sample does not use', () => {
  const modules = staticallyLoadedModules(readMetafile(), 'samples/test_e2e/TreeShaking/main.ts');

  // Sanity check: the bundle is built from the unbundled ESM output.
  expect(modules.some(path => path.endsWith('dist/esmdev/foundation/system/Engine.js'))).toBe(true);
  // Regression budget, with headroom over the current size (about 517KB).
  expect(staticallyLoadedBytes(readMetafile(), 'samples/test_e2e/TreeShaking/main.ts')).toBeLessThan(550 * 1024);

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
      // Optional components register their hooks when they are imported; the Engine does not import them.
      /\/foundation\/components\/Animation\/AnimationComponent\.js$/.test(path) ||
      /\/foundation\/components\/CameraController\/CameraControllerComponent\.js$/.test(path) ||
      /\/foundation\/cameras\/(Orbit|WalkThrough)CameraController\.js$/.test(path) ||
      // Named mesh helpers drop the unused shapes and the compatibility MeshHelper object.
      path.endsWith('/foundation/helpers/MeshHelperObject.js') ||
      /\/foundation\/geometry\/shapes\/(?!Plane\.js$|IShape\.js$)[^/]+\.js$/.test(path) ||
      // __RN_WEBGPU__ = false drops the WebGPU shader utility as well as the WGSL shaders.
      path.endsWith('/foundation/materials/core/ShaderityUtilityWebGPU.js') ||
      // The light cluster system is loaded when the first light is added (the stub and layout stay in the core).
      path.endsWith('/renderer/lightCluster/LightClusterSystem.js') ||
      path.endsWith('/renderer/lightCluster/LightClusterBuilder.js') ||
      // KTX2 (Zstandard decoder, ktx-parse) and Rapier are loaded only when they are used.
      /KTX2TextureLoader\.js$|_deps\/(zstddec|ktx-parse)\.js$|RapierPhysicsStrategy\.js$/.test(path)
  );
  expect(unexpected).toEqual([]);
});

test('TreeShaking bundle does not emit the disabled WebGPU backend', () => {
  const outputs = readMetafile().outputs;
  const webgpuChunk = Object.entries(outputs).find(([, output]) =>
    output.entryPoint?.endsWith('dist/esmdev/webgpu/main.js')
  );
  // __RN_WEBGPU__ = false removes the dynamic import itself, so the chunk is not emitted at all.
  expect(webgpuChunk).toBeUndefined();
});

test('TreeShaking glTF bundle keeps optional material implementations lazy', () => {
  const metafile = readGltfMetafile();
  const modules = staticallyLoadedModules(metafile, 'samples/test_e2e/TreeShaking/mainGltf.ts');

  // The glTF importer and the PBR material are part of this application.
  expect(modules.some(path => path.endsWith('dist/esmdev/foundation/importer/ModelConverter.js'))).toBe(true);
  // Regression budget, with headroom over the current size (about 714KB).
  expect(staticallyLoadedBytes(metafile, 'samples/test_e2e/TreeShaking/mainGltf.ts')).toBeLessThan(745 * 1024);

  const unexpected = modules.filter(
    path =>
      // Node-based materials pull the shader graph resolver and every shader node class.
      path.endsWith('/helpers/materials/createNodeBasedCustomMaterial.js') ||
      path.endsWith('/materials/core/ShaderGraphResolver.js') ||
      /\/materials\/nodes\//.test(path) ||
      // MToon is used only by VRM models.
      /\/helpers\/materials\/createMToon(0x|1)Material\.js$/.test(path) ||
      /\/materials\/contents\/MToon(0x|1)MaterialContent\.js$/.test(path) ||
      // Rapier and the Draco decoder are loaded only for models that need them.
      path.endsWith('/physics/Rapier/RapierPhysicsStrategy.js') ||
      path.endsWith('/importer/DrcPointCloudImporter.js') ||
      // The raymarching component and its SDF evaluator are loaded only for RHODONITE_raymarching nodes.
      path.endsWith('/components/Raymarching/RaymarchingComponent.js') ||
      path.endsWith('/components/Raymarching/RaymarchingSdfEvaluator.js') ||
      // The importer does not pull the camera controller implementation either.
      path.endsWith('/components/CameraController/CameraControllerComponent.js') ||
      path.endsWith('/cameras/OrbitCameraController.js') ||
      path.endsWith('/cameras/WalkThroughCameraController.js') ||
      // The light cluster system is loaded when the first light is added.
      path.endsWith('/renderer/lightCluster/LightClusterSystem.js') ||
      path.endsWith('/renderer/lightCluster/LightClusterBuilder.js')
  );
  expect(unexpected).toEqual([]);

  // They are still emitted for models that use them, but only as lazy chunks.
  const allInputs = new Set(Object.values(metafile.outputs).flatMap(output => Object.keys(output.inputs)));
  expect([...allInputs].some(path => path.endsWith('/createNodeBasedCustomMaterial.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/createMToon1Material.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/RapierPhysicsStrategy.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/DrcPointCloudImporter.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/RaymarchingComponent.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/RaymarchingSdfEvaluator.js'))).toBe(true);
  expect([...allInputs].some(path => path.endsWith('/LightClusterSystem.js'))).toBe(true);
});

test('TreeShaking PBR bundle does not include optional material implementations', () => {
  const metafile = readPbrMetafile();
  const modules = staticallyLoadedModules(metafile, 'samples/test_e2e/TreeShaking/mainPbr.ts');

  // The PBR material factory and its shader are the only material implementation this application uses.
  expect(modules.some(path => path.endsWith('/helpers/materials/createPbrUberMaterial.js'))).toBe(true);
  // Regression budget, with headroom over the current size (about 552KB).
  expect(staticallyLoadedBytes(metafile, 'samples/test_e2e/TreeShaking/mainPbr.ts')).toBeLessThan(590 * 1024);
  expect(modules.some(path => path.endsWith('/webgl/shaderity_shaders/PbrSingleShader/PbrSingleShader.frag.js'))).toBe(
    true
  );

  const unexpected = modules.filter(
    path =>
      // Node-based materials pull the shader graph resolver and every shader node class.
      path.endsWith('/helpers/materials/createNodeBasedCustomMaterial.js') ||
      path.endsWith('/materials/core/ShaderGraphResolver.js') ||
      /\/materials\/nodes\//.test(path) ||
      // MToon is used only by VRM models.
      /\/helpers\/materials\/createMToon(0x|1)Material\.js$/.test(path) ||
      /\/materials\/contents\/MToon(0x|1)MaterialContent\.js$/.test(path) ||
      // Optional components and unused mesh shapes stay out of a PBR-only application.
      path.endsWith('/components/Animation/AnimationComponent.js') ||
      path.endsWith('/components/CameraController/CameraControllerComponent.js') ||
      path.endsWith('/components/Raymarching/RaymarchingComponent.js') ||
      path.endsWith('/components/Raymarching/RaymarchingSdfEvaluator.js') ||
      path.endsWith('/renderer/lightCluster/LightClusterSystem.js') ||
      path.endsWith('/renderer/lightCluster/LightClusterBuilder.js') ||
      path.endsWith('/cameras/OrbitCameraController.js') ||
      path.endsWith('/cameras/WalkThroughCameraController.js') ||
      path.endsWith('/foundation/helpers/MeshHelperObject.js') ||
      /\/geometry\/shapes\/(?!Plane\.js$|IShape\.js$)[^/]+\.js$/.test(path)
  );
  expect(unexpected).toEqual([]);
});

test('TreeShaking WebGPU bundle drops the WebGL backend', () => {
  const metafile = readWebGpuMetafile();
  const modules = staticallyLoadedModules(metafile, 'samples/test_e2e/TreeShaking/mainWebGpu.ts');

  // WGSL shaders stay; GLSL shaders and the WebGL shader utility are dropped.
  expect(modules.some(path => /\/webgpu\/shaderity_shaders\//.test(path))).toBe(true);
  expect(modules.some(path => /\/webgl\/shaderity_shaders\//.test(path))).toBe(false);
  expect(modules.some(path => path.endsWith('/materials/core/ShaderityUtilityWebGL.js'))).toBe(false);

  const webglChunk = Object.entries(metafile.outputs).find(([, output]) =>
    output.entryPoint?.endsWith('dist/esmdev/webgl/main.js')
  );
  // __RN_WEBGL__ = false removes the dynamic import itself, so the chunk is not emitted at all.
  expect(webglChunk).toBeUndefined();

  // Regression budget, with headroom over the current size.
  expect(staticallyLoadedBytes(metafile, 'samples/test_e2e/TreeShaking/mainWebGpu.ts')).toBeLessThan(600 * 1024);
});

test('TreeShaking optional-materials subpath provides the optional factories', () => {
  const metafile = readOptionalMetafile();
  const modules = staticallyLoadedModules(metafile, 'samples/test_e2e/TreeShaking/mainOptional.ts');

  expect(modules.some(path => path.endsWith('/helpers/materials/createMToon1Material.js'))).toBe(true);
  expect(modules.some(path => path.endsWith('/materials/contents/MToon1MaterialContent.js'))).toBe(true);
});

test('TreeShaking sample does not download the PBR sheen LUT at runtime', async () => {
  const metafile = readMetafile();
  const pbrChunk = Object.entries(metafile.outputs).find(([, output]) =>
    output.entryPoint?.endsWith('dist/esmdev/pbr/main.js')
  )?.[0];
  // The module stays a lazy chunk, but the sample creates no sheen material, so it must not be requested.
  expect(pbrChunk).toBeDefined();
  const pbrChunkFileName = pbrChunk.split('/').pop();

  const page = await browser.newPage();
  const requestedFiles = [];
  page.on('request', request => requestedFiles.push(request.url().split('/').pop()));
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(setURL);
  await page.waitForFunction(() => window._rendered, { timeout: 2000000 });
  await page.close();

  expect(requestedFiles).not.toContain(pbrChunkFileName);
});

test('TreeShaking sample does not download the light cluster system at runtime', async () => {
  const metafile = readMetafile();
  const chunk = Object.entries(metafile.outputs).find(([, output]) =>
    output.entryPoint?.endsWith('dist/esmdev/foundation/renderer/lightCluster/LightClusterSystem.js')
  )?.[0];
  // The system stays a lazy chunk; the sample has no lights, so it must not be requested.
  expect(chunk).toBeDefined();
  const chunkFileName = chunk.split('/').pop();

  const page = await browser.newPage();
  const requestedFiles = [];
  page.on('request', request => requestedFiles.push(request.url().split('/').pop()));
  await page.setDefaultNavigationTimeout(2000000);
  await page.goto(setURL);
  await page.waitForFunction(() => window._rendered, { timeout: 2000000 });
  await page.close();

  expect(requestedFiles).not.toContain(chunkFileName);
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
