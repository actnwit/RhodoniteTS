import Rn from '../../../dist/esmdev/index.js';

declare const window: any;

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

const rootEntity = expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;

rootEntity.getSceneGraph().setActiveAnimationTrack('Survey');
rootEntity.getSceneGraph().setSecondActiveAnimationTrack('Run');
rootEntity.getSceneGraph().setAnimationBlendingRatio(0.5);

const slider = document.getElementById('slider') as HTMLInputElement;
slider.addEventListener('input', (e: any) => {
  rootEntity.getSceneGraph().setAnimationBlendingRatio(parseFloat(e.target.value));
});

const endInputValue = 1.16;

Rn.System.startRenderLoop(() => {
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
});
