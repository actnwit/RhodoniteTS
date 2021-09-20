import _Rn from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  const world = document.getElementById('world') as HTMLCanvasElement;

  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, world);

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(25.0);
  cameraComponent.aspect = world.width / world.height;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = new Rn.Vector3(0, 2, 8);
  cameraTransform.rotate = new Rn.Vector3(-0.1, 0, 0);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    './../../../assets/gltf/2.0/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  );

  system.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
