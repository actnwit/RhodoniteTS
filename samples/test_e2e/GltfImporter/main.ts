import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

Rn.Config.maxEntityNumber = 200;
Rn.Config.maxMaterialInstanceForEachType = 30;
Rn.Config.dataTextureWidth = 2 ** 8;
Rn.Config.dataTextureHeight = 2 ** 9;
Rn.Config.isUboEnabled = false;
Rn.Config.cgApiDebugConsoleOutput = true;

await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// params
const vrmModelRotation = Rn.Vector3.fromCopyArray([0, (3 / 4) * Math.PI, 0]);

// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

// expresions
const expressions = [];

// vrm
const vrmExpression = await Rn.GltfImporter.importFromUrl('../../../assets/vrm/test.vrm', {
  defaultMaterialHelperArgumentArray: [
    {
      isSkinning: false,
      isMorphing: false,
      makeOutputSrgb: true,
    },
  ],
  tangentCalculationMode: 0,
  cameraComponent: cameraComponent,
});
expressions.push(vrmExpression);

const vrmMainRenderPass = vrmExpression.renderPasses[0];
vrmMainRenderPass.toClearColorBuffer = true;

const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
vrmRootEntity.getTransform().localEulerAngles = vrmModelRotation;

//set default camera
Rn.CameraComponent.current = 0;

// cameraController
const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
const vrmMainCameraEntity = vrmMainCameraComponent.entity;
const vrmMainCameraControllerComponent = vrmMainCameraEntity.tryToGetCameraController();
const controller = vrmMainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.8;
controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);

// Lights
const lightEntity = Rn.createLightEntity();
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 0, Math.PI / 8]);

let count = 0;
Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    // const date = new Date();
  }

  Rn.System.process(expressions);

  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export('Rhodonite');
};
