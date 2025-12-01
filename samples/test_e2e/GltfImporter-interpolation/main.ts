import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([0, 4.2, 25]);

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/InterpolationTest/glTF-Binary/InterpolationTest.glb',
  {
    cameraComponent: cameraComponent,
  }
);

// Lights
const lightEntity = Rn.createLightEntity(engine);
lightEntity.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
lightEntity.getLight().intensity = 40;
lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 10.0, 10.0]);

let count = 0;
Rn.AnimationComponent.globalTime = 0.33;

engine.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }

  if (window.isAnimating) {
    Rn.AnimationComponent.globalTime += 0.016;
    if (Rn.AnimationComponent.globalTime > Rn.AnimationComponent.getEndInputValue(engine)) {
      Rn.AnimationComponent.globalTime -=
        Rn.AnimationComponent.getEndInputValue(engine) - Rn.AnimationComponent.getStartInputValue(engine);
    }
  }

  engine.process([expression]);

  count++;
});

window.exportGltf2 = () => {
  Rn.Gltf2Exporter.export(engine, 'Rhodonite');
};
