import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Quaternion, Vector3 } from '../../math';
import { RapierCharacterControllerStrategy } from './RapierCharacterControllerStrategy';
import {
  type RapierCharacterControllerLike,
  type RapierPhysicsModuleLike,
  RapierPhysicsStrategy,
  type RapierVector3Like,
} from './RapierPhysicsStrategy';

class FakeBodyDesc {
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };
  setTranslation(x: number, y: number, z: number) {
    this.translation = { x, y, z };
    return this;
  }
  setRotation(rotation: { x: number; y: number; z: number; w: number }) {
    this.rotation = { ...rotation };
    return this;
  }
}

class FakeColliderDesc {
  handle?: number;
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };
  constructor(
    readonly halfHeight: number,
    readonly radius: number
  ) {}
  setTranslation(x: number, y: number, z: number) {
    this.translation = { x, y, z };
    return this;
  }
  setRotation(rotation: { x: number; y: number; z: number; w: number }) {
    this.rotation = { ...rotation };
    return this;
  }
}

class FakeBody {
  current: RapierVector3Like;
  currentRotation: { x: number; y: number; z: number; w: number };
  next?: RapierVector3Like;
  nextRotation?: { x: number; y: number; z: number; w: number };
  constructor(desc: FakeBodyDesc) {
    this.current = { ...desc.translation };
    this.currentRotation = { ...desc.rotation };
  }
  translation() {
    return this.current;
  }
  rotation() {
    return this.currentRotation;
  }
  setTranslation(value: RapierVector3Like) {
    this.current = { ...value };
  }
  setRotation(rotation: { x: number; y: number; z: number; w: number }) {
    this.currentRotation = { ...rotation };
  }
  setNextKinematicTranslation(value: RapierVector3Like) {
    this.next = { ...value };
  }
  setNextKinematicRotation(rotation: { x: number; y: number; z: number; w: number }) {
    this.nextRotation = { ...rotation };
  }
}

class FakeCharacterController implements RapierCharacterControllerLike {
  movement = { x: 0, y: 0, z: 0 };
  grounded = false;
  autostep?: [number, number, boolean];
  snapDistance?: number;
  climbAngle?: number;
  slideAngle?: number;
  applyImpulses?: boolean;
  normalNudgeFactor?: number;
  forceAirborneStuck = false;
  forceAirborne = false;
  enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean) {
    this.autostep = [maxHeight, minWidth, includeDynamicBodies];
  }
  enableSnapToGround(distance: number) {
    this.snapDistance = distance;
  }
  setMaxSlopeClimbAngle(angle: number) {
    this.climbAngle = angle;
  }
  setMinSlopeSlideAngle(angle: number) {
    this.slideAngle = angle;
  }
  setApplyImpulsesToDynamicBodies(enabled: boolean) {
    this.applyImpulses = enabled;
  }
  setNormalNudgeFactor(value: number) {
    this.normalNudgeFactor = value;
  }
  computeColliderMovement(_collider: unknown, desired: RapierVector3Like) {
    if (this.forceAirborneStuck && desired.y < 0) {
      this.grounded = false;
      this.movement = { x: 0, y: 0, z: 0 };
      return;
    }
    if (this.forceAirborne) {
      this.grounded = false;
      this.movement = { ...desired };
      return;
    }
    this.grounded = desired.y <= 0;
    this.movement = { x: desired.x, y: this.grounded ? 0 : desired.y, z: desired.z };
  }
  computedMovement() {
    return this.movement;
  }
  computedGrounded() {
    return this.grounded;
  }
  numComputedCollisions() {
    return this.forceAirborneStuck ? 1 : 0;
  }
  computedCollision() {
    return this.forceAirborneStuck ? { normal1: { x: 1, y: 0, z: 0 } } : null;
  }
}

