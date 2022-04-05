import _Rn from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  const world = document.getElementById('world') as HTMLCanvasElement;

  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
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
  cameraTransform.translate = Rn.Vector3.fromCopyArray([0, 2, 8]);
  cameraTransform.rotate = Rn.Vector3.fromCopyArray([-0.1, 0, 0]);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    './../../../assets/gltf/glTF-Sample-Models/2.0/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  );

  Rn.System.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
