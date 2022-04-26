import _Rn from '../../../dist/esm/index';
import {
  OrbitCameraController,
  CameraComponent,
  MeshComponent,
  EntityRepository,
  AbstractTexture,
  Expression,
  FrameBuffer,
  RenderPass,
} from '../../../dist/esm/index';

declare const window: any;
declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async function () {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
    rnWebGLDebug: true,
  });

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(25.0);

  // gltf
  const expression = await Rn.GltfImporter.import(
    './../../../assets/gltf/glTF-Sample-Models/2.0/TextureSettingsTest/glTF-Binary/TextureSettingsTest.glb',
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
  const controller =
    cameraControllerComponent.controller as OrbitCameraController;
  const rootGroup =
    expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;
  controller.setTarget(rootGroup);
  controller.dolly = 0.78;

  draw();

  p.id = 'rendered';
  p.innerText = 'Rendered.';

  function draw() {
    Rn.System.process([expression]);
    requestAnimationFrame(draw);
  }
})();
