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
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([4, 3, 4]);
  cameraTransform.rotate = Rn.Vector3.fromCopyArray([-Math.PI / 6, Math.PI / 4, 0]);

  // gltf
  const expression = (
    await Rn.GltfImporter.importFromUri(
      '../../../assets/gltf/glTF-Sample-Models/2.0/MultiUVTest/glTF/MultiUVTest.gltf',
      {
        cameraComponent: cameraComponent,
      }
    )
  ).unwrapForce();

  // Lights
  const lightEntity = Rn.EntityHelper.createLightEntity();
  lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([0.4, 0.9, 0.7]);
  lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([4.0, 0.0, 5.0]);

  Rn.System.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
