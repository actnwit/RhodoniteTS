import Rn from '../../../dist/esm/index.js';

let p: any;

declare const window: any;

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
    approach: Rn.ProcessApproach.DataTexture,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

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
  const animGltf2ModelPromise = Rn.Gltf2Importer.importFromUri('../../../assets/vrm/test.glb');
  const vrmModelPromise = Rn.Vrm0xImporter.importJsonOfVRM('../../../assets/vrm/test.vrm');
  const vrmExpressionPromise = Rn.GltfImporter.importFromUri('../../../assets/vrm/test.vrm', {
    defaultMaterialHelperArgumentArray: [
      {
        isSkinning: true,
        isMorphing: false,
        makeOutputSrgb: true,
      },
    ],
    tangentCalculationMode: 0,
    cameraComponent: cameraComponent,
  });

  const [animGltf2Result, vrmModelResult, vrmExpressionResult] = await Promise.all([
    animGltf2ModelPromise,
    vrmModelPromise,
    vrmExpressionPromise,
  ]);

  // expresions
  const expressions = [vrmExpressionResult.unwrapForce()];

  const vrmMainRenderPass = vrmExpressionResult.unwrapForce().renderPasses[0];
  vrmMainRenderPass.toClearColorBuffer = true;

  const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
  vrmRootEntity.getTransform().localEulerAngles = vrmModelRotation;

  // animation
  const animationAssigner = Rn.AnimationAssigner.getInstance();
  animationAssigner.assignAnimation(
    vrmRootEntity,
    animGltf2Result.unwrapForce(),
    vrmModelResult.unwrapForce(),
    false
  );

  //set default camera
  Rn.CameraComponent.current = 0;

  // camera controller
  const vrmMainCameraComponent = vrmMainRenderPass.cameraComponent;
  const vrmMainCameraEntity = vrmMainCameraComponent.entity as Rn.ICameraControllerEntity;
  const vrmMainCameraControllerComponent = vrmMainCameraEntity.getCameraController();
  const controller = vrmMainCameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.dolly = 0.78;
  controller.setTarget(vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity);

  // Lights
  const lightEntity = Rn.EntityHelper.createLightEntity();
  const lightComponent = lightEntity.getLight();
  lightComponent.type = Rn.LightType.Directional;
  lightComponent.intensity = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0.0, 0.0, Math.PI / 8]);

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
