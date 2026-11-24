import Rn from '../../../../dist/esm';
import { computeLightClusterIndex, readLightClusterEntries } from './LightClusterBuilder';
import { getLightClusterViewLayout, LightClusterLayout, unpackLightEntry } from './LightClusterLayout';

type TestLightDesc = {
  type: 'directional' | 'point' | 'spot';
  position?: [number, number, number];
  range?: number;
  intensity?: number;
  enable?: boolean;
};

async function createScene(config: Rn.Config, lightDescs: TestLightDesc[]) {
  // The None approach allocates 16 MB of GPU instance data, which is less than one view region of the default grid
  // and capacity (about 25 MB). Add a layer that is large enough for it.
  config.bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 32, 5 / 32, 6 / 32, 12 / 32, 2];
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.None,
    canvas: document.getElementById('world') as HTMLCanvasElement,
    config,
    notToDisplayRnInfoAtInit: true,
  });
  const lights = lightDescs.map(desc => {
    const entity = Rn.createLightEntity(engine);
    const light = entity.getLight();
    light.type =
      desc.type === 'directional'
        ? Rn.LightType.Directional
        : desc.type === 'spot'
          ? Rn.LightType.Spot
          : Rn.LightType.Point;
    if (desc.range != null) light.range = desc.range;
    if (desc.intensity != null) light.intensity = desc.intensity;
    if (desc.enable != null) light.enable = desc.enable;
    if (desc.position != null) entity.localPosition = Rn.Vector3.fromCopyArray(desc.position);
    return light;
  });
  // Light components request the lazy light cluster system; wait for it before using it directly.
  await engine._ensureLightClusterSystem();

  const cameraEntity = Rn.createCameraEntity(engine, true);
  const camera = cameraEntity.getCamera();
  camera.zNear = 0.1;
  camera.zFar = 100;
  camera.setFovyAndChangeFocalLength(60);
  camera.aspect = 1;
  cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 0, 10);

  const renderPass = new Rn.RenderPass(engine);
  renderPass.cameraComponent = camera;
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  // The Logic stage writes the GPU data of the lights and the cameras.
  const runLogic = () => {
    for (const light of lights) light.$logic();
    camera.$logic();
  };
  runLogic();
  return { engine, lights, camera, expression, runLogic };
}

function readGlobalData(engine: Rn.Engine) {
  const data = engine.globalDataRepository.getValue('clusteredLightData', 0)._v as Float32Array;
  const allCount = data[0];
  const entries = Array.from(data.subarray(4, 4 + allCount));
  return { allCount, globalCount: data[1], localCount: data[2], entries };
}

function readView(engine: Rn.Engine, camera: Rn.CameraComponent) {
  const viewBase = camera._lightClusterViewInfoForGpu._v[0];
  if (viewBase < 0) return undefined;
  const layout = getLightClusterViewLayout(
    engine.config.clusteredForwardGridSize,
    engine.config.clusteredForwardLightCapacityPerCluster
  );
  const view = engine.memoryManager.readFloat32Array(
    Rn.BufferUse.GPUInstanceData,
    viewBase * 16,
    layout.viewVec4Count * 4
  )!;
  return { view, layout };
}

