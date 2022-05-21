import Rn from '../../../dist/esm/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  const cameraTransform = cameraEntity.getTransform();
  cameraTransform.translate = Rn.Vector3.fromCopyArray([0, 4.2, 25]);

  // gltf
  const expression = await Rn.GltfImporter.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/InterpolationTest/glTF-Binary/InterpolationTest.glb',
    {
      cameraComponent: cameraComponent,
    }
  );

  // Lights
  const lightEntity = Rn.EntityHelper.createLightEntity();
  lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([0.9, 0.9, 0.9]);
  lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 10.0, 10.0,
  ]);

  let count = 0;
  Rn.AnimationComponent.globalTime = 0.33;

  const draw = function () {
    if (count > 0) {
      p.id = 'rendered';
      p.innerText = 'Rendered.';
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

    Rn.System.process([expression]);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
