import Rn from '../../../dist/esmdev/index.js';

const p = document.createElement('p');
document.body.appendChild(p);

const world = document.getElementById('world') as HTMLCanvasElement;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: world,
});

// camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(25.0);
cameraComponent.aspect = world.width / world.height;

const cameraTransform = cameraEntity.getTransform();
cameraTransform.localPosition = Rn.Vector3.fromCopyArray([0, 2, 8]);
cameraTransform.localEulerAngles = Rn.Vector3.fromCopyArray([-0.1, 0, 0]);

// gltf
const expression = (
  await Rn.GltfImporter.importFromUri(
    './../../../assets/gltf/glTF-Sample-Assets/Models/AlphaBlendModeTest/glTF-Binary/AlphaBlendModeTest.glb',
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
  if (count > 0) {
    p.id = 'rendered';
    p.innerText = 'Rendered.';
  }

  Rn.System.process([expression]);

  count++;
});
