import Rn from '../../../dist/esmdev/index.js';

// import Rn from '../../../dist/cjs';

declare const window: any;

let _framebuffer: Rn.FrameBuffer;
let _renderPassMain: Rn.RenderPass;

// Init Rhodonite
const engine = await initRn();

// Main Camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(20.0);
cameraComponent.aspect = 1.0;

// Assets
const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(
    engine,
    '../../../assets/gltf/glTF-Sample-Assets/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    {
      cameraComponent: cameraComponent,
    }
  ),
  environment: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  specular: Rn.CubeTexture.loadFromUrl(engine, {
    baseUrl: './../../../assets/ibl/papermill/specular/specular',
    mipmapLevelNumber: 10,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
});

// expressions
const expressions: Rn.Expression[] = [];

// Background Env Cube Map Expression
const envExpression = await createBackgroundEnvCubeExpression();
expressions.push(envExpression);

// setup the Main RenderPass
await createMainExpression(expressions);

// setup the SAT RenderPass
// createSat(expressions);

// lighting
await setIBL();

// Render Loop
engine.startRenderLoop(() => {
  engine.process(expressions);
});

async function initRn() {
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas,
    webglOption: { antialias: false },
    config: new Rn.Config({ cgApiDebugConsoleOutput: true, logLevel: Rn.LogLevel.Info }),
  });
  return engine;
}

function _createSat(expressions: Rn.Expression[]) {
  const expressionSat = new Rn.Expression();
  const materialSat = Rn.MaterialHelper.createSummedAreaTableMaterial(engine);
  const renderPassSat = Rn.RenderPassHelper.createScreenDrawRenderPass(engine, materialSat);
  expressionSat.addRenderPasses([renderPassSat]);
  expressions.push(expressionSat);
}

async function createMainExpression(expressions: Rn.Expression[]) {
  expressions.push(assets.mainExpression);

  // cameraController
  const mainRenderPass = assets.mainExpression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
}

async function createBackgroundEnvCubeExpression() {
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial(engine);
  const sampler = new Rn.Sampler(engine, {
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', assets.environment, sampler);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);

  const sphereEntity = Rn.MeshHelper.createSphere(engine, {
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  sphereEntity.localScale = Rn.Vector3.fromCopy3(-1, 1, 1);
  sphereEntity.localPosition = Rn.Vector3.fromCopy3(0, 20, -20);

  const sphereRenderPass = new Rn.RenderPass(engine);
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

async function setIBL() {
  // Get all meshRenderComponents and set IBL cube maps to them
  const meshRendererComponents = engine.componentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
