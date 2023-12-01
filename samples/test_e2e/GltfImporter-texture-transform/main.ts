import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.EntityHelper.createCameraEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(35.0);
cameraComponent.aspect = 1.0;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([0, 0, 5.5]);

// gltf
const expression = (
  await Rn.GltfImporter.importFromUri(
    '../../../assets/gltf/glTF-Sample-Models/2.0/TextureTransformTest/glTF/TextureTransformTest.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  )
).unwrapForce();

let count = 0;

Rn.System.startRenderLoop(() => {
  if (count > 100) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }

  Rn.System.process([expression]);

  count++;
});
