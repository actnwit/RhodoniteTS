import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  const moduleManager = Rn.ModuleManager.getInstance();
  await moduleManager.loadModule('webgl');
  await moduleManager.loadModule('pbr');
  const effekseerModule = await moduleManager.loadModule('effekseer');

  const importer = Rn.Gltf1Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  const entityRepository = Rn.EntityRepository.getInstance();

  // Effekseer
  const effekseerEntity = effekseerModule.createEffekseerEntity();
  const effekseerComponent = effekseerEntity.getComponent(
    effekseerModule.EffekseerComponent
  );
  effekseerComponent.playJustAfterLoaded = true;
  // effekseerComponent.isLoop = true;
  effekseerComponent.uri = '../../../assets/effekseer/Laser01.efk';
  effekseerEntity.getTransform().rotate = new Rn.Vector3(0, 1.54, 0);
  // Camera
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;
  cameraEntity.getTransform().translate = new Rn.Vector3(0.0, 0, 7);

  // glTF Model
  //  const response = await importer.import('../../../assets/gltf/2.0/Box/glTF/Box.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/BoxTextured/glTF/BoxTextured.gltf');
  //  const response = await importer.import('../../../assets/gltf/2.0/Lantern/glTF/Lantern.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/WaterBottle/glTF/WaterBottle.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.gltf');
  //const response = await importer.import('../../../assets/gltf/2.0/VC/glTF/VC.gltf');
  //  const response = await importer.import('../../../assets/gltf/2.0/Buggy/glTF/Buggy.gltf');
  //  const response = await importer.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
  // const response = await importer.import('../../../assets/gltf/2.0/ReciprocatingSaw/glTF/ReciprocatingSaw.gltf');
  // const response = await importer.import('../../../assets/gltf/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf');
  const response = await importer.import(
    '../../../assets/gltf/1.0/BoxAnimated/glTF/BoxAnimated.gltf'
  );
  //const response = await importer.import('../../../assets/gltf/2.0/BrainStem/glTF/BrainStem.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  //rootGroup.getTransform().translate = new Rn.Vector3(1.0, 0, 0);
  rootGroup.getTransform().rotate = new Rn.Vector3(0, 1.0, 0.0);

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller = cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(rootGroup);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.clearColor = new Rn.Vector3(0.5, 0.5, 0.5);
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
