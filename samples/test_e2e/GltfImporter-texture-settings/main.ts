import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

// camera
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(25.0);

// gltf
const expression = await Rn.GltfImporter.importFromUrl(
  engine,
  '../../../assets/gltf/glTF-Sample-Assets/Models/TextureSettingsTest/glTF-Binary/TextureSettingsTest.glb',
  {
    cameraComponent: cameraComponent,
    defaultMaterialHelperArgumentArray: [
      {
        isLighting: false,
      },
    ],
  }
);

const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
const rootGroup = expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;
controller.setTarget(rootGroup);
controller.dolly = 0.78;

p.id = 'rendered';
p.innerText = 'Rendered.';

engine.startRenderLoop(() => {
  engine.process([expression]);
});