test('builds the light lists and the clusters of the camera of the render passes', async () => {
  const { engine, lights, camera, expression } = await createScene(
    new Rn.Config({ clusteredForwardMinLocalLightNumber: 1 }),
    [
      { type: 'directional' }, // SID 0: can not be culled
      { type: 'point', position: [-2, 0, 0], range: 1 }, // SID 1: local
      { type: 'point', position: [0, 0, 0] }, // SID 2: no range, can not be culled
      { type: 'spot', position: [2, 0, 0], range: 2 }, // SID 3: local
      { type: 'point', position: [0, 2, 0], range: 1, enable: false }, // SID 4: disabled
    ]
  );
  const sids = lights.map(l => l.componentSID);
  expect(sids).toEqual([0, 1, 2, 3, 4]);

  engine.lightClusterSystem.update([expression]);

  const global = readGlobalData(engine);
  expect([global.allCount, global.globalCount, global.localCount]).toEqual([4, 2, 2]);
  // Lights that can not be culled first, then the local lights, each sorted by SID.
  // Lights with SID < maxLightNumber have the default shadow slot (= SID).
  expect(global.entries.map(e => unpackLightEntry(e))).toEqual([
    [0, 0],
    [2, 2],
    [1, 1],
    [3, 3],
  ]);

  const result = readView(engine, camera);
  expect(result).toBeDefined();
  const { view, layout } = result!;
  // The cluster at the position of the point light (SID 1) contains it, the cluster at the origin does not.
  const clusterAtLight1 = computeLightClusterIndex(view, 0, -2, 0, 0);
  expect(clusterAtLight1).toBeGreaterThanOrEqual(0);
  expect(readLightClusterEntries(view, 0, layout, clusterAtLight1).map(e => unpackLightEntry(e)[0])).toContain(1);
  const clusterAtOrigin = computeLightClusterIndex(view, 0, 0, 0, 0);
  expect(readLightClusterEntries(view, 0, layout, clusterAtOrigin).map(e => unpackLightEntry(e)[0])).not.toContain(1);
});

test('only rebuilds when the inputs change, and releases the view of unused cameras', async () => {
  const { engine, lights, camera, expression, runLogic } = await createScene(
    new Rn.Config({ clusteredForwardMinLocalLightNumber: 1 }),
    [{ type: 'point', position: [0, 0, 0], range: 1 }]
  );
  const system = engine.lightClusterSystem;
  system.update([expression]);
  const version = system.dataVersion;
  system.update([expression]);
  expect(system.dataVersion).toBe(version);

  // (A transform change would need the SceneGraph logic, which these tests do not run.)
  lights[0].range = 2;
  runLogic();
  system.update([expression]);
  expect(system.dataVersion).toBeGreaterThan(version);

  // A frame without the camera
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBeGreaterThanOrEqual(0);
  system.update([]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);
});

test('uses the all-light list when Clustered Forward rendering is disabled', async () => {
  const { engine, camera, expression } = await createScene(new Rn.Config({ isClusteredForwardEnabled: false }), [
    { type: 'point', position: [0, 0, 0], range: 1 },
    { type: 'point', position: [1, 0, 0], range: 1 },
  ]);
  engine.lightClusterSystem.update([expression]);
  expect(readGlobalData(engine).allCount).toBe(2);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);
});

test('packs the shadow slot of lights with a SID above Config.maxLightNumber', async () => {
  const descs: TestLightDesc[] = [];
  for (let i = 0; i < 8; i++) descs.push({ type: 'point', position: [i, 0, 0], range: 1 });
  const { engine, lights, expression } = await createScene(new Rn.Config({ maxLightNumber: 2 }), descs);
  lights[7]._shadowSlot = 1; // e.g. assigned by a ShadowSystem
  lights[1]._shadowSlot = -1;
  engine.lightClusterSystem.update([expression]);
  const slots = new Map(readGlobalData(engine).entries.map(e => unpackLightEntry(e)));
  expect(slots.get(0)).toBe(0); // default slot (SID < maxLightNumber)
  expect(slots.get(1)).toBe(-1);
  expect(slots.get(5)).toBe(-1); // default: no slot (SID >= maxLightNumber)
  expect(slots.get(7)).toBe(1);
});

test('limits the number of shaded lights to Config.maxLightListLength', async () => {
  const descs: TestLightDesc[] = [];
  for (let i = 0; i < 5; i++) descs.push({ type: 'point', position: [i, 0, 0], range: 1 });
  const { engine, expression } = await createScene(new Rn.Config({ maxLightListLength: 3 }), descs);
  engine.lightClusterSystem.update([expression]);
  const global = readGlobalData(engine);
  expect(global.allCount).toBe(3);
  expect(global.entries.map(e => unpackLightEntry(e)[0])).toEqual([0, 1, 2]);
});

