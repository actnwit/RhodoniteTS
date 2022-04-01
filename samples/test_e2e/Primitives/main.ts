import _Rn from '../../../dist/esm/index';
import {checkFinished} from '../common/testHelpers';
import Material from '../../../dist/esm/foundation/materials/core/Material';
import {IMeshEntity} from '../../../dist/esm/foundation/helpers/EntityHelper';
declare const Rn: typeof _Rn;
let p: HTMLParagraphElement | undefined;

(async () => {
  // setup Rhodonite
  const system = await setupRhodonite();

  // setup shape entities
  const group = createGroupOfShapes();

  // setup camera
  createCamera(group);

  // Rendering Loop
  let count = 0;
  system.startRenderLoop(() => {
    [p, count] = checkFinished({p: p!, count});

    system.processAuto();

    count++;
  });
})();

function createGroupOfShapes(): IMeshEntity {
  const group = Rn.EntityHelper.createGroupEntity();

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
    const shape = creator();
    group.getSceneGraph().addChild(shape.getSceneGraph());
  }

  return group as IMeshEntity;
}

function createGrid() {
  const shape = Rn.MeshHelper.createGrid();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);

  return shape;
}

function createPlane() {
  const shape = Rn.MeshHelper.createPlane();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(3, 0, 0);

  return shape;
}

function createCube() {
  const shape = Rn.MeshHelper.createCube();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(0, 3, 0);

  return shape;
}

function createAxis() {
  const shape = Rn.MeshHelper.createAxis();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(0, 6, 0);

  return shape;
}

function createJoint() {
  const shape = Rn.MeshHelper.createJoint();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(3, 3, 0);

  return shape;
}

function createLine() {
  const shape = Rn.MeshHelper.createLine();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(6, 3, 0);

  return shape;
}

function createSphere() {
  const shape = Rn.MeshHelper.createSphere();
  shape.rotate = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.translate = Rn.Vector3.fromCopy3(6, 6, 0);

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

function createCamera(group: IMeshEntity) {
  const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getCameraController().controller.setTarget(group);

  return cameraComponent;
}
