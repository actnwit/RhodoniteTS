import Rn from '../../../dist/esmdev/index.js';
import { getGltfFilePath, getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

Rn.Config.isUboEnabled = false;
Rn.Config.cgApiDebugConsoleOutput = true;
const processApproach = getProcessApproach(Rn);
const canvas = document.getElementById('world') as HTMLCanvasElement;
await Rn.System.init({
  approach: processApproach,
  canvas,
});

// create ForwardRenderPipeline
const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
forwardRenderPipeline.setup(canvas.width, canvas.height, {
  isBloom: true,
});

// camera
const { cameraComponent, cameraEntity } = createCamera();

// gltf
const gltfFilePath = getGltfFilePath();
const mainExpression = (
  await Rn.GltfImporter.importFromUri(gltfFilePath, {
    cameraComponent: cameraComponent,
    defaultMaterialHelperArgumentArray: [
      {
        makeOutputSrgb: false,
      },
    ],
  })
).unwrapForce();

// env
const envExpression = createEnvCubeExpression('./../../../assets/ibl/papermill', cameraEntity);

const mainRenderPass = mainExpression.renderPasses[0];
mainRenderPass.tryToSetUniqueName('main', true);
// cameraController
const mainCameraControllerComponent = cameraEntity.getCameraController();
const controller = mainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
controller.dolly = 0.83;

await forwardRenderPipeline.setExpressions([envExpression, mainExpression]);

// lighting
await forwardRenderPipeline.setIBL({
  diffuse: {
    baseUri: './../../../assets/ibl/papermill/diffuse/diffuse',
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
    isNamePosNeg: true,
    mipmapLevelNumber: 1,
  },
  specular: {
    baseUri: './../../../assets/ibl/papermill/specular/specular',
    hdriFormat: Rn.HdriFormat.RGBE_PNG,
    isNamePosNeg: true,
    mipmapLevelNumber: 10,
  },
});

let count = 0;
let startTime = Date.now();
const draw = function (frame) {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.setIsAnimating(true);
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
  } else {
    Rn.AnimationComponent.setIsAnimating(false);
  }

  Rn.System.process(frame);

  count++;
};

forwardRenderPipeline.startRenderLoop(draw);

function createCamera() {
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;
  return { cameraComponent, cameraEntity };
}

function createEnvCubeExpression(baseuri, cameraEntity) {
  const environmentCubeTexture = new Rn.CubeTexture();
  environmentCubeTexture.baseUriToLoad = baseuri + '/environment/environment';
  environmentCubeTexture.isNamePosNeg = true;
  environmentCubeTexture.hdriFormat = Rn.HdriFormat.LDR_SRGB;
  environmentCubeTexture.mipmapLevelNumber = 1;
  environmentCubeTexture.loadTextureImagesAsync();

  const sphereMaterial = Rn.MaterialHelper.createEnvConstantMaterial();
  const sampler = new Rn.Sampler({
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  sphereMaterial.setTextureParameter(
    Rn.ShaderSemantics.ColorEnvTexture,
    environmentCubeTexture,
    sampler
  );
  sphereMaterial.setParameter(Rn.ShaderSemantics.EnvHdriFormat, Rn.HdriFormat.LDR_SRGB.index);

  const spherePrimitive = new Rn.Sphere();
  spherePrimitive.generate({
    radius: 20,
    widthSegments: 40,
    heightSegments: 40,
    material: sphereMaterial,
  });

  const sphereMesh = new Rn.Mesh();
  sphereMesh.addPrimitive(spherePrimitive);

  const sphereEntity = Rn.EntityHelper.createMeshEntity();
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0, 0, 0]);

  const sphereMeshComponent = sphereEntity.getMesh();
  sphereMeshComponent.setMesh(sphereMesh);

  const sphereRenderPass = new Rn.RenderPass();
  sphereRenderPass.tryToSetUniqueName('envCube', true);
  sphereRenderPass.addEntities([sphereEntity]);
  sphereRenderPass.cameraComponent = cameraEntity.getCamera();

  const sphereExpression = new Rn.Expression();
  sphereExpression.addRenderPasses([sphereRenderPass]);

  return sphereExpression;
}
