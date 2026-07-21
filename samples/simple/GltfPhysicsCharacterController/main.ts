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

const [vrmExpression, standingIdleVrma, walkVrma, mediumRunVrma, jumpUpVrma, floatingVrma, jumpDownVrma] =
  await Promise.all([
    Rn.GltfImporter.importFromUrl(engine, '../../../assets/vrm/test.vrm', { cameraComponent }),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/Idle.vrma'),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/Walk.vrma'),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/Run.vrma'),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/JumpUp.vrma'),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/Floating.vrma'),
    Rn.VrmaImporter.importFromUrl('../../../assets/vrma/JumpDown.vrma'),
  ]);
const renderPass = vrmExpression.renderPasses[0];
renderPass.toClearColorBuffer = true;
const vrmRoot = renderPass.sceneTopLevelGraphComponents[0].entity;
const vrmaAnimationAssigner = new Rn.AnimationAssigner(engine);
const characterAnimationAssignment = vrmaAnimationAssigner.assignCharacterAnimationsWithVrma(vrmRoot, {
  idle: standingIdleVrma,
  walk: walkVrma,
  run: mediumRunVrma,
  jump: jumpUpVrma,
  fall: floatingVrma,
  landing: jumpDownVrma,
});

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
const walkSpeed = 2.2;
const runSpeed = 4.0;
const characterAnimation = new Rn.CharacterAnimationController(
  characterController,
  vrmRoot,
  characterAnimationAssignment.mapping,
  {
    referenceWalkSpeed: walkSpeed,
    referenceRunSpeed: runSpeed,
    runSpeedThreshold: (walkSpeed + runSpeed) * 0.5,
  }
);

const stageGltf = await Rn.Gltf2Importer.importFromUrl('./stage.gltf');
const stageColliderRoot = await Rn.ModelConverter.convertToRhodoniteObject(engine, stageGltf);
renderPass.addEntities([stageColliderRoot]);
const stageEntities = stageGltf.asset.extras!.rnEntities as Rn.ISceneGraphEntity[];
const gateShape = stageEntities[10].tryToGetShape()!;
gateShape.isShapeGizmoVisible = true;
gizmoRenderPass.addEntities([gateShape.shapeGizmo!.topEntity!]);
const checkpointTrigger = stageEntities[14].tryToGetTrigger()!;
let triggerEvent = 'none';
const triggerEventHistory: string[] = [];
const recordTriggerEvent = (type: string) => {
  triggerEvent = type;
  if (triggerEventHistory.at(-1) !== type) {
    triggerEventHistory.push(type);
    if (triggerEventHistory.length > 8) {
      triggerEventHistory.shift();
    }
  }
};
checkpointTrigger.subscribe('enter', () => {
  recordTriggerEvent('enter');
});
checkpointTrigger.subscribe('stay', () => {
  recordTriggerEvent('stay');
});
checkpointTrigger.subscribe('exit', () => {
  recordTriggerEvent('exit');
});
const motionEventHistory: string[] = [];
const recordMotionEvent = (event: string) => {
  motionEventHistory.push(event);
  if (motionEventHistory.length > 8) {
    motionEventHistory.shift();
  }
};
characterController.subscribe('stateChanged', event => {
  recordMotionEvent(event.current.state);
});
characterController.subscribe('landed', event => {
  recordMotionEvent(`landed:${event.impactSpeed.toFixed(1)}`);
});

const material = Rn.MaterialHelper.createClassicUberMaterial(engine);
const probeMaterial = Rn.MaterialHelper.createClassicUberMaterial(engine);
probeMaterial.setParameter('diffuseColorFactor', Rn.Vector4.fromCopy4(0.2, 1, 0.25, 0.25));
probeMaterial.alphaMode = Rn.AlphaMode.Blend;
const groundProbeVisual = Rn.MeshHelper.createSphere(engine, {
  radius: 0.24,
  material: probeMaterial,
});
const footRayVisual = Rn.MeshHelper.createCylinder(engine, {
  radiusBottom: 0.012,
  radiusTop: 0.012,
  height: 2.5,
  material,
});
const footRayHitVisual = Rn.MeshHelper.createSphere(engine, {
  radius: 0.06,
  material,
});
renderPass.addEntities([groundProbeVisual, footRayVisual, footRayHitVisual]);
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

