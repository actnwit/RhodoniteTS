import Rn from '../../../dist/esmdev/index.js';

const rapierModulePath = '../../../vendor/rapier3d-compat/rapier.mjs';
const RAPIER = await import(rapierModulePath);
await Rn.RapierPhysicsStrategy.initialize(RAPIER);

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.DataTexture,
  canvas: document.getElementById('world') as HTMLCanvasElement,
  config: new Rn.Config({ cgApiDebugConsoleOutput: true }),
});

const cameraEntity = Rn.createCameraControllerEntity(engine, true);
const cameraComponent = cameraEntity.getCamera();
cameraComponent.zNear = 0.05;
cameraComponent.zFar = 100;
cameraComponent.setFovyAndChangeFocalLength(50);
cameraComponent.aspect = 800 / 600;

const vrmExpression = await Rn.GltfImporter.importFromUrl(engine, '../../../assets/vrm/test.vrm', {
  cameraComponent,
});
const renderPass = vrmExpression.renderPasses[0];
renderPass.toClearColorBuffer = true;
const vrmRoot = renderPass.sceneTopLevelGraphComponents[0].entity;

const characterEntity = Rn.createCharacterControllerEntity(engine);
const vrmAabb = vrmRoot.getSceneGraph().worldMergedAABB;
const vrmFootCenter = Rn.Vector3.fromCopy3(vrmAabb.centerPoint.x, vrmAabb.minPoint.y, vrmAabb.centerPoint.z);
characterEntity.addChild(vrmRoot.getSceneGraph());
vrmRoot.getTransform().localPosition = Rn.Vector3.fromCopy3(
  -vrmAabb.centerPoint.x,
  -vrmAabb.minPoint.y,
  -vrmAabb.centerPoint.z
);
characterEntity.position = Rn.Vector3.fromCopy3(0, 0.05, 4);

const characterController = characterEntity.getCharacterController();
const characterShape = characterEntity.getShape();
const characterShapeIndex = characterShape.addCapsuleFromAabb(vrmAabb, { origin: vrmFootCenter });
characterShape.isShapeGizmoVisible = true;
const gizmoRenderPass = new Rn.RenderPass(engine);
gizmoRenderPass.addEntities([characterShape.shapeGizmo!.topEntity!]);
vrmExpression.addRenderPasses([gizmoRenderPass]);
characterController.setup(new Rn.RapierCharacterControllerStrategy(), {
  shapeIndex: characterShapeIndex,
  maxStepHeight: 0.25,
  minStepWidth: 0.2,
  snapToGroundDistance: 0.15,
});

const stageGltf = await Rn.Gltf2Importer.importFromUrl('./stage.gltf');
const stageColliderRoot = await Rn.ModelConverter.convertToRhodoniteObject(engine, stageGltf);
renderPass.addEntities([stageColliderRoot]);

const material = Rn.MaterialHelper.createClassicUberMaterial(engine);
const floorVisual = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.fromCopy3(12, 0.2, 12),
  color: Rn.ColorRgba.fromCopy4(0.45, 0.5, 0.55, 1),
  material,
});
floorVisual.position = Rn.Vector3.fromCopy3(0, -0.1, 0);
renderPass.addEntities([floorVisual]);

for (let i = 0; i < 6; i++) {
  const step = Rn.MeshHelper.createCube(engine, {
    widthVector: Rn.Vector3.fromCopy3(2, 0.2, 0.5),
    color: Rn.ColorRgba.fromCopy4(0.65, 0.55 + i * 0.03, 0.4, 1),
    material,
  });
  step.position = Rn.Vector3.fromCopy3(0, 0.1 + i * 0.2, 1.5 - i * 0.5);
  renderPass.addEntities([step]);
}

const landing = Rn.MeshHelper.createCube(engine, {
  widthVector: Rn.Vector3.fromCopy3(3, 0.2, 3),
  color: Rn.ColorRgba.fromCopy4(0.65, 0.7, 0.4, 1),
  material,
});
landing.position = Rn.Vector3.fromCopy3(0, 1.1, -2.75);
renderPass.addEntities([landing]);

const cylinderVisual = Rn.MeshHelper.createCylinder(engine, {
  radiusBottom: 0.4,
  radiusTop: 0.4,
  height: 1.5,
  material,
});
cylinderVisual.position = Rn.Vector3.fromCopy3(3, 0.75, 1);
renderPass.addEntities([cylinderVisual]);

const capsuleVisual = Rn.MeshHelper.createCapsule(engine, {
  radius: 0.3,
  height: 1.0,
  material,
});
capsuleVisual.position = Rn.Vector3.fromCopy3(-3, 0.8, 1);
renderPass.addEntities([capsuleVisual]);

