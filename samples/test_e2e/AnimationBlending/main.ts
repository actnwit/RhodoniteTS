import Rn from '../../../dist/esmdev/index.js';
let p: any;
declare const window: any;

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const expression = (
    await Rn.GltfImporter.importFromUri(
      '../../../assets/gltf/glTF-Sample-Models/2.0/Fox/glTF-Binary/Fox.glb'
    )
  ).unwrapForce();
  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraController = cameraEntity.getCameraController();
  cameraController.controller.setTarget(
    expression.renderPasses[0].entities[0] as Rn.ISceneGraphEntity
  );

  const light = Rn.EntityHelper.createLightEntity();
  light.getLight().type = Rn.LightType.Directional;

  let count = 0;

  Rn.AnimationComponent.setActiveAnimationsForAll('Survey', 'Run', 0.5);
  const slider = document.getElementById('slider') as HTMLInputElement;
  slider.addEventListener('input', (e: any) => {
    Rn.AnimationComponent.setActiveAnimationsForAll('Survey', 'Run', parseFloat(e.target.value));
  });

  const endInputValue = 1.16;
  const draw = function () {
    if (count > 0) {
      window._rendered = true;
    }

    if (window.isAnimating) {
      Rn.AnimationComponent.globalTime += 0.016;
      if (Rn.AnimationComponent.globalTime > endInputValue) {
        Rn.AnimationComponent.globalTime -= endInputValue - Rn.AnimationComponent.startInputValue;
      }
    }

    Rn.System.process([expression]);

    count++;
    requestAnimationFrame(draw);
  };

  draw();
})();
