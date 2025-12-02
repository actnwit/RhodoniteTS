import Rn from '../../../dist/esmdev/index.js';
declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();

const lightEntity = Rn.createLightEntity(engine);
lightEntity.getLight().type = Rn.LightType.Directional;

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/AnimatedColorsCube/glTF-Binary/AnimatedColorsCube.glb',
  {
    cameraComponent: cameraComponent,
  }
);

cameraEntity.getCameraController().controller.setTargets(expression.renderPasses[0].entities as Rn.ISceneGraphEntity[]);

let count = 0;
let startTime = Date.now();

Rn.AnimationComponent.setGlobalTime(engine, 0.05);

engine.startRenderLoop(() => {
  if (count > 0) {
    window._rendered = true;
  }

  if (window.isAnimating) {
    const date = new Date();
    const time = (date.getTime() - startTime) / 1000;
    Rn.AnimationComponent.setGlobalTime(engine, time);
    if (time > Rn.AnimationComponent.getEndInputValue(engine)) {
      startTime = date.getTime();
    }
  }

  engine.process([expression]);

  count++;
});
