import Entity, {IEntity} from '../../../dist/esm/foundation/core/Entity';
import _Rn from '../../../dist/esm/index';
import {checkFinished} from '../common/testHelpers';
import CameraComponent from '../../../dist/esm/foundation/components/CameraComponent';
import Material from '../../../dist/esm/foundation/materials/core/Material';
declare const Rn: typeof _Rn;
let p: HTMLParagraphElement | undefined;

(async () => {
  // setup Rhodonite
  const system = await setupRhodonite();

  // setup shape entities
  const group = createGroupOfShapes();
  const entities = [group];

  // setup camera
  const cameraComponent = createCamera(group);

  // setup render pass and expression
  const expression = new Rn.Expression();
  const renderPass = createRenderPassSpecifyingCameraComponent(cameraComponent);
  renderPass.addEntities(entities);
  expression.addRenderPasses([renderPass]);

  // Rendering Loop
  let count = 0;
  system.startRenderLoop(() => {
    [p, count] = checkFinished({p: p!, count});

    system.process([expression]);

    count++;
  });
})();

function createGroupOfShapes(): IEntity {
  const group = Rn.EntityHelper.createGroupEntity();
  const material = Rn.MaterialHelper.createClassicUberMaterial();
  material.cullFace = false;

  const creators = [
    createPlane,
    createGrid,
    createCube,
    createAxis,
    createJoint,
    createLine,
    createSphere,
  ];
  for (const creator of creators) {
    const shape = creator(material);
    group.getSceneGraph().addChild(shape.getSceneGraph());
  }

  return group;
}

function createGrid(material: Material) {
  const primitive = new Rn.Grid();
  primitive.generate({
    length: 1,
    division: 5,
    isXZ: true,
    isXY: true,
    isYZ: true,
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);

  return shape;
}

function createPlane(material: Material) {
  const primitive = new Rn.Plane();
  primitive.generate({
    width: 1,
    height: 1,
    uSpan: 5,
    vSpan: 5,
    isUVRepeat: false,
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(3, 0, 0);

  return shape;
}

function createCube(material: Material) {
  const primitive = new Rn.Cube();
  primitive.generate({
    widthVector: Rn.Vector3.fromCopy3(1, 1, 1),
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(0, 3, 0);

  return shape;
}

function createAxis(material: Material) {
  const primitive = new Rn.Axis();
  primitive.generate({
    length: 1,
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(0, 6, 0);

  return shape;
}

function createJoint(material: Material) {
  const primitive = new Rn.Joint();
  primitive.generate({
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(3, 3, 0);

  return shape;
}

function createLine(material: Material) {
  const primitive = new Rn.Line();
  primitive.generate({
    startPos: Rn.Vector3.fromCopy3(0, 0, 0),
    endPos: Rn.Vector3.fromCopy3(1, 0, 0),
    hasTerminalMark: true,
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(6, 3, 0);

  return shape;
}

function createSphere(material: Material) {
  const primitive = new Rn.Sphere();
  primitive.generate({
    radius: 1,
    widthSegments: 10,
    heightSegments: 10,
    material,
  });
  const shape = Rn.MeshHelper.createShape(primitive);
  shape.getTransform().rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.getTransform().translate = Rn.Vector3.fromCopy3(6, 6, 0);

  return shape;
}

async function setupRhodonite() {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  await Rn.ModuleManager.getInstance().loadModule('pbr');

  const system = Rn.System.getInstance();
  system.setProcessApproachAndCanvas(
    Rn.ProcessApproach.UniformWebGL1,
    document.getElementById('world') as HTMLCanvasElement
  );

  return system;
}

function createCamera(group: Entity) {
  const cameraComponent = createCameraComponent();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1; // depthCameraComponent.direction = lightDirection;
  const cameraEntity = cameraComponent.entity;
  // cameraEntity.getTransform().translate = Rn.Vector3.fromCopy3(0.2, 0.35, -0.5);

  cameraEntity.getCameraController().controller.setTarget(group);

  return cameraComponent;
}

function createCameraComponent() {
  const entityRepository = Rn.EntityRepository.getInstance();
  const cameraEntity = entityRepository.createEntity([
    Rn.TransformComponent,
    Rn.SceneGraphComponent,
    Rn.CameraComponent,
    Rn.CameraControllerComponent,
  ]);
  // For debug
  // const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
  const cameraComponent = cameraEntity.getCamera();
  return cameraComponent;
}

function createRenderPassSpecifyingCameraComponent(
  cameraComponent: CameraComponent
) {
  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = true;
  renderPass.clearColor = Rn.Vector4.fromCopy4(0, 0, 0, 1);
  renderPass.cameraComponent = cameraComponent;
  return renderPass;
}
