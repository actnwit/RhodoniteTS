import _Rn from '../../../dist/esm/index';
declare const Rn: typeof _Rn;

const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(35.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = new Rn.Vector3(0, 0, 5.5);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import('../../../assets/gltf/2.0/TextureTransformTest/glTF/TextureTransformTest.gltf', {
    cameraComponent: cameraComponent,
    defaultMaterialHelperArgumentArray: [{
      isLighting: false
    }]
  });

  system.process([expression]);

  p.id = 'rendered';
  p.innerText = 'Rendered.';


})();
