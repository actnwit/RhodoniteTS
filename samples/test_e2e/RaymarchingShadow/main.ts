import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? 'webgl2';
const lightType = params.get('light') ?? 'point';

const info = document.getElementById('info') as HTMLParagraphElement;
info.textContent = `mode=${mode} light=${lightType}`;

const canvas = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: mode === 'webgpu' ? Rn.ProcessApproach.WebGPU : Rn.ProcessApproach.WebGL2,
  canvas,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info, maxLightNumber: 6 }),
});

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
await forwardRenderPipeline.setup(canvas.width, canvas.height, { isShadow: true });
forwardRenderPipeline.setDiffuseIBLContribution(0);
forwardRenderPipeline.setSpecularIBLContribution(0);

// SDF sphere receiver
const sphereEntity = Rn.createRaymarchingEntity(engine);
sphereEntity.position = Rn.Vector3.fromCopy3(0, 0, 0);
sphereEntity.scale = Rn.Vector3.fromCopy3(1, 1, 1);
sphereEntity.getRaymarching().sdfShapeType = Rn.SdfShapeType.Sphere;

// Mesh caster between the light and the SDF sphere
const casterMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isShadow: true });
casterMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1, 0.3, 0.3, 1]));
const casterEntity = Rn.MeshHelper.createCube(engine, { material: casterMaterial });
casterEntity.position = Rn.Vector3.fromCopy3(1.5, 1.25, 2.75);
casterEntity.scale = Rn.Vector3.fromCopy3(0.5, 0.5, 0.5);

// Light
const lightPosition = Rn.Vector3.fromCopy3(3, 2.5, 5.5);
// The light points at the origin. The local -Z direction is (-0.438, -0.365, -0.803).
const lightEuler = Rn.Vector3.fromCopy3(-23.9 * (Math.PI / 180), 26.0 * (Math.PI / 180), 0);
let lightEntity: ReturnType<typeof Rn.createLightEntity>;
if (lightType === 'point') {
  lightEntity = Rn.createLightEntity(engine);
  lightEntity.position = lightPosition;
  lightEntity.getLight().type = Rn.LightType.Point;
  lightEntity.getLight().range = 8;
  lightEntity.getLight().intensity = 20;
} else {
  const lightWithCamera = Rn.createLightWithCameraEntity(engine);
  lightWithCamera.localPosition = lightPosition;
  lightWithCamera.localEulerAngles = lightEuler;
  lightWithCamera.getLight().type = lightType === 'spot' ? Rn.LightType.Spot : Rn.LightType.Directional;
  lightWithCamera.getLight().intensity = lightType === 'spot' ? 20 : 1.5;
  if (lightType === 'spot') {
    lightWithCamera.getLight().range = 20;
    lightWithCamera.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(70);
  }
  lightEntity = lightWithCamera;
}
lightEntity.getLight().color = Rn.Vector3.fromCopy3(1, 1, 1);
lightEntity.getLight().castShadow = true;

// Camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 1.5, 8);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-10.6 * (Math.PI / 180), 0, 0);

// Raymarching material (fixed PBR fallback, includes shadow mapping)
const result = Rn.MaterialHelper.createNodeBasedRaymarchingCustomMaterial(
  engine,
  Rn.MaterialHelper.collectRrnJson(engine) as unknown as Rn.ShaderNodeJson
);
if (!result) {
  throw new Error('Failed to create node-based raymarching custom material');
}
forwardRenderPipeline.setRaymarchingMaterial(result.material);

// Main expression with the shadow caster
const casterExpression = new Rn.Expression();
const casterRenderPass = new Rn.RenderPass(engine);
casterRenderPass.clearColor = Rn.Vector4.fromCopyArray([0.15, 0.15, 0.15, 1]);
casterRenderPass.toClearColorBuffer = false;
casterRenderPass.toClearDepthBuffer = false;
casterRenderPass.cameraComponent = cameraComponent;
casterRenderPass.addEntities([casterEntity]);
casterExpression.addRenderPasses([casterRenderPass]);
forwardRenderPipeline.setExpressions([casterExpression]);

window._debug = { Rn, engine, sphereEntity, casterEntity, lightEntity, cameraEntity, forwardRenderPipeline };

let count = 0;
forwardRenderPipeline.startRenderLoop(frame => {
  if (!window._rendered && count > 0) {
    window._rendered = true;
  }
  engine.process(frame);
  count++;
});
