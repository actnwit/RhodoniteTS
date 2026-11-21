import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? 'webgl2';
const lightType = params.get('light') ?? 'spot';

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

// The fixture stores a spot light and a directional light as light-only nodes (no camera),
// as assets authored outside Rhodonite do. The importer attaches the shadow cameras.
const gltfModel = await Rn.Gltf2Importer.importFromUrl('../../../assets/gltf/lightOnlyShadows/LightOnlyShadows.glb', {
  shadow: true,
  defaultMaterialHelperArgumentArray: [{ isSkinning: false, isMorphing: false }],
});
const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(engine, gltfModel);

// Keep only the requested light enabled so each reference image isolates one light's shadow.
let lightFound = false;
const rnEntities = (gltfModel.asset.extras as any).rnEntities as Rn.ISceneGraphEntity[];
for (const entity of rnEntities) {
  const lightComponent = entity.tryToGetLight();
  if (lightComponent == null) {
    continue;
  }
  const isTargetLight =
    (lightType === 'spot' && lightComponent.type === Rn.LightType.Spot) ||
    (lightType === 'directional' && lightComponent.type === Rn.LightType.Directional);
  lightComponent.enable = isTargetLight;
  lightFound = lightFound || isTargetLight;
}
if (!lightFound) {
  throw new Error(`The fixture has no ${lightType} light`);
}

// Camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopy3(0, 1.5, 8);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopy3(-10.6 * (Math.PI / 180), 0, 0);

// The pipeline's initial expression clears the buffers; clearing again in the main pass
// would let the transmission clone wipe the frame.
const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = false;
renderPass.toClearDepthBuffer = false;
renderPass.cameraComponent = cameraComponent;
renderPass.addEntities([rootGroup]);
expression.addRenderPasses([renderPass]);
forwardRenderPipeline.setExpressions([expression]);

let count = 0;
forwardRenderPipeline.startRenderLoop(frame => {
  if (count > 0) {
    window._rendered = true;
  }
  engine.process(frame);
  count++;
});
