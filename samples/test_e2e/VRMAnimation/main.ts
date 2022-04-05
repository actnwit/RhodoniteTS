import {ICameraControllerEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {



  Rn.Config.maxEntityNumber = 200;
  Rn.Config.maxLightNumberInShader = 1;
  Rn.Config.maxVertexMorphNumberInShader = 1;
  Rn.Config.maxMaterialInstanceForEachType = 30;
  Rn.Config.maxCameraNumber = 3;
  Rn.Config.maxSkeletalBoneNumber = 100;
  Rn.Config.dataTextureWidth = 2 ** 9;
  Rn.Config.dataTextureHeight = 2 ** 10;
  Rn.Config.maxMorphTargetNumber = 1;
  Rn.Config.isUboEnabled = false;

  await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  const gltfImporter = Rn.GltfImporter.getInstance();
  const gltf2Importer = Rn.Gltf2Importer.getInstance();

  // params

  const vrmModelRotation = Rn.Vector3.fromCopyArray([0, Math.PI, 0.0]);

  // camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(50.0);
  cameraComponent.aspect = 1.0;

  // vrm
  const animGltf2ModelPromise = gltf2Importer.import(
    '../../../assets/vrm/test.glb'
  );
  const vrmModelPromise = gltfImporter.importJsonOfVRM(
    '../../../assets/vrm/test.vrm'
  );
  const vrmExpressionPromise = gltfImporter.import(
    '../../../assets/vrm/test.vrm',
    {
      defaultMaterialHelperArgumentArray: [
        {
          isSkinning: true,
          isMorphing: false,
          makeOutputSrgb: true,
        },
      ],
      tangentCalculationMode: 0,
      cameraComponent: cameraComponent,
    }
  );

  const [animGltf2Model, vrmModel, vrmExpression] = await Promise.all([
    animGltf2ModelPromise,
    vrmModelPromise,
    vrmExpressionPromise,
  ]);

  // expresions
  const expressions = [vrmExpression];

  const vrmMainRenderPass = vrmExpression.renderPasses[0];
  vrmMainRenderPass.toClearColorBuffer = true;

  const vrmRootEntity =
    vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
  vrmRootEntity.getTransform().rotate = vrmModelRotation;

  // animation
  const animationAssigner = Rn.AnimationAssigner.getInstance();
  animationAssigner.assignAnimation(vrmRootEntity, animGltf2Model, vrmModel);

  //set default camera
  Rn.CameraComponent.main = 0;

  // camera controller
  const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
  const vrmMainCameraEntity =
    vrmMainCameraComponent.entity as ICameraControllerEntity;
  const vrmMainCameraControllerComponent =
    vrmMainCameraEntity.getCameraController();
  const controller =
    vrmMainCameraControllerComponent.controller as OrbitCameraController;
  controller.dolly = 0.78;
  controller.setTarget(
    vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity
  );

  // Lights
  const lightEntity = Rn.EntityHelper.createLightEntity();
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    0.0,
    0.0,
    Math.PI / 8,
  ]);

  let count = 0;
  let startTime = Date.now();
  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    if (window.isAnimating) {
      const date = new Date();
      const rotation = 0.001 * (date.getTime() - startTime);
      //rotationVec3._v[0] = 0.1;
      //rotationVec3._v[1] = rotation;
      //rotationVec3._v[2] = 0.1;
      const time = (date.getTime() - startTime) / 1000;
      Rn.AnimationComponent.globalTime = time;
      if (time > Rn.AnimationComponent.endInputValue) {
        startTime = date.getTime();
      }
    }

    Rn.System.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