const gateBase = Rn.createGroupEntity(engine);
const gateWithShape = engine.entityRepository.addComponentToEntity(Rn.ShapeComponent, gateBase);
const gateEntity = engine.entityRepository.addComponentToEntity(Rn.PhysicsComponent, gateWithShape);
gateEntity.position = Rn.Vector3.fromCopy3(0, 1.2, -3.5);
const gateShape = gateEntity.getShape();
const gateParts = [
  { size: Rn.Vector3.fromCopy3(0.3, 2, 0.4), position: Rn.Vector3.fromCopy3(-0.9, 1, 0) },
  { size: Rn.Vector3.fromCopy3(0.3, 2, 0.4), position: Rn.Vector3.fromCopy3(0.9, 1, 0) },
  { size: Rn.Vector3.fromCopy3(2.1, 0.2, 0.4), position: Rn.Vector3.fromCopy3(0, 2.1, 0) },
];
const gateShapeIndices = gateParts.map(part =>
  gateShape.addShape({ type: 'box', size: part.size }, { position: part.position })
);
const gatePhysics = gateEntity.getPhysics();
gatePhysics.setStrategy(new Rn.RapierPhysicsStrategy());
const gateBindingIds = gateShapeIndices.map(shapeIndex =>
  gatePhysics.bindShape({
    shapeComponent: gateShape,
    shapeIndex,
    body: { move: false, density: 1 },
    collider: { friction: 0.6, restitution: 0 },
  })
);
gatePhysics.updateShapeBinding(gateBindingIds[2], {
  shapeComponent: gateShape,
  shapeIndex: gateShapeIndices[2],
  body: { move: false, density: 1 },
  collider: { friction: 0.7, restitution: 0 },
});
gatePhysics.rebuildShapeBindings();

for (const part of gateParts) {
  const visual = Rn.MeshHelper.createCube(engine, {
    widthVector: part.size,
    color: Rn.ColorRgba.fromCopy4(0.35, 0.7, 0.8, 1),
    material,
  });
  visual.localPosition = part.position;
  gateEntity.addChild(visual.getSceneGraph());
}
gateShape.isShapeGizmoVisible = true;
gizmoRenderPass.addEntities([gateShape.shapeGizmo!.topEntity!]);
renderPass.addEntities([gateEntity]);

const light = Rn.createLightEntity(engine);
light.getLight().type = Rn.LightType.Directional;
light.getLight().intensity = 1.2;
light.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(-0.7, 0.5, 0);

Rn.CameraComponent.setCurrent(engine, cameraComponent.componentSID);
const orbit = cameraEntity.getCameraController().controller as Rn.OrbitCameraController;
orbit.setTarget(characterEntity);
orbit.followTargetAABB = true;
orbit.useInitialTargetAABBForLength = true;
orbit.aabbWithSkeletal = true;
orbit.rotX = 0;
orbit.rotY = -15;
orbit.dolly = 1.8;

const pressedKeys = new Set<string>();
window.addEventListener('keydown', event => {
  pressedKeys.add(event.code);
  if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat) {
      characterController.requestJump();
    }
  }
});
window.addEventListener('keyup', event => pressedKeys.delete(event.code));
window.addEventListener('blur', () => pressedKeys.clear());

const status = document.getElementById('status')!;
const moveSpeed = 2.2;
engine.startRenderLoop(() => {
  const forwardInput =
    Number(pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) -
    Number(pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'));
  const rightInput =
    Number(pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) -
    Number(pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'));

  const cameraForward = Rn.Vector3.subtract(cameraComponent.directionInner, cameraComponent.eyeInner);
  const flatForward = Rn.Vector3.fromCopy3(cameraForward.x, 0, cameraForward.z);
  const forward = flatForward.length() > 0.0001 ? Rn.Vector3.normalize(flatForward) : Rn.Vector3.fromCopy3(0, 0, -1);
  const right = Rn.Vector3.cross(forward, Rn.Vector3.fromCopy3(0, 1, 0));
  let movement = Rn.Vector3.add(Rn.Vector3.multiply(forward, forwardInput), Rn.Vector3.multiply(right, rightInput));
  if (movement.length() > 1) {
    movement = Rn.Vector3.normalize(movement);
  }
  characterController.setDesiredHorizontalVelocity(Rn.Vector3.multiply(movement, moveSpeed));

  if (movement.lengthSquared() > 0.0001) {
    characterEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0, Math.atan2(movement.x, movement.z), 0);
  }

  engine.process([vrmExpression]);
  const position = characterEntity.position;
  status.textContent = `Grounded: ${characterController.isGrounded ? 'yes' : 'no'} | Position: ${position.x.toFixed(
    2
  )}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`;
});
