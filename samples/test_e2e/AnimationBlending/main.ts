import Rn from '../../../dist/esmdev/index.js';
import { getProcessApproach } from '../common/testHelpers.js';

declare const window: any;

const processApproach = getProcessApproach(Rn);
const engine = await Rn.Engine.init({
  approach: processApproach,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});
Rn.Logger.logLevel = Rn.LogLevel.Info;

const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/Fox/glTF-Binary/Fox.glb'
);
// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraController = cameraEntity.getCameraController();
cameraController.controller.setTarget(expression.renderPasses[0].entities[0] as Rn.ISceneGraphEntity);

const light = Rn.createLightEntity(engine);
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

engine.startRenderLoop(() => {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    const currentTime = Rn.AnimationComponent.getGlobalTime(engine);
    Rn.AnimationComponent.setGlobalTime(engine, currentTime + 0.016);
    if (currentTime + 0.016 > endInputValue) {
      Rn.AnimationComponent.setGlobalTime(
        engine,
        currentTime + 0.016 - endInputValue + Rn.AnimationComponent.getStartInputValue(engine)
      );
    }
  }

  engine.process([expression]);

  count++;
});
