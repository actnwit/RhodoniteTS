import Rn from '../../../dist/esmdev/index.js';
declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

// camera
const cameraEntity = Rn.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();

const lightEntity = Rn.createLightEntity();
lightEntity.getLight().type = Rn.LightType.Directional;

// gltf
const expression = (
  await Rn.GltfImporter.importFromUri(
    '../../../assets/gltf/glTF-Sample-Assets/Models/AnimatedColorsCube/glTF-Binary/AnimatedColorsCube.glb',
    {
      cameraComponent: cameraComponent,
    }
  )
).unwrapForce();

cameraEntity.getCameraController().controller.setTargets(expression.renderPasses[0].entities as Rn.ISceneGraphEntity[]);

let count = 0;
let startTime = Date.now();

Rn.AnimationComponent.globalTime = 0.05;

Rn.System.startRenderLoop(() => {
  if (count > 0) {
    window._rendered = true;
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
});
