import Rn from '../../../dist/esmdev/index.js';
import { checkFinished } from '../common/testHelpers.js';

let p: HTMLParagraphElement | undefined;

// setup Rhodonite
const engine = await setupRhodonite();

// setup shape entities
const group = createGroupOfShapes();

// setup camera
createCamera(group);

// Rendering Loop
let count = 0;
engine.startRenderLoop(() => {
  [p, count] = checkFinished({ p: p!, count });

  engine.processAuto();

  count++;
});

function createGroupOfShapes(): Rn.IMeshEntity {
  const group = Rn.createGroupEntity(engine);

  const creators = [
    createPlane,
    createGrid,
    createCube,
    createAxis,
    createJoint,
    createLine,
    createSphere,
    createCone,
    createRing,
    createCapsule,
  ];
  for (const creator of creators) {
    const shape = creator();
    group.getSceneGraph().addChild(shape.getSceneGraph());
  }

  return group as Rn.IMeshEntity;
}

function createGrid() {
  const shape = Rn.MeshHelper.createGrid(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);

  return shape;
}

function createPlane() {
  const shape = Rn.MeshHelper.createPlane(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(3, 0, 0);

  return shape;
}

function createCube() {
  const shape = Rn.MeshHelper.createCube(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(0, 3, 0);

  return shape;
}

function createAxis() {
  const shape = Rn.MeshHelper.createAxis(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(0, 6, 0);

  return shape;
}

function createJoint() {
  const shape = Rn.MeshHelper.createJoint(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(3, 3, 0);

  return shape;
}

function createLine() {
  const shape = Rn.MeshHelper.createLine(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(6, 3, 0);

  return shape;
}

function createSphere() {
  const shape = Rn.MeshHelper.createSphere(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(6, 6, 0);

  return shape;
}

function createCone() {
  const shape = Rn.MeshHelper.createCone(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(3, 6, 0);

  return shape;
}

function createRing() {
  const shape = Rn.MeshHelper.createRing(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(6, 0, 0);

  return shape;
}

function createCapsule() {
  const shape = Rn.MeshHelper.createCapsule(engine);
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(9, 0, 0);

  return shape;
}

async function setupRhodonite() {
  const engine = await Rn.Engine.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
    config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
  });
  return engine;
}

function createCamera(group: Rn.IMeshEntity) {
  const cameraEntity = Rn.createCameraControllerEntity(engine, true);
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getCameraController().controller.setTarget(group);

  return cameraComponent;
}