class FakeWorld {
  body?: FakeBody;
  collider?: FakeColliderDesc;
  controller?: FakeCharacterController;
  stepCount = 0;
  removedBodies = 0;
  removedControllers = 0;
  colliders: FakeColliderDesc[] = [];
  rayHitNormal = { x: 0, y: 1, z: 0 };
  constructor(_gravity: RapierVector3Like) {
    world = this;
  }
  createRigidBody(desc: FakeBodyDesc) {
    this.body = new FakeBody(desc);
    return this.body;
  }
  createCollider(desc: FakeColliderDesc) {
    desc.handle = this.colliders.length;
    this.colliders.push(desc);
    this.collider = desc;
    return desc;
  }
  createCharacterController(_offset: number) {
    this.controller = new FakeCharacterController();
    return this.controller;
  }
  removeCharacterController() {
    this.removedControllers++;
  }
  removeRigidBody() {
    this.removedBodies++;
  }
  step() {
    this.stepCount++;
    if (this.body?.next != null) {
      this.body.current = { ...this.body.next };
    }
    if (this.body?.nextRotation != null) {
      this.body.currentRotation = { ...this.body.nextRotation };
    }
  }
  castShape(
    _origin: RapierVector3Like,
    _rotation: unknown,
    _direction: RapierVector3Like,
    _shape: unknown,
    _targetDistance: number,
    _maxToi: number,
    _stopAtPenetration: boolean,
    _filterFlags?: number,
    _filterGroups?: number,
    _excludeCollider?: FakeColliderDesc,
    _excludeRigidBody?: FakeBody,
    predicate?: (collider: FakeColliderDesc) => boolean
  ) {
    const collider = this.colliders.find(candidate => predicate?.(candidate) ?? true);
    return collider == null
      ? null
      : {
          collider,
          time_of_impact: 0.02,
          normal1: this.rayHitNormal,
          witness1: { x: 0, y: 0, z: 0 },
          normal2: { x: -this.rayHitNormal.x, y: -this.rayHitNormal.y, z: -this.rayHitNormal.z },
          witness2: { x: 0, y: -0.25, z: 0 },
        };
  }
}

let world: FakeWorld;

function fakeRapier(): RapierPhysicsModuleLike {
  return {
    World: FakeWorld,
    RigidBodyDesc: {
      dynamic: () => new FakeBodyDesc(),
      fixed: () => new FakeBodyDesc(),
      kinematicPositionBased: () => new FakeBodyDesc(),
    },
    ColliderDesc: {
      cuboid: () => new FakeColliderDesc(0, 0),
      ball: () => new FakeColliderDesc(0, 0),
      capsule: (halfHeight, radius) => new FakeColliderDesc(halfHeight, radius),
    },
    Ball: class {
      constructor(readonly radius: number) {}
    },
    QueryFilterFlags: { EXCLUDE_SENSORS: 8 },
  };
}

function fakeEntity(rotation = Quaternion.identity(), scale = Vector3.one()) {
  const state = { position: Vector3.fromCopy3(0, 0, 0), rotation, scale };
  const entity = {
    entityUID: nextEntityUID++,
    getSceneGraph: () => ({
      get position() {
        return state.position;
      },
      get scale() {
        return state.scale;
      },
      getQuaternionRecursively: () => state.rotation,
      setPositionWithoutPhysics(position: Vector3) {
        state.position = position;
      },
    }),
  } as unknown as ISceneGraphEntity;
  return { entity, state };
}

let nextEntityUID = 1;

function capsuleShape() {
  return {
    shape: { type: 'capsule' as const, height: 1, radiusBottom: 0.3, radiusTop: 0.3 },
    localPosition: Vector3.fromCopy3(0, 0.8, 0),
    localRotation: Quaternion.identity(),
  };
}

test('creates a foot-anchored kinematic capsule and configures traversal', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(fakeEntity().entity, capsuleShape());

  expect(world.collider?.halfHeight).toBeCloseTo(0.5);
  expect(world.collider?.translation.y).toBeCloseTo(0.8);
  expect(world.controller?.autostep).toEqual([0.25, 0.2, false]);
  expect(world.controller?.snapDistance).toBe(0.15);
  expect(world.controller?.applyImpulses).toBe(false);
  expect(world.controller?.normalNudgeFactor).toBe(0.001);
});

