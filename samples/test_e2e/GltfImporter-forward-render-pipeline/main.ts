import Rn from '../../../dist/esmdev/index.js';
import { getGltfFilePath, getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

Rn.Config.isUboEnabled = false;
Rn.Config.cgApiDebugConsoleOutput = true;
const processApproach = getProcessApproach(Rn);
const canvas = document.getElementById('world') as HTMLCanvasElement;
const engine = await Rn.Engine.init({
  approach: processApproach,
  canvas,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// camera
const gltfFilePath = getGltfFilePath();
const { cameraComponent, cameraEntity } = createCamera();

const assets = await Rn.defaultAssetLoader.load({
  mainExpression: Rn.GltfImporter.importFromUrl(engine, gltfFilePath, {
    cameraComponent: cameraComponent,
    defaultMaterialHelperArgumentArray: [
      {
        makeOutputSrgb: false,
      },
    ],
  }),
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

// create ForwardRenderPipeline
const forwardRenderPipeline = new Rn.ForwardRenderPipeline(engine);
forwardRenderPipeline.setup(canvas.width, canvas.height, {
  isBloom: false,
  isShadow: false,
});

// env
const envExpression = await createEnvCubeExpression(cameraEntity);

const mainRenderPass = assets.mainExpression.renderPasses[0];
mainRenderPass.tryToSetUniqueName('main', true);
// cameraController
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
controller.dolly = 0.83;

await forwardRenderPipeline.setExpressions([envExpression, assets.mainExpression]);

forwardRenderPipeline.setIBLTextures(assets.diffuse, assets.specular);

let count = 0;
let startTime = Date.now();
const draw = frame => {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.setIsAnimating(true);
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  } else {
    Rn.AnimationComponent.setIsAnimating(false);
  }

  engine.process(frame);

  count++;
};

forwardRenderPipeline.startRenderLoop(draw);

function createCamera() {
  const cameraEntity = Rn.createCameraControllerEntity(engine, true);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;
  return { cameraComponent, cameraEntity };
}

async function createEnvCubeExpression(cameraEntity) {
  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial(engine);
  const sampler = new Rn.Sampler(engine, {
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  sphereMaterial.setTextureParameter('colorEnvTexture', assets.environment, sampler);
  sphereMaterial.setParameter('envHdriFormat', Rn.HdriFormat.LDR_SRGB.index);

  const spherePrimitive = new Rn.Sphere(engine);
  spherePrimitive.generate({
    radius: 20,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh(engine);
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.createMeshEntity(engine);
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 0]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass(engine);
  sphereRenderPass.tryToSetUniqueName('envCube', true);
  sphereRenderPass.addEntities([sphereEntity]);
  sphereRenderPass.cameraComponent = cameraEntity.getCamera();

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}
