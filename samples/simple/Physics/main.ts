import Rn from '../../../dist/esmdev/index.js';

let p: any;

declare const window: any;

Rn.Config.cgApiDebugConsoleOutput = true;
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
  material: Rn.MaterialHelper.createClassicUberMaterial(),
});

function createCubes(numberToCreate: number) {
  const cubes = Rn.MeshHelper.createCubes(numberToCreate, {
    widthVector: Rn.Vector3.fromCopyArray([1, 1, 1]),
    color: Rn.ColorRgba.fromCopy4(1.0, 0.5, 0.5, 1),
    physics: {
      use: true,
      move: true,
      density: 1,
      friction: 0.5,
      restitution: 0.2,
    },
    material: Rn.MaterialHelper.createClassicUberMaterial(),
  });

  for (let i = 0; i < numberToCreate; i++) {
    const cube = cubes[i];
    cube.position = Rn.Vector3.fromCopyArray([
      5 * Math.random() - 2.5,
      i + 5,
      5 * Math.random() - 2.5,
    ]);
    cube.eulerAngles = Rn.Vector3.fromCopyArray([Math.random(), 0, Math.random()]);
  }
  return cubes;
}

function createSpheres(numberToCreate: number) {
  const spheres = Rn.MeshHelper.createSpheres(numberToCreate, {
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

  for (let i = 0; i < numberToCreate; i++) {
    const sphere = spheres[i];
    sphere.scale = Rn.Vector3.fromCopyArray([1, Math.random() + 0.2, 1]);
    sphere.position = Rn.Vector3.fromCopyArray([
      5 * Math.random() - 2.5,
      i + 5,
      5 * Math.random() - 2.5,
    ]);
    sphere.eulerAngles = Rn.Vector3.fromCopyArray([Math.random(), 0, Math.random()]);
  }
  return spheres;
}

const entities = [];
Array.prototype.push.apply(entities, createCubes(2000));
Array.prototype.push.apply(entities, createSpheres(1000));
Array.prototype.push.apply(entities, [ground]);

const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass();
expression.addRenderPasses([renderPass]);
renderPass.addEntities(entities);

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
const startTime = Date.now();
let count = 0;

Rn.System.startRenderLoop(() => {
  if (p == null && count > 0) {
    p = document.createElement('p');
    p.setAttribute('id', 'rendered');
    p.innerText = 'Rendered.';
    document.body.appendChild(p);
  }

  for (const entity of entities) {
    if (entity.position.y < -40) {
      entity.position = Rn.Vector3.fromCopyArray([
        2 * Math.random() - 1,
        80 + Math.random() * 10,
        2 * Math.random() - 1,
      ]);
    }
  }
  Rn.System.process([expression]);

  count++;
});
