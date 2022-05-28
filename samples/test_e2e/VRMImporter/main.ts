import Rn from '../../../dist/esm/index.mjs';

let p: HTMLParagraphElement | undefined;

declare const window: any;

(async () => {
  const gl = await Rn.System.init({
    approach: Rn.ProcessApproach.FastestWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(50);
  cameraComponent.aspect = 1;

  cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0, 0.5,
  ]);

  // Lights
  // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  // lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([1.0, 100000.0, 1.0]);
  // lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
  const lightEntity2 = Rn.EntityHelper.createLightEntity();
  const lightComponent2 = lightEntity2.getLight();
  lightComponent2.type = Rn.LightType.Directional;
  lightComponent2.intensity = Rn.Vector3.fromCopyArray([1.0, 1.0, 1.0]);
  lightEntity2.getTransform().rotate = Rn.Vector3.fromCopyArray([
    0.0,
    0.0,
    Math.PI / 8,
  ]);
  //lightEntity2.getTransform().rotate = Rn.Vector3.fromCopyArray([Math.PI/2, 0, 0]);
  //lightEntity2.getLight().type = Rn.LightType.Directional;

  const rootGroups = await Rn.VrmImporter.import(
    '../../../assets/vrm/test.vrm',
    {
      defaultMaterialHelperArgumentArray: [{isLighting: true}],
      tangentCalculationMode: 0,
    }
  );
  //rootGroup.getTransform().translate = Rn.Vector3.fromCopyArray([1.0, 0, 0]);

  for (const rootGroup of rootGroups) {
    rootGroup.getTransform().rotate = Rn.Vector3.fromCopyArray([
      0,
      Math.PI,
      0.0,
    ]);
  }

  //  rootGroup.getTransform().scale = Rn.Vector3.fromCopyArray([0.01, 0.01, 0.01]);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    cameraControllerComponent.controller as Rn.OrbitCameraController;
  controller.setTarget(rootGroups[0]);
  controller.dolly = 0.78;

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities(rootGroups);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.current = 0;
  let count = 0;
  let startTime = Date.now();
  const draw = function () {
    if (p == null && count > 0) {
      if (rootGroups[0] != null) {
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 600, 600);
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

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
      //console.log(time);
      //      rootGroup.getTransform().scale = rotationVec3;
      //rootGroup.getTransform().translate = rootGroup.getTransform().translate;
    }

    Rn.System.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();

window.exportGltf2 = function () {
  Rn.Gltf2Exporter.export('Rhodonite');
};
