import Rn from '../../../dist/esmdev/index.js';
import { checkFinished } from '../common/testHelpers.js';
let p: HTMLParagraphElement | undefined;

// setup Rhodonite
const _system = await setupRhodonite();

// setup shape entities
const group = createGroupOfShapes();

// setup camera
createCamera(group);

// Rendering Loop
let count = 0;
Rn.System.startRenderLoop(() => {
  [p, count] = checkFinished({ p: p!, count });

  Rn.System.processAuto();

  count++;
});

function createGroupOfShapes(): Rn.IMeshEntity {
  const group = Rn.createGroupEntity();

  const creators = [createPlane, createGrid, createCube, createAxis, createJoint, createLine, createSphere];
  for (const creator of creators) {
    const shape = creator();
    group.getSceneGraph().addChild(shape.getSceneGraph());
  }

  return group as Rn.IMeshEntity;
}

function createGrid() {
  const shape = Rn.MeshHelper.createGrid();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);

  return shape;
}

function createPlane() {
  const shape = Rn.MeshHelper.createPlane();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(3, 0, 0);

  return shape;
}

function createCube() {
  const shape = Rn.MeshHelper.createCube();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(0, 3, 0);

  return shape;
}

function createAxis() {
  const shape = Rn.MeshHelper.createAxis();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(0, 6, 0);

  return shape;
}

function createJoint() {
  const shape = Rn.MeshHelper.createJoint();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(3, 3, 0);

  return shape;
}

function createLine() {
  const shape = Rn.MeshHelper.createLine();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(6, 3, 0);

  return shape;
}

function createSphere() {
  const shape = Rn.MeshHelper.createSphere();
  shape.localEulerAngles = Rn.Vector3.fromCopy3(90, 0, 0);
  shape.localPosition = Rn.Vector3.fromCopy3(6, 6, 0);

  return shape;
}

async function setupRhodonite() {
  Rn.Config.cgApiDebugConsoleOutput = true;
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });
}

function createCamera(group: Rn.IMeshEntity) {
  const cameraEntity = Rn.createCameraControllerEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 10;
  cameraComponent.setFovyAndChangeFocalLength(90);
  cameraComponent.aspect = 1;

  cameraEntity.getCameraController().controller.setTarget(group);

  return cameraComponent;
}
