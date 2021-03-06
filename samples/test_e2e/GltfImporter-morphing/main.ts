import _Rn from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;

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
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(45.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = new Rn.Vector3(3, 0, 3);
  cameraTransform.rotate = new Rn.Vector3(0, Math.PI / 4, 0);

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const expression = await gltfImporter.import(
    '../../../assets/gltf/2.0/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb',
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
  lightEntity.getLight().intensity = new Rn.Vector3(0.4, 0.9, 0.7);
  lightEntity.getTransform().translate = new Rn.Vector3(4.0, 0.0, 5.0);

  let count = 0;
  Rn.AnimationComponent.globalTime = 3.6;

  const draw = function () {
    if (count > 0) {
      window._rendered = true;
    }

    if (window.isAnimating) {
      Rn.AnimationComponent.globalTime += 0.016;
      if (
        Rn.AnimationComponent.globalTime > Rn.AnimationComponent.endInputValue
      ) {
        Rn.AnimationComponent.globalTime -=
          Rn.AnimationComponent.endInputValue -
          Rn.AnimationComponent.startInputValue;
      }
    }

    system.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };
  draw();
})();
