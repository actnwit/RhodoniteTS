import Rn from '../../../dist/esmdev/index.js';
let p: any;

declare const window: any;

//-------------------------------
Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.position = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// Lights
const lightEntity = Rn.createLightEntity(engine);
lightEntity.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
lightEntity.getLight().type = Rn.LightType.Directional;

const response = await Rn.Gltf2Importer.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb'
);

const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(engine, response);
rootGroup.localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
cameraControllerComponent.controller.setTarget(rootGroup);

// renderPass
const renderPass = new Rn.RenderPass(engine);
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([rootGroup]);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.setCurrent(engine, cameraComponent.componentSID);
let startTime = Date.now();
let count = 0;
engine.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.setGlobalTimeForEngine(engine, time);
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  }

  engine.process([expression]);
  count++;
});

//---------------------
window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(engine, 'Rhodonite');
};