test.each([
  ['an oversized ground probe', Vector3.one(), { groundProbeRadius: 0.31 }],
  ['a zero entity scale', Vector3.zero(), {}],
])('validates %s before creating a Rapier body and remains reusable', async (_caseName, scale, options) => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const strategy = new RapierCharacterControllerStrategy();

  expect(() => strategy.setup(fakeEntity(Quaternion.identity(), scale).entity, capsuleShape(), options)).toThrow(
    'groundProbeRadius'
  );
  expect(world.body).toBeUndefined();

  expect(() => strategy.setup(fakeEntity().entity, capsuleShape())).not.toThrow();
  strategy.destroy();
});

test('applies the entity world rotation to the character body and ground probe offset', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const rotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 2);
  const { entity } = fakeEntity(rotation);
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, {
    ...capsuleShape(),
    localPosition: Vector3.fromCopy3(1, 0.8, 0),
  });

  expect(world.body?.rotation().x).toBeCloseTo(rotation.x);
  expect(world.body?.rotation().y).toBeCloseTo(rotation.y);
  expect(world.body?.rotation().z).toBeCloseTo(rotation.z);
  expect(world.body?.rotation().w).toBeCloseTo(rotation.w);

  const castShapeSpy = vi.spyOn(world, 'castShape');
  strategy.postStep();
  const probeOrigin = castShapeSpy.mock.calls[0]?.[0];
  expect(probeOrigin?.x).toBeCloseTo(0);
  expect(probeOrigin?.y).toBeCloseTo(1.25);
  expect(probeOrigin?.z).toBeCloseTo(0);
});

test('scales a rotated character capsule along its transformed axis', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const strategy = new RapierCharacterControllerStrategy();
  const localRotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), -Math.PI / 2);
  strategy.setup(fakeEntity(Quaternion.identity(), Vector3.fromCopy3(2, 1, 1)).entity, {
    ...capsuleShape(),
    localPosition: Vector3.zero(),
    localRotation,
  });

  expect(world.collider?.halfHeight).toBeCloseTo(1);
  expect(world.collider?.radius).toBeCloseTo(0.6);
  const colliderRotation = Quaternion.fromCopy4(
    world.collider!.rotation.x,
    world.collider!.rotation.y,
    world.collider!.rotation.z,
    world.collider!.rotation.w
  );
  const colliderAxis = colliderRotation.transformVector3(Vector3.fromCopy3(0, 1, 0));
  expect(colliderAxis.x).toBeCloseTo(1);
  expect(colliderAxis.y).toBeCloseTo(0);

  const castShapeSpy = vi.spyOn(world, 'castShape');
  strategy.postStep();
  const probeOrigin = castShapeSpy.mock.calls[0]?.[0];
  expect(probeOrigin?.x).toBeCloseTo(-1.6);
  expect(probeOrigin?.y).toBeCloseTo(0.49);
});

test.each([
  ['a derived probe radius', {}, 0.48],
  ['an explicit probe radius', { groundProbeRadius: 0.2 }, 0.2],
])('rebuilds the character capsule with %s when its world scale changes', async (_caseName, options, expectedRadius) => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity, state } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), options);
  const initialBody = world.body;
  const castShapeSpy = vi.spyOn(world, 'castShape');

  state.scale = Vector3.fromCopy3(2, 2, 2);
  RapierPhysicsStrategy.update(1, 0.1);

  expect(world.body).not.toBe(initialBody);
  expect(world.removedBodies).toBe(1);
  expect(world.collider?.halfHeight).toBeCloseTo(1);
  expect(world.collider?.radius).toBeCloseTo(0.6);
  expect(world.collider?.translation.y).toBeCloseTo(1.6);
  const probeOrigin = castShapeSpy.mock.calls[0]?.[0];
  const probeShape = castShapeSpy.mock.calls[0]?.[3] as { radius: number } | undefined;
  expect(probeOrigin?.y).toBeCloseTo(expectedRadius + 0.01);
  expect(probeShape?.radius).toBeCloseTo(expectedRadius);

  RapierPhysicsStrategy.update(2, 0.1);
  expect(world.removedBodies).toBe(1);
});

