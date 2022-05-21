import Rn from '../../../dist/esm/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  Rn.Config.boneDataType = Rn.BoneDataType.Vec4x2;
  Rn.Config.maxSkeletalBoneNumber = 2;

  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([0, 1, 5]);

  // gltf
  const expression = await Rn.GltfImporter.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/SimpleSkin/glTF-Embedded/SimpleSkin.gltf',
    {
      cameraComponent: cameraComponent,
    }
  );

  let count = 0;
  let startTime = Date.now();

  Rn.AnimationComponent.globalTime = 0.03;

  const draw = function () {
    if (count > 0) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
    }

    if (window.isAnimating) {
      const date = new Date();
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }

    Rn.System.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();
