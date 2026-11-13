// Benchmark for the animation update pipeline (evaluation memoization, transform write-through,
// skinning input signature skip, and interpolation allocation reduction).
//
// Usage: open samples/simple/AnimationPerformanceBenchmark/index.html?scenario=playing-vrm
// Results are written to window.benchResult and rendered into #result.
import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const params = new URLSearchParams(window.location.search);
const scenario = params.get('scenario') ?? 'playing-vrm';
const measuredFrames = Number.parseInt(params.get('frames') ?? '300', 10);
const copyCount = Number.parseInt(params.get('copies') ?? '4', 10);
const animationEnabled = params.get('anim') !== 'off';
const useGpuTimer = params.get('gpu') === '1';
const warmupFrames = 60;
const fixedDelta = 1 / 60;

const assetsBase = '../../../assets';
const gltfSamples = `${assetsBase}/gltf/glTF-Sample-Assets/Models`;

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: false }),
});

const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(45.0);
cameraComponent.aspect = 1.0;

const lightEntity = Rn.createLightEntity(engine);
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
lightComponent.intensity = 3.0;

const expressions: any[] = [];
let animationStateComponent: any;
let rootEntity: any;
let advanceTime = true;

function setupExpression(expression: any) {
  expressions.push(expression);
  const renderPass = expression.renderPasses[0];
  renderPass.toClearColorBuffer = true;
  renderPass.toClearDepthBuffer = true;
  return expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;
}

function addCopies(sourceRoot: any, renderPass: any, onCopy: (copy: any, index: number) => void) {
  for (let i = 1; i < copyCount; i++) {
    const copy = engine.entityRepository.shallowCopyEntity(sourceRoot) as Rn.ISceneGraphEntity;
    copy.getTransform().localPosition = Rn.Vector3.fromCopyArray([(i % 4) * 1.5 - 2.0, Math.floor(i / 4) * 1.5, 0]);
    renderPass.addEntities([copy]);
    onCopy(copy, i);
  }
}

if (scenario === 'playing-vrm' || scenario === 'paused-vrm' || scenario === 'many-vrm') {
  const assets = await Rn.defaultAssetLoader.load({
    vrmModel: Rn.GltfImporter.importFromUrl(engine, `${assetsBase}/vrm/test.vrm`, {
      cameraComponent: cameraComponent,
    }),
    vrmAnimation: Rn.VrmaImporter.importFromUrl(`${assetsBase}/vrma/Idle.vrma`),
  });
  rootEntity = setupExpression(assets.vrmModel);
  const animationAssigner = new Rn.AnimationAssigner(engine);
  animationAssigner.assignAnimationWithVrma(rootEntity, assets.vrmAnimation);

  if (scenario === 'many-vrm') {
    addCopies(rootEntity, assets.vrmModel.renderPasses[0], copy => {
      animationAssigner.assignAnimationWithVrma(copy, assets.vrmAnimation);
    });
  }

  animationStateComponent = rootEntity.tryToGetAnimationState();
  advanceTime = scenario !== 'paused-vrm';

  const controller: any = cameraEntity.getCameraController().controller;
  if (controller.setTarget) {
    controller.setTarget(rootEntity);
  }
  if (controller.dolly !== undefined) {
    controller.dolly = 0.78;
  }
} else {
  let url: string;
  if (scenario === 'blend' || scenario === 'many-models') {
    url = `${gltfSamples}/Fox/glTF-Binary/Fox.glb`;
  } else if (scenario === 'morph') {
    url = `${gltfSamples}/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb`;
  } else if (scenario === 'cubic') {
    url = `${gltfSamples}/InterpolationTest/glTF-Binary/InterpolationTest.glb`;
  } else {
    url = `${gltfSamples}/Fox/glTF-Binary/Fox.glb`;
  }

  const expression = await Rn.GltfImporter.importFromUrl(engine, url, { cameraComponent });
  rootEntity = setupExpression(expression);
  animationStateComponent = rootEntity.tryToGetAnimationState();

  if (scenario === 'blend' && animationStateComponent != null) {
    animationStateComponent.setActiveAnimationTrack('Survey');
    animationStateComponent.setSecondActiveAnimationTrack('Run');
  }
  if (scenario === 'many-models') {
    addCopies(rootEntity, expression.renderPasses[0], () => {});
  }

  const controller: any = cameraEntity.getCameraController().controller;
  if (controller.setTarget) {
    controller.setTarget(rootEntity);
  }
  cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 2.5, 5.0]);
}

Rn.CameraComponent.setCurrent(engine, cameraComponent.componentSID);
Rn.AnimationComponent.setGlobalTime(engine, 0);
if (!animationEnabled) {
  Rn.AnimationComponent.setIsAnimating(engine, false);
}
if (useGpuTimer) {
  engine.gpuTimerEnabled = true;
}

// Collect unique animated values so that shared copies are not counted twice.
const animatedValues: any[] = [];
{
  const seen = new Set<any>();
  const animationComponents = engine.componentRepository.getComponentsWithType(Rn.AnimationComponent) as any[];
  for (const component of animationComponents) {
    const track = component.__animationTrack;
    if (track == null) {
      continue;
    }
    for (const [, channel] of track) {
      if (!seen.has(channel.animatedValue)) {
        seen.add(channel.animatedValue);
        animatedValues.push(channel.animatedValue);
      }
    }
  }
}

