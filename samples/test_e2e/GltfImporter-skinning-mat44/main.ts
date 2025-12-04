import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

const p = document.createElement('p');
document.body.appendChild(p);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ boneDataType: Rn.BoneDataType.Mat43x1, cgApiDebugConsoleOutput: true }),
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

// camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([0, 1, 5]);

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/SimpleSkin/glTF-Embedded/SimpleSkin.gltf',
  {
    cameraComponent: cameraComponent,
  }
);

let count = 0;
let startTime = Date.now();

Rn.AnimationComponent.setGlobalTime(engine, 0.03);

engine.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.setGlobalTime(engine, time);
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  }

  engine.process([expression]);

  count++;
});