test('synchronizes character rotation changed after setup', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity, state } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape());
  const rotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI / 3);

  state.rotation = rotation;
  RapierPhysicsStrategy.update(1, 0.1);

  expect(world.body?.rotation().x).toBeCloseTo(rotation.x);
  expect(world.body?.rotation().y).toBeCloseTo(rotation.y);
  expect(world.body?.rotation().z).toBeCloseTo(rotation.z);
  expect(world.body?.rotation().w).toBeCloseTo(rotation.w);
});

test('moves once per frame, reports initial grounding without landing, and synchronizes the entity', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity, state } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), { maxDeltaTime: 1 });
  strategy.setDesiredHorizontalVelocity(Vector3.fromCopy3(2, 99, -1));

  RapierPhysicsStrategy.update(1, 0.5);
  RapierPhysicsStrategy.update(1, 0.5);

  expect(world.stepCount).toBe(1);
  expect(strategy.isGrounded).toBe(true);
  expect(state.position.x).toBeCloseTo(1);
  expect(state.position.z).toBeCloseTo(-0.5);
  expect(strategy.motionState.state).toBe('grounded');
  expect(strategy.motionState.horizontalSpeed).toBeCloseTo(Math.hypot(2, 1));
  expect(strategy.motionState.groundedDuration).toBeCloseTo(0.5);
  expect(strategy.motionState.landingImpactSpeed).toBe(0);

  RapierPhysicsStrategy.update(2, 0.5);
  expect(strategy.motionState.state).toBe('grounded');
  expect(strategy.motionState.groundedDuration).toBeCloseTo(1);
  expect(strategy.motionState.landingImpactSpeed).toBe(0);
});

test('does not report landing while settling onto the initial ground', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), { maxDeltaTime: 1, gravity: 10 });

  world.controller!.forceAirborne = true;
  RapierPhysicsStrategy.update(1, 0.1);
  expect(strategy.motionState.state).toBe('falling');

  world.controller!.forceAirborne = false;
  RapierPhysicsStrategy.update(2, 0.1);

  expect(strategy.motionState.state).toBe('grounded');
  expect(strategy.motionState.landingImpactSpeed).toBe(0);
});

test('reports landing after a real airborne movement', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), { maxDeltaTime: 1, gravity: 10, jumpSpeed: 1.5 });

  RapierPhysicsStrategy.update(1, 0.1);
  expect(strategy.motionState.state).toBe('grounded');

  strategy.requestJump();
  RapierPhysicsStrategy.update(2, 0.1);
  expect(strategy.motionState.state).toBe('rising');
  RapierPhysicsStrategy.update(3, 0.1);
  expect(strategy.motionState.state).toBe('rising');
  RapierPhysicsStrategy.update(4, 0.1);

  expect(strategy.motionState.state).toBe('landing');
  expect(strategy.motionState.landingImpactSpeed).toBeCloseTo(0.5);
});

test('jumps only after grounding and releases Rapier resources', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity, state } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), { maxDeltaTime: 1, gravity: 10, jumpSpeed: 4 });
  RapierPhysicsStrategy.update(1, 0.1);

  strategy.requestJump();
  RapierPhysicsStrategy.update(2, 0.1);
  expect(state.position.y).toBeCloseTo(0.4);
  expect(strategy.isGrounded).toBe(false);
  expect(strategy.motionState.state).toBe('rising');
  expect(strategy.motionState.verticalSpeed).toBeCloseTo(4);
  expect(strategy.motionState.airborneDuration).toBeCloseTo(0.1);

  strategy.teleport(Vector3.fromCopy3(3, 2, 1));
  expect(state.position.isEqual(Vector3.fromCopy3(3, 2, 1))).toBe(true);
  expect(strategy.motionState).toMatchObject({
    state: 'falling',
    horizontalSpeed: 0,
    verticalSpeed: 0,
    groundedDuration: 0,
    airborneDuration: 0,
    landingImpactSpeed: 0,
  });
  strategy.destroy();
  expect(world.removedControllers).toBe(1);
  expect(world.removedBodies).toBe(1);
});

