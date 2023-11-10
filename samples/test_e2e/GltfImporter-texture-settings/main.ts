import Rn from '../../../dist/esmdev/index.js';

declare const window: any;
const p = document.createElement('p');
document.body.appendChild(p);

await Rn.System.init({
  approach: Rn.ProcessApproach.Uniform,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  rnWebGLDebug: true,
});

// camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zFar = 1000.0;
cameraComponent.setFovyAndChangeFocalLength(25.0);

// gltf
const expression = (
  await Rn.GltfImporter.importFromUri(
    './../../../assets/gltf/glTF-Sample-Models/2.0/TextureSettingsTest/glTF-Binary/TextureSettingsTest.glb',
    {
      cameraComponent: cameraComponent,
      defaultMaterialHelperArgumentArray: [
        {
          isLighting: false,
        },
      ],
    }
  )
).unwrapForce();

const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
const rootGroup = expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;
controller.setTarget(rootGroup);
controller.dolly = 0.78;

p.id = 'rendered';
p.innerText = 'Rendered.';
window._rendered = true;

Rn.System.startRenderLoop(() => {
  Rn.System.process([expression]);
});
