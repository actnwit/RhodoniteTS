import _Rn, {WalkThroughCameraController} from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();

  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  // expressions
  const expressions = [];

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
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

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const mainExpression = await gltfImporter.import(
    '../../../assets/gltf/glTF-Sample-Models/2.0/Triangle/glTF-Embedded/Triangle.gltf',
    {
      cameraComponent: cameraComponent,
    } as any
  );
  expressions.push(mainExpression);

  // cameraController
  const mainRenderPass = mainExpression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  mainCameraControllerComponent.type = Rn.CameraControllerType.WalkThrough;
  const controller =
    mainCameraControllerComponent.controller as WalkThroughCameraController;
  controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);

  let count = 0;
  let tmpSpeed = controller.horizontalSpeed;

  const draw = function () {
    switch (count) {
      case 1:
        controller.horizontalSpeed = 10.0;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 83} as any)
        ); // s key
        break;
      case 2:
        controller.horizontalSpeed = 50.0;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 40} as any)
        ); // arrow down key
        break;
      case 3:
        controller.horizontalSpeed = 2;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 65} as any)
        ); // a key
        break;
      case 4:
        controller.horizontalSpeed = 1;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 37} as any)
        ); // arrow left key
        break;
      case 5:
        controller.horizontalSpeed = 20.0;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 87} as any)
        ); // w key
        break;
      case 6:
        controller.horizontalSpeed = 30.0;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 38} as any)
        ); // arrow upper key
        break;
      case 7:
        controller.horizontalSpeed = 0;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 68} as any)
        ); // d key
        break;
      case 8:
        controller.horizontalSpeed = 4;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 39} as any)
        ); // arrow right key
        break;
      case 9:
        controller.horizontalSpeed = tmpSpeed;
        tmpSpeed = controller.verticalSpeed;
        controller.verticalSpeed = 3;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 82} as any)
        ); // r key
        break;
      case 10:
        controller.verticalSpeed = 6;
        document.dispatchEvent(
          new KeyboardEvent('keydown', {keyCode: 70} as any)
        ); // f key
        break;
      case 11:
        controller.verticalSpeed = tmpSpeed;
        document.dispatchEvent(new KeyboardEvent('keyup', {} as any));
        p.id = 'moved';
        p.innerText = 'Moved.';
    }

    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  } as any;

  draw();
})();
