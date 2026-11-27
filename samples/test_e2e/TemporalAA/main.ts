import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

// Temporal anti-aliasing of the ForwardRenderPipeline.
// The scene has thin, tilted bars (geometric aliasing), glossy spheres (specular aliasing) and a cube that
// moves every frame (motion vectors). The sample renders a fixed number of frames and then stops, so that the
// screenshot does not depend on when it is taken.
//
// URL parameters (for comparing the results manually):
//   taa=off      renders with the default 4x MSAA instead
//   frames=N     the number of frames to render (default 24); 0 keeps rendering
//   move=off     keeps the cube still (a static scene, to check that the edges do not flicker)

const params = new URLSearchParams(window.location.search);
const isTemporalAA = params.get('taa') !== 'off';
const frameCountToRender = params.has('frames') ? Number(params.get('frames')) : 24;
const isCubeMoving = params.get('move') !== 'off';

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

// ---- Light ----
const light = Rn.createLightEntity(engine);
light.getLight().type = Rn.LightType.Directional;
light.getLight().intensity = 2.5;
light.localEulerAngles = Rn.Vector3.fromCopy3(-0.9, 0.5, 0);

// ---- Scene ----
const entities: Rn.ISceneGraphEntity[] = [];

const floorMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
floorMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.5, 0.5, 0.55, 1));
floorMaterial.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(0.0, 0.8));
const floor = Rn.MeshHelper.createPlane(engine, { width: 12, height: 12, uSpan: 1, vSpan: 1, material: floorMaterial });
entities.push(floor);

// Thin bars at various angles: their edges alias without anti-aliasing.
const barMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
barMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.95, 0.9, 0.8, 1));
barMaterial.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(0.0, 0.5));
for (let i = 0; i < 9; i++) {
  const bar = Rn.MeshHelper.createCube(engine, {
    widthVector: Rn.Vector3.fromCopy3(0.02, 1.6, 0.02),
    material: barMaterial,
  });
  bar.localPosition = Rn.Vector3.fromCopy3(-3.2 + i * 0.8, 1.6, -2.0);
  bar.localEulerAngles = Rn.Vector3.fromCopy3(0, 0, -0.6 + i * 0.15);
  entities.push(bar);
}

// Glossy spheres: their highlights flicker without anti-aliasing.
for (let i = 0; i < 3; i++) {
  const material = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.9, 0.3 + i * 0.3, 0.2, 1));
  material.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(1.0, 0.15));
  const sphere = Rn.MeshHelper.createSphere(engine, { radius: 0.6, widthSegments: 32, heightSegments: 24, material });
  sphere.localPosition = Rn.Vector3.fromCopy3(-2.2 + i * 2.2, 0.6, 0.6);
  entities.push(sphere);
}

// A cube that moves every frame, to exercise the motion vectors of moving objects.
const movingMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isLighting: true });
movingMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopy4(0.2, 0.5, 1.0, 1));
movingMaterial.setParameter('metallicRoughnessFactor', Rn.Vector2.fromCopy2(0.0, 0.4));
const movingCube = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.fromCopy3(0.5, 0.5, 0.5),
  material: movingMaterial,
});
movingCube.localEulerAngles = Rn.Vector3.fromCopy3(0, 0.7, 0);
entities.push(movingCube);
const moveCube = (frameIndex: number) => {
  movingCube.localPosition = Rn.Vector3.fromCopy3(-2.5 + frameIndex * 0.12, 0.5, 2.3);
};
moveCube(0);

// ---- Camera ----
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 3.2, 8);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-Math.atan2(2.6, 8), 0, 0);

// ---- Rendering ----
const mainRenderPass = new Rn.RenderPass(engine);
mainRenderPass.cameraComponent = cameraComponent;
mainRenderPass.clearColor = Rn.Vector4.fromCopy4(0.05, 0.06, 0.08, 1);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.addEntities(entities);
const mainExpression = new Rn.Expression();
mainExpression.addRenderPasses([mainRenderPass]);

// The light cluster system is loaded asynchronously when the first light is used, and the frames rendered
// before it is ready have no lights. Temporal anti-aliasing accumulates the frames, so their number (which
// depends on the timing) would change the result. Wait for it so that every rendered frame is lit.
await engine._ensureLightClusterSystem();

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
await forwardRenderPipeline.setup(canvas.width, canvas.height, { isTemporalAA });
forwardRenderPipeline.setExpressions([mainExpression]);
window.forwardRenderPipeline = forwardRenderPipeline;

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
  if (isCubeMoving) {
    moveCube(count);
  }
  engine.process(frame);
  count++;
});
