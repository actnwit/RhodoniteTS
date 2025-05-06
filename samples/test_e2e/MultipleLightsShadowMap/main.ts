import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
Rn.Logger.logLevel = Rn.LogLevel.Debug;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Point Light 1
let pointLight = Rn.MeshHelper.createSphere() as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  pointLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight.getLight().type = Rn.LightType.Point;
pointLight.getLight().castShadow = true;
pointLight.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
pointLight.getLight().intensity = 20;
pointLight.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
const pointGroupEntity = Rn.createGroupEntity();
pointGroupEntity.addChild(pointLight.getSceneGraph());
pointGroupEntity.localPosition = Rn.Vector3.fromCopyArray([2, 0, 2]);
pointLight.localPosition = Rn.Vector3.fromCopyArray([2, 0, 0]);

// Point Light 2
let pointLight2 = Rn.MeshHelper.createSphere() as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight2 = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  pointLight2
) as Rn.IMeshEntity & Rn.ILightEntityMethods;
pointLight2.getLight().type = Rn.LightType.Point;
pointLight2.getLight().castShadow = true;
pointLight2.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
pointLight2.getLight().intensity = 20;
pointLight2.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
const pointGroupEntity2 = Rn.createGroupEntity();
pointGroupEntity2.addChild(pointLight2.getSceneGraph());
pointGroupEntity2.localPosition = Rn.Vector3.fromCopyArray([-2, 0, 2]);
pointLight2.localPosition = Rn.Vector3.fromCopyArray([-2, 0, 0]);

// Spot Light 1
let spotLight = Rn.MeshHelper.createSphere() as Rn.IMeshEntity &
  Rn.ILightEntityMethods &
  Rn.ICameraEntityMethods;
spotLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  spotLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.CameraComponentTID,
  spotLight
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight.getCamera().isSyncToLight = true;
spotLight.getLight().castShadow = true;
spotLight.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
spotLight.getLight().type = Rn.LightType.Spot;
spotLight.getLight().range = 1000.0;
spotLight.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight.localEulerAngles = Rn.Vector3.fromCopy3(-Math.PI / 2, 0, 0);
spotLight.localPosition = Rn.Vector3.fromCopy3(0.0, 6.0, 0.0);

// Spot Light 2
let spotLight2 = Rn.MeshHelper.createSphere() as Rn.IMeshEntity &
  Rn.ILightEntityMethods &
  Rn.ICameraEntityMethods;
spotLight2 = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.LightComponentTID,
  spotLight2
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight2 = Rn.EntityRepository.tryToAddComponentToEntityByTID(
  Rn.WellKnownComponentTIDs.CameraComponentTID,
  spotLight2
) as Rn.IMeshEntity & Rn.ILightEntityMethods & Rn.ICameraEntityMethods;
spotLight2.getCamera().isSyncToLight = true;
spotLight2.getLight().castShadow = true;
spotLight2.scale = Rn.Vector3.fromCopyArray([0.1, 0.1, 0.1]);
spotLight2.getLight().type = Rn.LightType.Spot;
spotLight2.getLight().range = 1000.0;
spotLight2.getLight().outerConeAngle = Rn.MathUtil.degreeToRadian(120);
spotLight2.localEulerAngles = Rn.Vector3.fromCopy3(Math.PI / 2, 0, 0);
spotLight2.localPosition = Rn.Vector3.fromCopy3(0.0, -6.0, 0.0);

// Main Camera
const mainCameraEntity = Rn.createCameraControllerEntity();
mainCameraEntity.localPosition = Rn.Vector3.fromCopyArray([0, 0, 10]);

// Scene
const groupEntity = createObjects();
mainCameraEntity.getCameraController().controller.setTarget(groupEntity);
const backgroundEntity = createBackground();

const shadowSystem = new Rn.ShadowSystem(1024);
const shadowExpressions = shadowSystem.getExpressions([groupEntity, backgroundEntity]);

const mainExpression = new Rn.Expression();
const mainRenderPass = new Rn.RenderPass();
mainRenderPass.clearColor = Rn.Vector4.fromCopyArray([1, 1, 1, 1]);
mainRenderPass.toClearColorBuffer = true;
mainRenderPass.toClearDepthBuffer = true;
mainRenderPass.cameraComponent = mainCameraEntity.getCamera();
mainRenderPass.addEntities([
  groupEntity,
  backgroundEntity,
  pointLight,
  pointLight2,
  spotLight,
  spotLight2,
]);
mainExpression.addRenderPasses([mainRenderPass]);

let count = 0;
let angle = 0;
Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }
  if (window.isAnimating) {
    rotateObject(pointGroupEntity, angle);
    rotateObject(pointGroupEntity2, angle / 2);
    angle += 0.01;
  }
  shadowSystem.setDepthBiasPV([groupEntity, backgroundEntity]);
  Rn.System.process([...shadowExpressions, mainExpression]);

  count++;
});

function createObjects() {
  const material = Rn.MaterialHelper.createPbrUberMaterial({ isShadow: true });
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1, 0, 0, 1]));
  const cubesGroupEntity = Rn.createGroupEntity();
  const cube0Entity = Rn.MeshHelper.createCube({ material });
  cube0Entity.localPosition = Rn.Vector3.fromCopyArray([2, 0, 2]);
  const cube1Entity = Rn.MeshHelper.createCube({ material });
  cube1Entity.localPosition = Rn.Vector3.fromCopyArray([-2, 0, 2]);
  const cube2Entity = Rn.MeshHelper.createSphere({
    widthSegments: 40,
    heightSegments: 40,
    material,
  });
  cube2Entity.localPosition = Rn.Vector3.fromCopyArray([2, 0, -2]);
  const cube3Entity = Rn.MeshHelper.createSphere({
    widthSegments: 40,
    heightSegments: 40,
    material,
  });
  cube3Entity.localPosition = Rn.Vector3.fromCopyArray([-2, 0, -2]);
  cubesGroupEntity.addChild(cube0Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube1Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube2Entity.getSceneGraph());
  cubesGroupEntity.addChild(cube3Entity.getSceneGraph());

  return cubesGroupEntity;
}

function createBackground() {
  const material = Rn.MaterialHelper.createPbrUberMaterial({ isShadow: true });
  material.cullFaceBack = false;
  material.setParameter('baseColorFactor', Rn.Vector4.fromCopyArray([1.0, 1.0, 1.0, 1]));
  const backgroundEntity = Rn.MeshHelper.createSphere({
    widthSegments: 50,
    heightSegments: 50,
    material,
  });
  backgroundEntity.scale = Rn.Vector3.fromCopyArray([10, 10, 10]);
  return backgroundEntity;
}

function rotateObject(object: Rn.ISceneGraphEntity, angle: number) {
  object.localEulerAngles = Rn.Vector3.fromCopyArray([0, angle, 0]);
}
