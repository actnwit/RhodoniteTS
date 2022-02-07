import _Rn, {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.FastestWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  // Camera
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  //cameraComponent.type = Rn.CameraTyp]e.Orthographic;
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(45);
  cameraComponent.aspect = 1;

  cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0, 0.5,
  ]);

  // Lights
  // const lightEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.LightComponent])
  // lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([1.0, 100000.0, 1.0]);
  // lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
  const lightEntity = Rn.EntityHelper.createLightEntity();
  lightEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    1.0, 1.0, 100000.0,
  ]);
  lightEntity.getLight().intensity = Rn.Vector3.fromCopyArray([1, 1, 1]);
  lightEntity.getLight().type = Rn.LightType.Directional;
  lightEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    0,
  ]);
  //lightEntity2.getTransform().rotate = Rn.Vector3.fromCopyArray([Math.PI/2, 0, 0]);
  //lightEntity2.getLight().type = Rn.LightType.Directional;

  //  const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/Box/glTF/Box.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/BoxTextured/glTF/BoxTextured.gltf');
  //  const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/Lantern/glTF/Lantern.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/WaterBottle/glTF/WaterBottle.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/VC/glTF/VC.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/GearboxAssy/glTF/GearboxAssy.gltf');
  // const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/Buggy/glTF/Buggy.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
  //  const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
  //  const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/Duck/glTF/Duck.gltf');
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/Avocado/glTF/Avocado.gltf');
  const response = await importer.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/BoxAnimated/glTF/BoxAnimated.gltf'
  );
  //const response = await importer.import('../../../assets/gltf/glTF-Sample-Models/1.0/BrainStem/glTF/BrainStem.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = Rn.Vector3.fromCopyArray([1.0, 0, 0]);
  //  rootGroup.getTransform().rotate = Rn.Vector3.fromCopyArray([0, 1.0, 0.0]);
  //  rootGroup.getTransform().scale = Rn.Vector3.fromCopyArray([0.01, 0.01, 0.01]);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(rootGroup);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.addEntities([rootGroup]);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.main = 0;
  let startTime = Date.now();
  const rotationVec3 = Rn.MutableVector3.one();
  let count = 0;
  const draw = function () {
    if (p == null && count > 0) {
      if (response != null) {
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

    system.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();
