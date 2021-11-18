import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();

  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  const entityRepository = Rn.EntityRepository.getInstance();
  const gltfImporter = Rn.GltfImporter.getInstance();

  // params
  const vrmModelRotation = Rn.Vector3.fromCopyArray([0, (3 / 4) * Math.PI, 0]);

  // camera
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // expresions
  const expressions = [];

  // vrm
  const vrmExpression = await gltfImporter.import(
    '../../../assets/vrm/test.vrm',
    {
      defaultMaterialHelperArgumentArray: [
        {
          isSkinning: false,
          isMorphing: false,
          makeOutputSrgb: true,
        },
      ],
      autoResizeTexture: true,
      tangentCalculationMode: 0,
      cameraComponent: cameraComponent,
    }
  );
  expressions.push(vrmExpression);

  const vrmMainRenderPass = vrmExpression.renderPasses[0];
  vrmMainRenderPass.toClearColorBuffer = true;

  const vrmRootEntity =
    vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
  vrmRootEntity.getTransform().rotate = vrmModelRotation;

  //set default camera
  Rn.CameraComponent.main = 0;

  // cameraController
  const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
  const vrmMainCameraEntity = vrmMainCameraComponent.entity;
  const vrmMainCameraControllerComponent =
    vrmMainCameraEntity.getCameraController();
  const controller =
    vrmMainCameraControllerComponent.controller as OrbitCameraController;
  controller.dolly = 0.8;
  controller.setTarget(
    vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity
  );

  // Lights
  const lightEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.LightComponent,
  ]);
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    0,
    0,
    Math.PI / 8,
  ]);

  let count = 0;
  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      // const date = new Date();
    }

    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  const exporter = Rn.Gltf2Exporter.getInstance();
  exporter.export('Rhodonite');
};
