import Rn from '../../../dist/esm/index.mjs';

const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  const world = document.getElementById('world') as HTMLCanvasElement;

  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: world,
    rnWebGLDebug: true,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(25.0);
  cameraComponent.aspect = world.width / world.height;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([0, 2, 8]);
  cameraTransform.rotate = Rn.Vector3.fromCopyArray([-0.1, 0, 0]);

  // gltf
  const expression = (await Rn.GltfImporter.importFromUri(
    './../../../assets/gltf/glTF-Sample-Models/2.0/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  )).unwrapForce();

  Rn.System.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
