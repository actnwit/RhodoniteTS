import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(30.0);
cameraComponent.aspect = 1.0;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([4, 3, 4]);
cameraTransform.localEulerAngles = Rn.Vector3.fromCopyArray([-Math.PI / 6, Math.PI / 4, 0]);

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/MultiUVTest/glTF-Binary/MultiUVTest.glb',
  {
    cameraComponent: cameraComponent,
  }
);

// Lights
const lightEntity = Rn.createLightEntity();
lightEntity.getLight().color = Rn.Vector3.fromCopyArray([1, 1, 1]);
lightEntity.getLight().intensity = 20;
lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([4.0, 0.0, 5.0]);

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }

  Rn.System.process([expression]);

  count++;
});