test('reports flat and steep ground contacts and clears stale contact state', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity } = fakeEntity();
  const { entity: groundEntity } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), { maxSlopeClimbAngle: Math.PI / 4 });
  const groundCollider = world.createCollider(new FakeColliderDesc(0, 0));
  RapierPhysicsStrategy._registerExternalCollider(groundCollider, groundEntity);

  RapierPhysicsStrategy.update(1, 0.1);
  expect(strategy.groundContact?.entity).toBe(groundEntity);
  expect(strategy.groundContact?.distance).toBeCloseTo(0.02);
  expect(strategy.groundContact?.position.y).toBeCloseTo(0);
  expect(strategy.groundContact?.slopeAngle).toBeCloseTo(0);
  expect(strategy.groundContact?.isWalkable).toBe(true);

  world.rayHitNormal = { x: Math.sqrt(0.75), y: 0.5, z: 0 };
  RapierPhysicsStrategy.update(2, 0.1);
  expect(strategy.groundContact?.slopeAngle).toBeCloseTo(Math.PI / 3);
  expect(strategy.groundContact?.isWalkable).toBe(false);

  world.rayHitNormal = { x: 1, y: 0, z: 0 };
  RapierPhysicsStrategy.update(3, 0.1);
  expect(strategy.groundContact).toBeUndefined();

  strategy.teleport(Vector3.fromCopy3(0, 2, 0));
  expect(strategy.groundContact).toBeUndefined();
  world.rayHitNormal = { x: 0, y: 1, z: 0 };
  RapierPhysicsStrategy.update(4, 0.1);
  expect(strategy.groundContact).toBeDefined();
  strategy.enabled = false;
  expect(strategy.groundContact).toBeUndefined();
});

test('nudges the character away after consecutive airborne downward movement is blocked', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity, state } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(entity, capsuleShape(), {
    maxDeltaTime: 1,
    stuckRecoveryFrameCount: 2,
    stuckRecoveryDistance: 0.02,
  });
  const { entity: nearbyGroundEntity } = fakeEntity();
  const nearbyGroundCollider = world.createCollider(new FakeColliderDesc(0, 0));
  RapierPhysicsStrategy._registerExternalCollider(nearbyGroundCollider, nearbyGroundEntity);
  world.controller!.forceAirborneStuck = true;

  RapierPhysicsStrategy.update(1, 0.1);
  expect(strategy.isRecovering).toBe(false);
  expect(strategy.groundContact).toBeDefined();
  RapierPhysicsStrategy.update(2, 0.1);
  expect(strategy.isRecovering).toBe(true);
  expect(strategy.motionState.state).toBe('recovering');
  expect(strategy.isGrounded).toBe(false);
  expect(strategy.computedMovement.x).toBeCloseTo(0.02);
  expect(state.position.x).toBeCloseTo(0.02);
});

test('reports sliding while descending above a non-walkable contact', async () => {
  await RapierPhysicsStrategy.initialize(fakeRapier());
  const { entity: characterEntity } = fakeEntity();
  const { entity: slopeEntity } = fakeEntity();
  const strategy = new RapierCharacterControllerStrategy();
  strategy.setup(characterEntity, capsuleShape(), { maxSlopeClimbAngle: Math.PI / 4 });
  const slopeCollider = world.createCollider(new FakeColliderDesc(0, 0));
  RapierPhysicsStrategy._registerExternalCollider(slopeCollider, slopeEntity);
  world.controller!.forceAirborne = true;
  world.rayHitNormal = { x: Math.sqrt(0.75), y: 0.5, z: 0 };

  RapierPhysicsStrategy.update(1, 0.1);

  expect(strategy.motionState.state).toBe('sliding');
  expect(strategy.motionState.groundContact?.isWalkable).toBe(false);
});
