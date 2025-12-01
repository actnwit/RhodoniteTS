import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

Rn.Config.isUboEnabled = false;
Rn.Config.cgApiDebugConsoleOutput = true;

async function createCanvasScene(canvas: HTMLCanvasElement) {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: canvas,
  });

  // params
  const vrmModelRotation = Rn.Vector3.fromCopyArray([0, (3 / 4) * Math.PI, 0]);

  // camera
  const cameraEntity = Rn.createCameraControllerEntity(engine, true);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // expresions
  const expressions = [];

  // vrm
  const vrmExpression = await Rn.GltfImporter.importFromUrl(engine, '../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [
      {
        isSkinning: false,
        isMorphing: false,
        makeOutputSrgb: true,
      },
    ],
    tangentCalculationMode: 0,
    cameraComponent: cameraComponent,
  });
  expressions.push(vrmExpression);

  const vrmMainRenderPass = vrmExpression.renderPasses[0];
  vrmMainRenderPass.toClearColorBuffer = true;

  const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
  vrmRootEntity.getTransform().localEulerAngles = vrmModelRotation;

  //set default camera
  Rn.CameraComponent.current = 0;

  // cameraController
  const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
  const vrmMainCameraEntity = vrmMainCameraComponent.entity;
  const vrmMainCameraControllerComponent = vrmMainCameraEntity.tryToGetCameraController();
  const controller = vrmMainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.dolly = 0.8;
  controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);

  // Lights
  const lightEntity = Rn.createLightEntity(engine);
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.color = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0, 0, Math.PI / 8]);

  let count = 0;
  engine.startRenderLoop(() => {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      // const date = new Date();
    }

    engine.process(expressions);

    count++;
  });

  return engine;
}

const engine1 = await createCanvasScene(document.getElementById('world1') as HTMLCanvasElement);
const engine2 = await createCanvasScene(document.getElementById('world2') as HTMLCanvasElement);

window.exportCanvas1ToGltf2 = () => {
  Rn.Gltf2Exporter.export(engine1, 'Rhodonite');
};

window.exportCanvas2ToGltf2 = () => {
  Rn.Gltf2Exporter.export(engine2, 'Rhodonite');
};