test('gives point lights without range an automatic range when lightAutoRangeThreshold is set', async () => {
  const { engine, lights, expression } = await createScene(new Rn.Config({ lightAutoRangeThreshold: 0.01 }), [
    { type: 'point', position: [0, 0, 0], intensity: 4 },
    { type: 'directional', intensity: 4 },
  ]);
  // sqrt(4 / 0.01) = 20
  expect(lights[0]._lightPropertyForGpu._v[1]).toBeCloseTo(20);
  expect(lights[0].range).toBe(-1); // the property of the light is not changed
  expect(lights[1]._lightPropertyForGpu._v[1]).toBe(-1);
  engine.lightClusterSystem.update([expression]);
  const global = readGlobalData(engine);
  expect([global.globalCount, global.localCount]).toEqual([1, 1]);
});

test('evaluates all lights without clusters when there are fewer local lights than the threshold', async () => {
  const descs: TestLightDesc[] = [];
  for (let i = 0; i < 3; i++) descs.push({ type: 'point', position: [i, 0, 0], range: 1 });
  const { engine, lights, camera, expression, runLogic } = await createScene(
    new Rn.Config({ clusteredForwardMinLocalLightNumber: 4 }),
    descs
  );
  const system = engine.lightClusterSystem;
  system.update([expression]);
  // The all-light list is still written, but the camera has no cluster view.
  expect(readGlobalData(engine).allCount).toBe(3);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);

  // A 4th local light turns the clusters on
  const fourth = Rn.createLightEntity(engine);
  fourth.getLight().range = 1;
  fourth.getLight().$logic();
  system.update([expression]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBeGreaterThanOrEqual(0);

  // A light that can no longer be culled (no range) turns them off again
  lights[0].range = -1;
  runLogic();
  system.update([expression]);
  const global = readGlobalData(engine);
  expect([global.allCount, global.globalCount, global.localCount]).toEqual([4, 1, 3]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);
});

test('local lights without intensity are not counted for clusteredForwardMinLocalLightNumber', async () => {
  const descs: TestLightDesc[] = [];
  for (let i = 0; i < 3; i++) descs.push({ type: 'point', position: [i, 0, 0], range: 1 });
  descs.push({ type: 'point', position: [3, 0, 0], range: 1, intensity: 0 });
  const { engine, lights, camera, expression, runLogic } = await createScene(
    new Rn.Config({ clusteredForwardMinLocalLightNumber: 4 }),
    descs
  );
  const system = engine.lightClusterSystem;
  system.update([expression]);
  // The light without intensity stays in the light list, but it does not turn the clusters on.
  expect(readGlobalData(engine).localCount).toBe(4);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);

  // Giving it an intensity turns the clusters on
  lights[3].intensity = 1;
  runLogic();
  system.update([expression]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBeGreaterThanOrEqual(0);

  // A black color counts as no intensity, too
  lights[3].color = Rn.Vector3.fromCopy3(0, 0, 0);
  runLogic();
  system.update([expression]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);
});

test('point lights without range and intensity are not counted with lightAutoRangeThreshold', async () => {
  const descs: TestLightDesc[] = [];
  for (let i = 0; i < 3; i++) descs.push({ type: 'point', position: [i, 0, 0], intensity: 1 });
  descs.push({ type: 'point', position: [3, 0, 0], intensity: 0 });
  const { engine, camera, expression } = await createScene(
    new Rn.Config({ clusteredForwardMinLocalLightNumber: 4, lightAutoRangeThreshold: 0.01 }),
    descs
  );
  engine.lightClusterSystem.update([expression]);
  const global = readGlobalData(engine);
  expect([global.globalCount, global.localCount]).toEqual([0, 4]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);
});

