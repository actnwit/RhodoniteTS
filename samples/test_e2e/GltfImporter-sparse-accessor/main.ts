import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.type = Rn.CameraType.Orthographic;

cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.xMag = 3.3;
cameraComponent.yMag = 3.3;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([3, 2, 1]);

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/SimpleSparseAccessor/glTF-Embedded/SimpleSparseAccessor.gltf',
  {
    cameraComponent: cameraComponent,
  }
);

Rn.Engine.process([expression]);

p.id = 'rendered';
p.innerText = 'Rendered.';
