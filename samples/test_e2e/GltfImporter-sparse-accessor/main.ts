import Rn from '../../../dist/esm/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.type = Rn.CameraType.Orthographic;

  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.xMag = 3.3;
  cameraComponent.yMag = 3.3;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([3, 2, 1]);

  // gltf
  const expression = (
    await Rn.GltfImporter.importFromUri(
      '../../../assets/gltf/glTF-Sample-Models/2.0/SimpleSparseAccessor/glTF-Embedded/SimpleSparseAccessor.gltf',
      {
        cameraComponent: cameraComponent,
      }
    )
  ).unwrapForce();

  Rn.System.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