test('the default threshold builds clusters from 1 local light that emits light', async () => {
  const { engine, lights, camera, expression, runLogic } = await createScene(new Rn.Config(), [
    { type: 'point', position: [0, 0, 0], range: 1, intensity: 0 },
  ]);
  expect(engine.config.clusteredForwardMinLocalLightNumber).toBe(1);
  engine.lightClusterSystem.update([expression]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBe(-1);

  lights[0].intensity = 1;
  runLogic();
  engine.lightClusterSystem.update([expression]);
  expect(camera._lightClusterViewInfoForGpu._v[0]).toBeGreaterThanOrEqual(0);
});

test('the WebGL2 view uniform holds the view header and the view index of the camera', async () => {
  const { engine, camera, expression } = await createScene(new Rn.Config(), [
    { type: 'point', position: [0, 0, 0], range: 1 },
  ]);
  const system = engine.lightClusterSystem;
  system.update([expression]);
  const viewBase = camera._lightClusterViewInfoForGpu._v[0];
  expect(viewBase).toBeGreaterThanOrEqual(0);
  const uniform = Array.from(system._getViewUniformData(camera.componentSID));
  const layout = getLightClusterViewLayout(
    engine.config.clusteredForwardGridSize,
    engine.config.clusteredForwardLightCapacityPerCluster
  );
  const view = engine.memoryManager.readFloat32Array(
    Rn.BufferUse.GPUInstanceData,
    viewBase * 16,
    layout.viewVec4Count * 4
  )!;
  expect(uniform.slice(0, 24)).toEqual(Array.from(view.subarray(0, 24)));
  expect(uniform[24]).toBe(viewBase);

  // A camera without a view, and no camera
  system.update([]);
  expect(system._getViewUniformData(camera.componentSID)[24]).toBe(-1);
  expect(system._getViewUniformData(-1)[24]).toBe(-1);
});

test('the cluster lists are excluded from the generic upload, and the CPU-built part is reported as dirty', async () => {
  const { engine, camera, expression } = await createScene(new Rn.Config(), [
    { type: 'point', position: [0, 0, 0], range: 1 },
  ]);
  const system = engine.lightClusterSystem;
  system.update([expression]);
  const viewBase = camera._lightClusterViewInfoForGpu._v[0];
  const layout = getLightClusterViewLayout(
    engine.config.clusteredForwardGridSize,
    engine.config.clusteredForwardLightCapacityPerCluster
  );
  // Everything after the 6-vec4 header of the view
  expect(system._getExcludedByteRanges()).toEqual([[(viewBase + 6) * 16, (viewBase + layout.viewVec4Count) * 16]]);
  // The table and the used part of the light index list were built on the CPU
  const dirty = system._takeDirtyByteRanges();
  expect(dirty.length).toBe(1);
  expect(dirty[0][0]).toBe((viewBase + 6) * 16);
  expect(dirty[0][1]).toBeGreaterThan((viewBase + 6 + layout.tableVec4Count) * 16);
  expect(dirty[0][1]).toBeLessThan((viewBase + layout.viewVec4Count) * 16);
  expect(system._takeDirtyByteRanges()).toEqual([]);
});

test('keeps the nearest lights in a cluster that receives more lights than the capacity', async () => {
  const descs: TestLightDesc[] = [];
  // All on the view axis (one screen tile), close in depth (one depth slice), nearest first. A light far behind the
  // others widens the depth range of the slices, so that the spheres of all of them reach the cluster of the first.
  for (let i = 0; i < 32; i++) {
    descs.push({ type: 'point', position: [0, 0, -33 - i * 0.15], range: 1 });
  }
  descs.push({ type: 'point', position: [0, 0, -991], range: 1 });
  const { engine, camera, expression, runLogic } = await createScene(
    new Rn.Config({ clusteredForwardLightCapacityPerCluster: 16 }),
    descs
  );
  // Keep the far light inside the camera range: the slices are fitted to the intersection of the light range and
  // the camera range, and a light beyond the camera far plane must not widen them.
  camera.zFar = 2000;
  runLogic();
  engine.lightClusterSystem.update([expression]);
  const result = readView(engine, camera);
  expect(result).toBeDefined();
  const { view, layout } = result!;
  expect(layout.clusterLightCapacity).toBe(16);

  const cluster = computeLightClusterIndex(view, 0, 0, 0, -33);
  expect(cluster).toBeGreaterThanOrEqual(0);
  const sids = readLightClusterEntries(view, 0, layout, cluster).map(e => unpackLightEntry(e)[0]);
  // The list is sorted by view depth, so the nearest 16 lights are kept.
  expect(sids).toEqual(Array.from({ length: 16 }, (_, i) => i));

  // No cluster of the view exceeds the capacity.
  const tableOffset = LightClusterLayout.viewHeaderVec4Count * 4;
  let maxCount = 0;
  for (let i = 0; i < layout.clusterCount; i++) {
    maxCount = Math.max(maxCount, view[tableOffset + i * 4 + 1]);
  }
  expect(maxCount).toBe(16);
});
