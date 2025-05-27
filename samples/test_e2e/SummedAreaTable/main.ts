import Rn from '../../../dist/esmdev/index.js';
// import Rn from '../../../dist/cjs';

declare const window: any;

let framebuffer: Rn.FrameBuffer;
let renderPassMain: Rn.RenderPass;

// Init Rhodonite
await initRn();

const assets = await Rn.defaultAssetLoader.load({
  environment: Rn.CubeTexture.fromUrl({
    baseUrl: './../../../assets/ibl/papermill/environment/environment',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.LDR_SRGB,
  }),
  diffuse: Rn.CubeTexture.fromUrl({
    baseUrl: './../../../assets/ibl/papermill/diffuse/diffuse',
    mipmapLevelNumber: 1,
    isNamePosNeg: true,
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
  }),
  specular: Rn.CubeTexture.fromUrl({
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
Rn.System.startRenderLoop(() => {
  Rn.System.process(expressions);
});

async function initRn() {
  Rn.Config.cgApiDebugConsoleOutput = true;
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas,
    webglOption: { antialias: false },
  });
  Rn.Logger.logLevel = Rn.LogLevel.Info;
}

function createSat(expressions: Rn.Expression[]) {
  const expressionSat = new Rn.Expression();
  const materialSat = Rn.MaterialHelper.createSummedAreaTableMaterial();
  const renderPassSat = Rn.RenderPassHelper.createScreenDrawRenderPass(materialSat);
  expressionSat.addRenderPasses([renderPassSat]);
  expressions.push(expressionSat);
}

async function createMainExpression(expressions: Rn.Expression[]) {
  // Main Camera
  const cameraEntity = Rn.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(20.0);
  cameraComponent.aspect = 1.0;

  // Loading gltf
  const mainExpression = (
    await Rn.GltfImporter.importFromUri(
      '../../../assets/gltf/glTF-Sample-Assets/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
      {
        cameraComponent: cameraComponent,
      }
    )
  ).unwrapForce();
  expressions.push(mainExpression);

  // cameraController
  const mainRenderPass = mainExpression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
}

async function createBackgroundEnvCubeExpression() {
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', assets.environment, sampler);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);

  const sphereEntity = Rn.MeshHelper.createSphere({
    radius: 50,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });
  sphereEntity.localScale = Rn.Vector3.fromCopy3(-1, 1, 1);
  sphereEntity.localPosition = Rn.Vector3.fromCopy3(0, 20, -20);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.addEntities([sphereEntity]);

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}

async function setIBL() {
  // Get all meshRenderComponents and set IBL cube maps to them
  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(assets.diffuse, assets.specular);
  }
}
