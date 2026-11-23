import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

// The SDF sphere casts a shadow onto the floor mesh. The light type is selected with
// ?light=point|spot|directional so the three shadow map encodings are covered.
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? 'webgl2';
const lightType = params.get('light') ?? 'directional';
const castShadow = params.get('castshadow') !== '0';

const info = document.getElementById('info') as HTMLParagraphElement;
info.textContent = `mode=${mode} light=${lightType} castShadow=${castShadow}`;

const canvas = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: mode === 'webgpu' ? Rn.ProcessApproach.WebGPU : Rn.ProcessApproach.WebGL2,
  canvas,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info, maxLightNumber: 4 }),
});

const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
await forwardRenderPipeline.setup(canvas.width, canvas.height, { isShadow: true });
forwardRenderPipeline.setDiffuseIBLContribution(0);
forwardRenderPipeline.setSpecularIBLContribution(0);

// Floor receiver
const floorMaterial = Rn.MaterialHelper.createPbrUberMaterial(engine, { isShadow: true });
floorMaterial.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([0.85, 0.85, 0.85, 1]));
floorMaterial.setParameter('roughnessFactor', Rn.Scalar.fromCopyNumber(0.9));
const floorEntity = Rn.MeshHelper.createPlane(engine, {
  width: 14,
  height: 14,
  material: floorMaterial,
  direction: 'xz',
});

// SDF caster
const sdfEntity = Rn.createRaymarchingEntity(engine);
sdfEntity.position = Rn.Vector3.fromCopy3(0, 2.2, 0);
sdfEntity.scale = Rn.Vector3.fromCopy3(1.5, 1.5, 1.5);
const raymarchingComponent = sdfEntity.getRaymarching();
raymarchingComponent.sdfShapeType = Rn.SdfShapeType.Sphere;
raymarchingComponent.castShadow = castShadow;

// Light
let lightEntity: Rn.ILightEntity;
if (lightType === 'point') {
  lightEntity = Rn.createLightEntity(engine);
  lightEntity.position = Rn.Vector3.fromCopy3(2.5, 5.5, 3);
  lightEntity.getLight().type = Rn.LightType.Point;
  lightEntity.getLight().range = 14;
  lightEntity.getLight().intensity = 40;
} else {
  lightEntity = Rn.createLightWithCameraEntity(engine);
  lightEntity.localPosition = Rn.Vector3.fromCopy3(2.5, 5.5, 3);
  lightEntity.localEulerAngles = Rn.Vector3.fromCopy3(
    Rn.MathUtil.degreeToRadian(-55),
    Rn.MathUtil.degreeToRadian(25),
    0
  );
  if (lightType === 'spot') {
    lightEntity.getLight().type = Rn.LightType.Spot;
    lightEntity.getLight().range = 20;
    lightEntity.getLight().intensity = 60;
    lightEntity.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(32);
  } else {
    lightEntity.getLight().type = Rn.LightType.Directional;
    lightEntity.getLight().intensity = 2.5;
  }
}
lightEntity.getLight().color = Rn.Vector3.fromCopy3(1, 1, 1);
lightEntity.getLight().castShadow = true;

// Camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = canvas.width / canvas.height;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 5.5, 9);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(Rn.MathUtil.degreeToRadian(-22), 0, 0);

// Scene expression with the floor receiver
const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
renderPass.clearColor = Rn.Vector4.fromCopyArray([0.08, 0.12, 0.2, 1]);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.cameraComponent = cameraComponent;
renderPass.addEntities([floorEntity]);
expression.addRenderPasses([renderPass]);
forwardRenderPipeline.setExpressions([expression]);

// One raymarching material per component; the pipeline also builds the SDF shadow
// caster materials from the component graphs.
const result = Rn.MaterialHelper.createNodeBasedRaymarchingComponentMaterial(engine, raymarchingComponent);
if (!result) {
  throw new Error('Failed to create node-based raymarching component material');
}
forwardRenderPipeline.setRaymarchingComponentMaterial(raymarchingComponent, result.material);

window._debug = { Rn, engine, sdfEntity, floorEntity, lightEntity, cameraEntity, forwardRenderPipeline };

let count = 0;
forwardRenderPipeline.startRenderLoop(frame => {
  engine.process(frame);
  if (!window._rendered && count > 2) {
    window._rendered = true;
  }
  count++;
});
