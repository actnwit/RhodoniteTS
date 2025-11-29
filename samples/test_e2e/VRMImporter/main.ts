import Rn from '../../../dist/esmdev/index.js';

let p: HTMLParagraphElement | undefined;

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// Camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(50);
cameraComponent.aspect = 1;

cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// Lights
// const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
// lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 100000.0, 1.0]);
// lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
const lightEntity2 = Rn.createLightEntity();
const lightComponent2 = lightEntity2.getLight();
lightComponent2.type = Rn.LightType.Directional;
lightComponent2.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
lightEntity2.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0.0, 0.0, Math.PI / 8]);

const expression = await Rn.GltfImporter.importFromUrl('../../../assets/vrm/test.vrm');

const entities = expression.renderPasses[0].entities;
expression.renderPasses[0].toClearColorBuffer = true;
// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTargets(entities);
controller.dolly = 0.78;

Rn.CameraComponent.current = 0;
let count = 0;
let startTime = Date.now();

Rn.Engine.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const _rotation = 0.001 * (date.getTime() - startTime);
    //rotationVec3._v[0] = 0.1;
    //rotationVec3._v[1] = rotation;
    //rotationVec3._v[2] = 0.1;
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
    //console.log(time);
    //      rootGroup.getTransform().scale = rotationVec3;
    //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
  }

  Rn.Engine.process([expression]);
  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export('Rhodonite');
};