function sumEvaluationCount(): number {
  let sum = 0;
  for (const value of animatedValues) {
    sum += value.getEvaluationCount?.() ?? 0;
  }
  return sum;
}

let endInputValue = 0;
try {
  endInputValue = Rn.AnimationComponent.getEndInputValue(engine);
} catch {
  endInputValue = 0;
}
if (!(endInputValue > 0)) {
  endInputValue = 1.16;
}

let simulatedTime = 0;
let blendRatio = 0;
let blendDirection = 1;

function step() {
  if (advanceTime) {
    if (scenario === 'blend' && animationStateComponent != null) {
      blendRatio += 0.01 * blendDirection;
      if (blendRatio >= 1) {
        blendRatio = 1;
        blendDirection = -1;
      } else if (blendRatio <= 0) {
        blendRatio = 0;
        blendDirection = 1;
      }
      animationStateComponent.setAnimationBlendingRatio(blendRatio);
    }

    simulatedTime += fixedDelta;
    if (simulatedTime > endInputValue) {
      simulatedTime -= endInputValue;
    }
    Rn.AnimationComponent.setGlobalTime(engine, simulatedTime);
  }

  const transformBefore = Rn.TransformComponent.getUpdateCount(engine);
  const morphBefore = Rn.BlendShapeComponent.updateCount;
  const evaluationBefore = sumEvaluationCount();
  for (const key of Object.keys(logicTimes)) {
    logicTimes[key] = 0;
  }

  const t0 = performance.now();
  engine.process(expressions);
  const processMs = performance.now() - t0;

  return {
    processMs,
    transformUpdates: Rn.TransformComponent.getUpdateCount(engine) - transformBefore,
    morphUpdates: Rn.BlendShapeComponent.updateCount - morphBefore,
    evaluations: sumEvaluationCount() - evaluationBefore,
    animationLogicMs: logicTimes.animation ?? 0,
    animationStateLogicMs: logicTimes.animationState ?? 0,
    transformLogicMs: logicTimes.transform ?? 0,
    sceneGraphLogicMs: logicTimes.sceneGraph ?? 0,
    skeletalLogicMs: logicTimes.skeletal ?? 0,
    blendShapeLogicMs: logicTimes.blendShape ?? 0,
  };
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

// Per-stage timers. Wrapping $logic lets us separate animation/skinning cost from rendering.
const logicTimes: Record<string, number> = {};
function wrapLogic(label: string, prototype: any) {
  const original = prototype?.$logic;
  if (original == null) {
    return;
  }
  prototype.$logic = function (...args: any[]) {
    const t0 = performance.now();
    const result = original.apply(this, args);
    logicTimes[label] = (logicTimes[label] ?? 0) + (performance.now() - t0);
    return result;
  };
}
wrapLogic('animation', Rn.AnimationComponent.prototype);
wrapLogic('animationState', Rn.AnimationStateComponent.prototype);
wrapLogic('transform', Rn.TransformComponent.prototype);
wrapLogic('sceneGraph', Rn.SceneGraphComponent.prototype);
wrapLogic('skeletal', Rn.SkeletalComponent.prototype);
wrapLogic('blendShape', Rn.BlendShapeComponent.prototype);

function stats(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return {
    mean: round(mean),
    median: round(sorted[Math.floor(sorted.length / 2)]),
    p95: round(sorted[Math.floor(sorted.length * 0.95)]),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
  };
}

async function run() {
  for (let i = 0; i < warmupFrames; i++) {
    step();
    await nextFrame();
  }

  const processTimes: number[] = [];
  const transformUpdates: number[] = [];
  const morphUpdates: number[] = [];
  const evaluations: number[] = [];
  const animationLogicTimes: number[] = [];
  const sceneGraphLogicTimes: number[] = [];
  const skeletalLogicTimes: number[] = [];

  for (let i = 0; i < measuredFrames; i++) {
    const result = step();
    processTimes.push(result.processMs);
    transformUpdates.push(result.transformUpdates);
    morphUpdates.push(result.morphUpdates);
    evaluations.push(result.evaluations);
    animationLogicTimes.push(result.animationLogicMs + result.animationStateLogicMs);
    sceneGraphLogicTimes.push(result.sceneGraphLogicMs + result.transformLogicMs);
    skeletalLogicTimes.push(result.skeletalLogicMs);
    await nextFrame();
  }

  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const summary = {
    userAgent: navigator.userAgent,
    scenario,
    animationEnabled,
    frames: processTimes.length,
    transformUpdatesPerFrame: Math.round(mean(transformUpdates) * 100) / 100,
    morphUpdatesPerFrame: Math.round(mean(morphUpdates) * 100) / 100,
    animationEvaluationsPerFrame: Math.round(mean(evaluations) * 100) / 100,
    gpuTimeMs: useGpuTimer ? Math.round((engine.gpuTimeMilliseconds ?? 0) * 1000) / 1000 : undefined,
    processMs: stats(processTimes),
    animationLogicMs: stats(animationLogicTimes),
    sceneGraphLogicMs: stats(sceneGraphLogicTimes),
    skeletalLogicMs: stats(skeletalLogicTimes),
  };

  window.benchResult = summary;
  document.getElementById('result')!.textContent = JSON.stringify(summary, null, 2);
}

await run();
