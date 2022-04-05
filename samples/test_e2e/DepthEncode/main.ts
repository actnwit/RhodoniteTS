import _Rn from '../../../dist/esm/index';
declare const Rn: typeof _Rn;
let p: any;

(async () => {
  await Rn.System.init({
    approach: Rn.ProcessApproach.UniformWebGL1,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // camera
  const cameraComponent = createCameraComponent();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1; // depthCameraComponent.direction = lightDirection;
  const cameraEntity = cameraComponent.entity;
  cameraEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.2, 0.35, -0.5,
  ]);

  // render pass and expression
  const renderPass = createRenderPassSpecifyingCameraComponent(cameraComponent);

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  // entities
  const smallBoardEntity = createBoardEntityWithDepthEncodeMaterial();
  const largeBoardEntity = createBoardEntityWithDepthEncodeMaterial();

  renderPass.addEntities([smallBoardEntity, largeBoardEntity]);

  smallBoardEntity.getTransform().scale = Rn.Vector3.fromCopyArray([
    0.2, 0.2, 0.2,
  ]);
  smallBoardEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0.0, 0.0, -1.0,
  ]);
  smallBoardEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    0,
  ]);

  largeBoardEntity.getTransform().translate = Rn.Vector3.fromCopyArray([
    0, 0, -1.5,
  ]);
  largeBoardEntity.getTransform().rotate = Rn.Vector3.fromCopyArray([
    Math.PI / 2,
    0,
    0,
  ]);

  // For debug
  // const cameraControllerComponent = cameraEntity.getCameraController();
  // const controller = cameraControllerComponent.controller as OrbitCameraController;
  // controller.dolly = 0.65;
  // controller.setTarget(largeBoardEntity);

  let count = 0;

  const draw = function () {
    if (p == null && count > 0) {
      p = document.createElement('p');
      p.setAttribute('id', 'rendered');
      p.innerText = 'Rendered.';
      document.body.appendChild(p);
    }

    Rn.System.process([expression]);

    count++;
    requestAnimationFrame(draw);
  };

  draw();
})();

function createBoardEntityWithDepthEncodeMaterial() {
  const entity = Rn.EntityHelper.createMeshEntity();

  const primitive = new Rn.Plane();
  primitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material: Rn.MaterialHelper.createDepthEncodeMaterial({}),
  });

  const meshComponent = entity.getMesh();
  const mesh = new Rn.Mesh();
  mesh.addPrimitive(primitive);
  meshComponent.setMesh(mesh);
  return entity;
}

function createCameraComponent() {
  const cameraEntity = Rn.EntityHelper.createCameraEntity();
  // For debug
  // const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
  const cameraComponent = cameraEntity.getCamera();
  return cameraComponent;
}

function createRenderPassSpecifyingCameraComponent(cameraComponent) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.cameraComponent = cameraComponent;
  return renderPass;
}
