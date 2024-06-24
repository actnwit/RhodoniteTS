import Rn from '../../../dist/esmdev/index.js';
// import Rn from '../../../dist/cjs';

declare const window: any;

let framebuffer: Rn.FrameBuffer;
let renderPassMain: Rn.RenderPass;

// Init Rhodonite
await initRn();

// expressions
const expressions: Rn.Expression[] = [];

// Background Env Cube Map Expression
const envExpression = createBackgroundEnvCubeExpression('./../../../assets/ibl/papermill');
expressions.push(envExpression);

// setup the Main RenderPass
await createMainExpression(expressions);

// setup the SAT RenderPass
// createSat(expressions);

// lighting
await setIBL('./../../../assets/ibl/papermill');

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
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
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

function createBackgroundEnvCubeExpression(baseUri: string) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseUri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture,
    sampler
  );
  sphereMaterial.setParameter(Rn.ShaderSemantics.EnvHdriFormat, Rn.HdriFormat.LDR_SRGB.index);

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

async function setIBL(baseUri: string) {
  // Specular IBL Cube Texture
  const specularCubeTexture = new Rn.CubeTexture();
  specularCubeTexture.baseUriToLoad = baseUri + '/specular/specular';
  specularCubeTexture.isNamePosNeg = true;
  specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  specularCubeTexture.mipmapLevelNumber = 10;

  // Diffuse IBL Cube Texture
  const diffuseCubeTexture = new Rn.CubeTexture();
  diffuseCubeTexture.baseUriToLoad = baseUri + '/diffuse/diffuse';
  diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
  diffuseCubeTexture.mipmapLevelNumber = 1;
  diffuseCubeTexture.isNamePosNeg = true;

  // Get all meshRenderComponents and set IBL cube maps to them
  const meshRendererComponents = Rn.ComponentRepository.getComponentsWithType(
    Rn.MeshRendererComponent
  ) as Rn.MeshRendererComponent[];
  for (const meshRendererComponent of meshRendererComponents) {
    await meshRendererComponent.setIBLCubeMap(diffuseCubeTexture, specularCubeTexture);
  }
}