const gateParts = [
  { size: Rn.Vector3.fromCopy3(0.3, 2, 0.4), position: Rn.Vector3.fromCopy3(-0.9, 1, 0) },
  { size: Rn.Vector3.fromCopy3(0.3, 2, 0.4), position: Rn.Vector3.fromCopy3(0.9, 1, 0) },
  { size: Rn.Vector3.fromCopy3(2.1, 0.2, 0.4), position: Rn.Vector3.fromCopy3(0, 2.1, 0) },
];
const gateVisualRoot = Rn.createGroupEntity(engine);
gateVisualRoot.position = Rn.Vector3.fromCopy3(0, 1.2, -3.5);
for (const part of gateParts) {
  const visual = Rn.MeshHelper.createCube(engine, {
    widthVector: part.size,
    color: Rn.ColorRgba.fromCopy4(0.35, 0.7, 0.8, 1),
    material,
  });
  visual.localPosition = part.position;
  gateVisualRoot.addChild(visual.getSceneGraph());
}
renderPass.addEntities([gateVisualRoot]);

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

// Resolve the initial ground contact and apply idle before the first render.
// Otherwise the first rendered frame can show the VRM rest pose before idle is selected.
for (let step = 0; step < 8 && !characterController.isGrounded; step++) {
  Rn.RapierPhysicsStrategy.update(undefined, 1 / 60, engine);
}
characterAnimation.initialize('idle');

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
  const movementSpeed = pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight') ? runSpeed : walkSpeed;
  characterController.setDesiredHorizontalVelocity(Rn.Vector3.multiply(movement, movementSpeed));

  if (movement.lengthSquared() > 0.0001) {
    characterEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopy3(0, Math.atan2(movement.x, movement.z), 0);
  }

  engine.process([vrmExpression]);
  characterAnimation.update(Rn.Time.intervalProcessBegin);
  const position = characterEntity.position;
  const groundContact = characterController.groundContact;
  groundProbeVisual.position = Rn.Vector3.fromCopy3(position.x, position.y + 0.25, position.z);
  footRayVisual.position = Rn.Vector3.fromCopy3(position.x, position.y - 0.75, position.z);
  if (groundContact != null) {
    footRayHitVisual.position = groundContact.position;
    footRayHitVisual.scale = Rn.Vector3.one();
  } else {
    footRayHitVisual.scale = Rn.Vector3.zero();
  }
  const groundStatus =
    groundContact == null
      ? 'none'
      : `entity ${groundContact.entity.entityUID}, ${groundContact.distance.toFixed(2)}m, ${Rn.MathUtil.radianToDegree(groundContact.slopeAngle).toFixed(1)}deg, ${groundContact.isWalkable ? 'walkable' : 'steep'}`;
  const motionState = characterController.motionState;
  const animationSelection = characterAnimation.selection;
  status.textContent = `State: ${motionState.state} | Animation: ${animationSelection.semantic}/${animationSelection.activeTrack ?? 'none'} ${animationSelection.playbackSpeed.toFixed(2)}x ${animationSelection.hasTrack ? (animationSelection.isFallback ? 'fallback' : 'mapped') : 'no-track'} | Speed: ${motionState.horizontalSpeed.toFixed(2)}, ${motionState.verticalSpeed.toFixed(2)} | Air/Ground: ${motionState.airborneDuration.toFixed(2)}/${motionState.groundedDuration.toFixed(2)}s | Impact: ${motionState.landingImpactSpeed.toFixed(2)} | Events: [${motionEventHistory.join('>')}] | Trigger: ${triggerEvent} (${checkpointTrigger.activeOverlapCount}) [${triggerEventHistory.join('>')}] | Ground: ${groundStatus} | Position: ${position.x.toFixed(
    2
  )}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`;
});
