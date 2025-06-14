import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;
declare const Stats: any;

Rn.Config.maxEntityNumber = 40000;
Rn.Config.maxMaterialInstanceForEachType = 30;
Rn.Config.maxSkeletalBoneNumber = 100;
Rn.Config.maxSkeletonNumber = 1504;
Rn.Config.maxSkeletalBoneNumberForUniformMode = 100;
Rn.Config.dataTextureWidth = 2 ** 12;
Rn.Config.dataTextureHeight = 2 ** 11;
Rn.Config.maxMorphTargetNumber = 1;
Rn.Config.isUboEnabled = false;
Rn.Config.cgApiDebugConsoleOutput = true;

await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// params

// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(50.0);
cameraComponent.aspect = 1.0;

// vrm
const assets = await Rn.defaultAssetLoader.load({
  vrmModel: Rn.GltfImporter.importFromUrl('../../../assets/vrm/test.vrm', {
    cameraComponent: cameraComponent,
  }),
  vrmAnimation: Rn.VrmaImporter.importFromUrl('../../../assets/vrma/CC0animationrotate01.vrma'),
});

// expressions
const expressions = [assets.vrmModel];

const vrmMainRenderPass = assets.vrmModel.renderPasses[0];
vrmMainRenderPass.toClearColorBuffer = true;

const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;

// animation
const animationAssigner = Rn.AnimationAssigner.getInstance();
animationAssigner.assignAnimationWithVrma(vrmRootEntity, assets.vrmAnimation);

for (let i = 0; i < 1; i++) {
  for (let j = 0; j < 1; j++) {
    const vrmRootEntity2nd = Rn.EntityRepository.shallowCopyEntity(vrmRootEntity) as Rn.ISceneGraphEntity;
    vrmRootEntity2nd.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, Math.PI, 0.0]);
    vrmRootEntity2nd.getTransform().localPosition = Rn.Vector3.fromCopyArray([i, 0, j]);
    vrmMainRenderPass.addEntities([vrmRootEntity2nd]);
    animationAssigner.assignAnimationWithVrma(vrmRootEntity2nd, assets.vrmAnimation);
  }
}

//set default camera
Rn.CameraComponent.current = 0;

// camera controller
const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
const vrmMainCameraEntity = vrmMainCameraComponent.entity as Rn.ICameraControllerEntity;
const vrmMainCameraControllerComponent = vrmMainCameraEntity.getCameraController();
const controller = vrmMainCameraControllerComponent.controller as Rn.OrbitCameraController;
controller.dolly = 0.78;
controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);
// controller.autoUpdate = false;

// Lights
const lightEntity = Rn.createLightEntity();
const lightComponent = lightEntity.getLight();
lightComponent.type = Rn.LightType.Directional;
lightComponent.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0.0, 0.0, Math.PI / 8]);

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.domElement);

let count = 0;
let startTime = Date.now();

Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.globalTime = time;
    if (time > Rn.AnimationComponent.endInputValue) {
      startTime = date.getTime();
    }
  }

  stats.begin();
  Rn.System.process(expressions);
  stats.end();

  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export('Rhodonite');
};
