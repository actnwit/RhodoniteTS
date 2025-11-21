import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

const moduleManager = Rn.ModuleManager.getInstance();
const effekseerModule = await moduleManager.loadModule('effekseer', {
  // Comment out for WASM version
  // wasm: '../../../vendor/effekseer.wasm',
});

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// Effekseer
const effekseerEntity = effekseerModule.createEffekseerEntity();
const effekseerComponent = effekseerEntity.getComponent(effekseerModule.EffekseerComponent) as Rn.EffekseerComponent;
effekseerComponent.playJustAfterLoaded = true;
effekseerComponent.randomSeed = 1;
effekseerComponent.isLoop = false;

// effekseerComponent.isLoop = true;
effekseerComponent.uri = '../../../assets/effekseer/Laser01.efk';
// effekseerEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.54, 0]);

// Camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(90);
cameraComponent.aspect = 1;

// 3D Model for Test
const response = await Rn.Gltf2Importer.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb'
);
const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(response);
// const sphereEntity = createSphere();

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(rootGroup);

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.clearColor = Rn.Vector4.fromCopyArray([0.0, 0.0, 0.0, 0.01]);
renderPass.toClearColorBuffer = true;
// renderPass.addEntities([effekseerEntity]);
renderPass.addEntities([rootGroup, effekseerEntity]);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.current = 0;
let count = 0;
let setTimeDone = false;

Rn.System.startRenderLoop(() => {
  if (count > 0 && window._rendered !== true && setTimeDone) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
    window._rendered = true;
  }
  if (effekseerComponent.isPlay() && !setTimeDone) {
    // const cameraController =
    //   cameraEntity.getCameraController() as unknown as OrbitCameraController;
    // cameraController.rotX = 90;
    // cameraController.rotY = 90;
    effekseerComponent.setTime(0.16);
    setTimeDone = true;
    // effekseerComponent.stop();
    count = 0;
  }

  Rn.System.process([expression]);
  count++;
});
