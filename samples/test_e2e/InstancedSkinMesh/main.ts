import Rn from '../../../dist/esmdev/index.js';
let p: any;

declare const window: any;
declare const Stats: any;

//-------------------------------
Rn.Config.maxEntityNumber = 20000;
Rn.Config.dataTextureWidth = Math.pow(2, 13);
Rn.Config.dataTextureHeight = Math.pow(2, 13);
Rn.Config.maxSkeletonNumber = 200;
Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

const light = Rn.createLightEntity();
light.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
light.getLight().intensity = 10;

// Camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(45);
cameraComponent.aspect = 1;
cameraEntity.localPosition = Rn.Vector3.fromCopyArray([-2.5, 5, 5]);
cameraEntity.localEulerAngles = Rn.Vector3.fromCopyArray([-Math.PI / 4, -Math.PI / 4, 0]);

const rnm = await Rn.Gltf2Importer.importFromUrl(
  // '../../../assets/gltf/glTF-Sample-Models/2.0/SimpleSkin/glTF-Embedded/SimpleSkin.gltf'
  '../../../assets/gltf/glTF-Sample-Assets/Models/BrainStem/glTF-Binary/BrainStem.glb'
);

const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(rnm);
//rootGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
rootGroup.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
// cameraControllerComponent.controller.setTarget(rootGroup);

const groups = [];
for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 2; j++) {
    const newGroup = Rn.EntityRepository.shallowCopyEntity(rootGroup) as Rn.ISceneGraphEntity;
    newGroup.getTransform().localPosition = Rn.Vector3.fromCopyArray([i * 2, 0, j * 2]);
    groups.push(newGroup);
  }
}

// renderPass
const renderPass = new Rn.RenderPass();
renderPass.toClearColorBuffer = true;
renderPass.toClearDepthBuffer = true;
renderPass.addEntities([rootGroup]);
renderPass.addEntities(groups);

// expression
const expression = new Rn.Expression();
expression.addRenderPasses([renderPass]);

Rn.CameraComponent.current = 0;

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.domElement);

let startTime = Date.now();
const rotationVec3 = Rn.MutableVector3.one();
let count = 0;

Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  if (window.isAnimating) {
    const date = new Date();
    const rotation = 0.001 * (date.getTime() - startTime);
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

  stats.begin();
  Rn.System.process([expression]);
  stats.end();

  count++;
});

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
