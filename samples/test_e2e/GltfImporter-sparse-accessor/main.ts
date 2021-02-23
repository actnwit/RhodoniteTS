import _Rn from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  Rn.Config.maxSkeletalBoneNumber = 50; // avoiding too many uniforms error for software renderer
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.type = Rn.CameraType.Orthographic;

  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.xMag = 3.3;
  cameraComponent.yMag = 3.3;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = new Rn.Vector3(3, 2, 1);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    '../../../assets/gltf/2.0/SimpleSparseAccessor/glTF-Embedded/SimpleSparseAccessor.gltf',
    {
      cameraComponent: cameraComponent,
    }
  );

  system.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
