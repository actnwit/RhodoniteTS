import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

// Motion vectors of deformed meshes with temporal anti-aliasing: a skinned model (Fox, running) and a morph target
// model (AnimatedMorphCube) are animated with a fixed time step, so that their vertices move without any change of
// their world matrices. Without the motion of the deformation in the motion vectors, the moving parts leave trails
// (most visible with `?clip=0`).
//
// URL parameters (for comparing the results manually):
//   taa=off      renders with the default 4x MSAA instead
//   clip=0       disables the variance clipping of the history, which makes wrong motion vectors visible as trails
//   frames=N     the number of frames to render (default 24); 0 keeps rendering

const params = new URLSearchParams(window.location.search);
const isTemporalAA = params.get('taa') !== 'off';
const isClipDisabled = params.get('clip') === '0';
const frameCountToRender = params.has('frames') ? Number(params.get('frames')) : 24;

const p = document.createElement('p');
document.body.appendChild(p);

const canvas = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: getProcessApproach(Rn),
  canvas,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info }),
});
window.Rn = Rn;
window.engine = engine;

// ---- Scene ----
const entities: Rn.ISceneGraphEntity[] = [];

const fox = (
  await Rn.GltfImporter.importFromUrl(engine, '../../../assets/gltf/glTF-Sample-Assets/Models/Fox/glTF-Binary/Fox.glb')
).renderPasses[0].sceneTopLevelGraphComponents[0].entity;
fox.getTransform().localScale = Rn.Vector3.fromCopy3(0.012, 0.012, 0.012);
fox.getTransform().localPosition = Rn.Vector3.fromCopy3(-0.4, 0, 0);
fox.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0, Math.PI / 2, 0);
entities.push(fox);

const morphCube = (
  await Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb'
  )
).renderPasses[0].sceneTopLevelGraphComponents[0].entity;
morphCube.getTransform().localPosition = Rn.Vector3.fromCopy3(1.5, 0.6, 0);
morphCube.getTransform().localScale = Rn.Vector3.fromCopy3(0.35, 0.35, 0.35);
morphCube.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0.3, 0.6, 0);
entities.push(morphCube);

const floorMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
floorMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.45, 0.45, 0.5, 1));
floorMaterial.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(0.0, 0.8));
const floor = Rn.MeshHelper.createPlane(engine, { width: 8, height: 8, uSpan: 1, vSpan: 1, material: floorMaterial });
entities.push(floor);

const light = Rn.createLightEntity(engine);
light.getLight().type = Rn.LightType.Directional;
light.getLight().intensity = 3;
light.localEulerAngles = Rn.Vector3.fromCopy3(-0.9, 0.5, 0);

// ---- Camera ----
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(40);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0.3, 1.6, 5.5);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-0.2, 0, 0);

// ---- Rendering ----
const mainRenderPass = new Rn.RenderPass(engine);
mainRenderPass.cameraComponent = cameraComponent;
mainRenderPass.clearColor = Rn.Vector4.fromCopy4(0.05, 0.06, 0.08, 1);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.addEntities(entities);
const mainExpression = new Rn.Expression();
mainExpression.addRenderPasses([mainRenderPass]);

// Render only lit frames (see the TemporalAA sample).
await engine._ensureLightClusterSystem();

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
await forwardRenderPipeline.setup(canvas.width, canvas.height, { isTemporalAA });
forwardRenderPipeline.setExpressions([mainExpression]);
window.forwardRenderPipeline = forwardRenderPipeline;
if (isClipDisabled) {
  forwardRenderPipeline._setTemporalAAVarianceClipGamma(1000);
}

// The Fox runs ("Run" track; the AnimatedMorphCube track has another name and keeps its own animation).
for (const animation of engine.componentRepository.getComponentsWithType(
  Rn.AnimationComponent
) as Rn.AnimationComponent[]) {
  if (animation.getAnimationTrackNames().includes('Run')) {
    animation.setActiveAnimationTrack('Run');
  }
}

// The animations advance by a fixed time step per frame (not by the wall clock), so the result is deterministic.
const timeStep = 1 / 30;
Rn.AnimationComponent.setIsAnimating(engine, true);
let count = 0;
forwardRenderPipeline.startRenderLoop(frame => {
  if (frameCountToRender > 0 && count >= frameCountToRender) {
    if (!window._rendered) {
      // doTests() waits for window._rendered
      window._rendered = true;
      p.id = 'rendered';
      p.textContent = 'Rendered.';
    }
    return;
  }
  Rn.AnimationComponent.setGlobalTime(engine, 0.4 + count * timeStep);
  engine.process(frame);
  count++;
});
