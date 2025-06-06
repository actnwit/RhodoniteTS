import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
const processApproach = getProcessApproach(Rn);
await Rn.System.init({
  approach: processApproach,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

const expression = await Rn.GltfImporter.importFromUrl(
  '../../../assets/gltf/glTF-Sample-Assets/Models/Fox/glTF-Binary/Fox.glb'
);
// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraController = cameraEntity.getCameraController();
cameraController.controller.setTarget(expression.renderPasses[0].entities[0] as Rn.ISceneGraphEntity);

const light = Rn.createLightEntity();
light.getLight().type = Rn.LightType.Directional;

let count = 0;

const rootEntity = expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;

const animationStateComponent = rootEntity.tryToGetAnimationState();
if (animationStateComponent != null) {
  animationStateComponent.setActiveAnimationTrack('Survey');
  animationStateComponent.setSecondActiveAnimationTrack('Run');
  animationStateComponent.setAnimationBlendingRatio(0.5);

  const slider = document.getElementById('slider') as HTMLInputElement;
  slider.addEventListener('input', (e: any) => {
    animationStateComponent.setAnimationBlendingRatio(Number.parseFloat(e.target.value));
  });
}

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
