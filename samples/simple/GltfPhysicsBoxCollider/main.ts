import Rn from '../../../dist/esmdev/index.js';

const rapierModulePath = '../../../vendor/rapier3d-compat/rapier.mjs';
const RAPIER = await import(rapierModulePath);
await Rn.RapierPhysicsStrategy.initialize(RAPIER);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

const floorGltf = await Rn.Gltf2Importer.importFromUrl('./floor.gltf');
const colliderRoot = await Rn.ModelConverter.convertToRhodoniteObject(engine, floorGltf);

// KHR_implicit_shapes does not define renderable geometry, so the sample uses
// a separate visual mesh with the same dimensions as the imported collider.
const visualFloor = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.fromCopy3(20, 0.2, 20),
  color: Rn.ColorRgba.fromCopy4(0.5, 0.5, 0.5, 1),
  material: Rn.MaterialHelper.createClassicUberMaterial(engine),
});
visualFloor.position = Rn.Vector3.fromCopy3(0, -0.1, 0);

const fallingCube = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.one(),
  color: Rn.ColorRgba.fromCopy4(1, 0.4, 0.2, 1),
  physics: {
    use: true,
    engine: 'rapier',
    move: true,
    density: 1,
    friction: 0.6,
    restitution: 0,
  },
  material: Rn.MaterialHelper.createClassicUberMaterial(engine),
});
fallingCube.position = Rn.Vector3.fromCopy3(0, 4, 0);

const expression = new Rn.Expression();
const renderPass = new Rn.RenderPass(engine);
expression.addRenderPasses([renderPass]);
renderPass.addEntities([colliderRoot, visualFloor, fallingCube]);

Rn.createLightEntity(engine);
const cameraEntity = Rn.createCameraControllerEntity(engine, true);
cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopy3(0, 0, 1);
const cameraController = cameraEntity.getCameraController().controller as Rn.OrbitCameraController;
cameraController.setTarget(visualFloor);
cameraController.rotX = 30;
cameraController.rotY = -25;
cameraController.dolly = 0.8;

let frameCount = 0;
engine.startRenderLoop(() => {
  engine.process([expression]);
  if (frameCount++ === 30) {
    const rendered = document.createElement('p');
    rendered.id = 'rendered';
    rendered.textContent = 'Rendered.';
    document.body.appendChild(rendered);
  }
});
