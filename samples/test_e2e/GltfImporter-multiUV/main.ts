import _Rn from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Promise.all([
    Rn.ModuleManager.getInstance().loadModule('webgl'),
    Rn.ModuleManager.getInstance().loadModule('pbr'),
  ]);
  const system = Rn.System.getInstance();

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
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([4, 3, 4]);
  cameraTransform.rotate = Rn.Vector3.fromCopyArray([
    -Math.PI / 6,
    Math.PI / 4,
    0,
  ]);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    '../../../assets/gltf/2.0/MultiUVTest/glTF/MultiUVTest.gltf',
    {
      cameraComponent: cameraComponent,
    }
  );

  // Lights
  const lightEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.LightComponent,
  ]);
  lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([0.4, 0.9, 0.7]);
  lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    4.0, 0.0, 5.0,
  ]);

  system.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';
})();
