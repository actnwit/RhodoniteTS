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
const spotLight = Rn.createLightEntity();
spotLight.getLight().type = Rn.LightType.Point;
spotLight.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 0.0, 0.0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

const cubesGroupEntity = createCubes();
mainCameraEntity.getCameraController().controller.setTarget(cubesGroupEntity);

const backgroundEntity = createBackground();

const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass();
renderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([cubesGroupEntity, backgroundEntity]);
expression.addRenderPasses([renderPass]);

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  Rn.System.process([expression]);

  count++;
});

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
