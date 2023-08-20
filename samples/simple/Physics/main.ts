import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

const gl = await Rn.System.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

const ground = Rn.MeshHelper.createCube({
  widthVector: Rn.Vector3.fromCopyArray([20, 0.2, 20]),
  color: Rn.ColorRgba.fromCopy4(0.5, 0.5, 0.5, 1),
  physics: {
    use: true,
    move: false,
    density: 1,
    friction: 0.5,
    restitution: 0.2,
  },
});

function createCube(i: number) {
  const cube = Rn.MeshHelper.createCube({
    widthVector: Rn.Vector3.fromCopyArray([1, 1, 1]),
    color: Rn.ColorRgba.fromCopy4(1.0, 0.5, 0.5, 1),
    physics: {
      use: true,
      move: true,
      density: 1,
      friction: 0.5,
      restitution: 0.2,
    },
  });

  cube.position = Rn.Vector3.fromCopyArray([-1, i + 5, 0]);
  cube.eulerAngles = Rn.Vector3.fromCopyArray([Math.random(), 0, Math.random()]);
  (cube.tryToGetPhysics()!.strategy as Rn.OimoPhysicsStrategy).setPosition(cube.position);
  (cube.tryToGetPhysics()!.strategy as Rn.OimoPhysicsStrategy).setEulerAngle(cube.eulerAngles);
}

function createSphere(i: number) {
  const cube = Rn.MeshHelper.createSphere({
    radius: 1,
    widthSegments: 10,
    heightSegments: 10,
    physics: {
      use: true,
      move: true,
      density: 1,
      friction: 0.5,
      restitution: 0.2,
    },
  });

  cube.position = Rn.Vector3.fromCopyArray([5 * Math.random(), i + 5, 5 * Math.random()]);
  cube.eulerAngles = Rn.Vector3.fromCopyArray([Math.random(), 0, Math.random()]);
  (cube.tryToGetPhysics()!.strategy as Rn.OimoPhysicsStrategy).setPosition(cube.position);
  (cube.tryToGetPhysics()!.strategy as Rn.OimoPhysicsStrategy).setEulerAngle(cube.eulerAngles);
}

for (let i = 0; i < 250; i++) {
  createCube(i);
}
for (let i = 0; i < 50; i++) {
  createSphere(i);
}

const lightEntity = Rn.EntityHelper.createLightEntity();

// Camera
const cameraEntity = Rn.EntityHelper.createCameraControllerEntity();
const cameraComponent = cameraEntity.getCamera();
//cameraComponent.type = Rn.CameraTyp]e.Orthographic;
cameraComponent.zNear = 0.1;
cameraComponent.zFar = 1000;
cameraComponent.setFovyAndChangeFocalLength(90);
cameraComponent.aspect = 1;

cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0, 0.5]);

// CameraComponent
const cameraControllerComponent = cameraEntity.getCameraController();
const controller = cameraControllerComponent.controller as Rn.OrbitCameraController;
controller.setTarget(ground);

Rn.CameraComponent.current = 0;
let startTime = Date.now();
let count = 0;

Rn.System.startRenderLoop(() => {
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
    //rootGroup.getTransform().localPosition = rootGroup.getTransform().localPosition;
  }

  Rn.System.processAuto();
  count++;
});
