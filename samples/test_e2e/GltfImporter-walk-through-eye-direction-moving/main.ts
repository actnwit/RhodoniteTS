import _Rn, { WalkThroughCameraController } from '../../../dist/esm/index';

declare const Rn: typeof _Rn;
const p = document.createElement('p');
document.body.appendChild(p);

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');
  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world') as HTMLCanvasElement);

  // expressions
  const expressions = [];

  // camera
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(30.0);
  cameraComponent.aspect = 1.0;

  // gltf
  const gltfImporter = Rn.GltfImporter.getInstance();
  const mainExpression = await gltfImporter.import('../../../assets/gltf/2.0/Triangle/glTF-Embedded/Triangle.gltf', {
    cameraComponent: cameraComponent
  });
  expressions.push(mainExpression);

  // cameraController
  const mainRenderPass = mainExpression.renderPasses[0];
  const mainCameraControllerComponent = cameraEntity.getCameraController();
  mainCameraControllerComponent.type = Rn.CameraControllerType.WalkThrough;
  const controller = mainCameraControllerComponent.controller as WalkThroughCameraController;
  const rootGroup = mainRenderPass.sceneTopLevelGraphComponents[0].entity;
  controller.setTarget(rootGroup);

  // rootGroup.getTransform().scale = new Rn.MutableVector3(0.1, 0.1, 0.1);

  let count = 0;
  let tmpSpeed = controller.horizontalSpeed;

  let mouseUpCount = -10;
  // detect mouseup event by puppeteer
  document.addEventListener('mouseup', function () {
    mouseUpCount = count;
  });

  draw();

  function draw() {
    switch (count) {
      case 1:
        p.id = 'rendered';
        p.innerText = 'rendered.';
        break;
      case mouseUpCount + 1:
        controller.horizontalSpeed = 10;
        document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 81 } as any)); // q key (back)
        break;
      case mouseUpCount + 2:
        controller.horizontalSpeed = 5;
        document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 69 } as any)); // e key (front)
        break;
      case mouseUpCount + 3:
        document.dispatchEvent(new KeyboardEvent('keyup', {} as any));
        controller.horizontalSpeed = tmpSpeed;
        p.id = 'moved';
        p.innerText = 'Moved.';
        break;
    }

    system.process(expressions);

    count++;

    requestAnimationFrame(draw);
  };
})();



