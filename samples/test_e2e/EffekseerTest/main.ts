import EffekseerComponent from '../../../dist/esm/effekseer/EffekseerComponent';
import _Rn from '../../../dist/esm/index';
import {OrbitCameraController} from '../../../dist/esm/index';

let p: any;

declare const window: any;
declare const Rn: typeof _Rn;

(async () => {
  Rn.Config.maxSkeletalBoneNumber = 10;
  // const createSphere = () => {
  //   const entityRepository = Rn.EntityRepository.getInstance();
  //   const entity = entityRepository.createEntity([
  //     Rn.TransformComponent,
  //     Rn.SceneGraphComponent,
  //     Rn.MeshComponent,
  //     Rn.MeshRendererComponent,
  //   ]);

  //   const primitive = new Rn.Sphere();
  //   primitive.generate({
  //     radius: 1,
  //     heightSegments: 20,
  //     widthSegments: 20,
  //   });

  //   const meshComponent = entity.getMesh();
  //   const mesh = new Rn.Mesh();
  //   mesh.addPrimitive(primitive);
  //   meshComponent.setMesh(mesh);
  //   return entity;
  // };

  const moduleManager = Rn.ModuleManager.getInstance();
  await moduleManager.loadModule('webgl');
  await moduleManager.loadModule('pbr');
  const effekseerModule = await moduleManager.loadModule('effekseer', {
    // Comment out for WASM version
    // wasm: '../../../vendor/effekseer.wasm',
  });

  const importer = Rn.Gltf2Importer.getInstance();
  const system = Rn.System.getInstance();
  const gl = system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement,
    0.5
  );

  const entityRepository = Rn.EntityRepository.getInstance();

  // Effekseer
  const effekseerEntity = effekseerModule.createEffekseerEntity();
  const effekseerComponent = effekseerEntity.getComponent(
    effekseerModule.EffekseerComponent
  ) as EffekseerComponent;
  effekseerComponent.playJustAfterLoaded = true;
  effekseerComponent.randomSeed = 1;
  effekseerComponent.isLoop = false;

  // effekseerComponent.isLoop = true;
  effekseerComponent.uri = '../../../assets/effekseer/Laser01.efk';
  // effekseerEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([0, 1.54, 0]);

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

  // 3D Model for Test
  const response = await importer.import(
    '../../../assets/gltf/2.0/BoxAnimated/glTF/BoxAnimated.gltf'
  );
  //const response = await importer.import('../../../assets/gltf/1.0/BrainStem/glTF/BrainStem.gltf');
  const modelConverter = Rn.ModelConverter.getInstance();
  const rootGroup = modelConverter.convertToRhodoniteObject(response);
  // const sphereEntity = createSphere();

  // CameraComponent
  const cameraControllerComponent = cameraEntity.getCameraController();
  const controller =
    cameraControllerComponent.controller as OrbitCameraController;
  controller.setTarget(rootGroup);

  // renderPass
  const renderPass = new Rn.RenderPass();
  renderPass.clearColor = Rn.Vector3.fromCopyArray([0.5, 0.5, 0.5]);
  renderPass.toClearColorBuffer = true;
  // renderPass.addEntities([effekseerEntity]);
  renderPass.addEntities([rootGroup, effekseerEntity]);

  // expression
  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  Rn.CameraComponent.main = 0;
  let count = 0;
  let setTimeDone = false;
  const draw = function () {
    if (count > 0 && window._rendered !== true && setTimeDone) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
      window._rendered = true;
    }
    if (effekseerComponent.isPlay() && !setTimeDone) {
      // const cameraController =
      //   cameraEntity.getCameraController() as unknown as OrbitCameraController;
      // cameraController.rotX = 90;
      // cameraController.rotY = 90;
      effekseerComponent.setTime(0.16);
      setTimeDone = true;
      // effekseerComponent.stop();
      count = 0;
    }

    system.process([expression]);
    count++;

    requestAnimationFrame(draw);
  };

  draw();
})();
