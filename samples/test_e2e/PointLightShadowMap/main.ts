import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Spot Light
const pointLight = createPointLight();

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

// Scene
const cubesGroupEntity = createCubes();
mainCameraEntity.getCameraController().controller.setTarget(cubesGroupEntity);
const backgroundEntity = createBackground();

// Expression
const expression = new Rn.Expression();
const shadowMomentFramebuffer = Rn.RenderableHelper.createFrameBuffer({
  width: 1024,
  height: 1024,
  textureNum: 1,
  textureFormats: [Rn.TextureFormat.RGBA16F],
  createDepthBuffer: true,
  depthTextureFormat: Rn.TextureFormat.Depth32F,
});

const shadowMomentRenderPass = new Rn.RenderPass();
shadowMomentRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
shadowMomentRenderPass.toClearColorBuffer = true;
shadowMomentRenderPass.toClearDepthBuffer = true;
shadowMomentRenderPass.addEntities([cubesGroupEntity, backgroundEntity]);
shadowMomentRenderPass.setFramebuffer(shadowMomentFramebuffer);
expression.addRenderPasses([shadowMomentRenderPass]);

const mainRenderPass = new Rn.RenderPass();
mainRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.addEntities([cubesGroupEntity, backgroundEntity]);
expression.addRenderPasses([mainRenderPass]);

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  Rn.System.process([expression]);

  count++;
});

function createPointLight() {
  const pointLight = Rn.createLightEntity();
  pointLight.getLight().type = Rn.LightType.Point;
  pointLight.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
  pointLight.localPosition = Rn.Vector3.fromCopy3(0.0, 0.0, 0.0);
  return pointLight;
}

function createCubes() {
  const material = Rn.MaterialHelper.createPbrUberMaterial();
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1, 0, 0, 1]));
  const cubesGroupEntity = Rn.createGroupEntity();
  const cube0Entity = Rn.MeshHelper.createCube({ material });
  cube0Entity.localPosition = Rn.Vector3.fromCopyArray([1, 0, 1]);
  const cube1Entity = Rn.MeshHelper.createCube({ material });
  cube1Entity.localPosition = Rn.Vector3.fromCopyArray([-1, 0, 1]);
  const cube2Entity = Rn.MeshHelper.createCube({ material });
  cube2Entity.localPosition = Rn.Vector3.fromCopyArray([1, 0, -1]);
  const cube3Entity = Rn.MeshHelper.createCube({ material });
  cube3Entity.localPosition = Rn.Vector3.fromCopyArray([-1, 0, -1]);
  cubesGroupEntity.addChild(cube0Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube1Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube2Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube3Entity.getSceneGraph());

  return cubesGroupEntity;
}

function createBackground() {
  const material = Rn.MaterialHelper.createPbrUberMaterial();
  material.cullFaceBack = false;
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1.0, 1.0, 1.0, 1]));
  const backgroundEntity = Rn.MeshHelper.createCube({ material });
  backgroundEntity.scale = Rn.Vector3.fromCopyArray([10, 10, 10]);
  return backgroundEntity;
}
