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
  setTranslation(x: number, y: number, z: number) {
    this.translation = { x, y, z };
    return this;
  }
  setRotation(_rotation: { x: number; y: number; z: number; w: number }) {
    return this;
  }
}

class FakeColliderDesc {
  handle?: number;
  translation = { x: 0, y: 0, z: 0 };
  constructor(
    readonly halfHeight: number,
    readonly radius: number
  ) {}
  setTranslation(x: number, y: number, z: number) {
    this.translation = { x, y, z };
    return this;
  }
  setRotation() {
    return this;
  }
}

class FakeBody {
  current: RapierVector3Like;
  next?: RapierVector3Like;
  constructor(desc: FakeBodyDesc) {
    this.current = { ...desc.translation };
  }
  translation() {
    return this.current;
  }
  rotation() {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  setTranslation(value: RapierVector3Like) {
    this.current = { ...value };
  }
  setRotation() {}
  setNextKinematicTranslation(value: RapierVector3Like) {
    this.next = { ...value };
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
  computeColliderMovement(_collider: unknown, desired: RapierVector3Like) {
    this.grounded = desired.y <= 0;
    this.movement = { x: desired.x, y: this.grounded ? 0 : desired.y, z: desired.z };
  }
  computedMovement() {
    return this.movement;
  }
  computedGrounded() {
    return this.grounded;
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
  }
  castRayAndGetNormal(
    _ray: unknown,
    _maxToi: number,
    _solid: boolean,
    _filterFlags?: number,
    _filterGroups?: number,
    _excludeCollider?: FakeColliderDesc,
    _excludeRigidBody?: FakeBody,
    predicate?: (collider: FakeColliderDesc) => boolean
  ) {
    const collider = this.colliders.find(candidate => predicate?.(candidate) ?? true);
    return collider == null ? null : { collider, timeOfImpact: 0.02, normal: this.rayHitNormal };
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
    Ray: class {
      constructor(
        readonly origin: RapierVector3Like,
        readonly direction: RapierVector3Like
      ) {}
    },
    QueryFilterFlags: { EXCLUDE_SENSORS: 8 },
  };
}

function fakeEntity() {
  const state = { position: Vector3.fromCopy3(0, 0, 0) };
  const entity = {
    entityUID: nextEntityUID++,
    getSceneGraph: () => ({
      get position() {
        return state.position;
      },
      scale: Vector3.one(),
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
});

test('moves once per frame, reports grounding, and synchronizes the entity', async () => {
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

  strategy.teleport(Vector3.fromCopy3(3, 2, 1));
  expect(state.position.isEqual(Vector3.fromCopy3(3, 2, 1))).toBe(true);
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
  expect(strategy.groundContact?.slopeAngle).toBeCloseTo(0);
  expect(strategy.groundContact?.isWalkable).toBe(true);

  world.rayHitNormal = { x: Math.sqrt(0.75), y: 0.5, z: 0 };
  RapierPhysicsStrategy.update(2, 0.1);
  expect(strategy.groundContact?.slopeAngle).toBeCloseTo(Math.PI / 3);
  expect(strategy.groundContact?.isWalkable).toBe(false);

  strategy.teleport(Vector3.fromCopy3(0, 2, 0));
  expect(strategy.groundContact).toBeUndefined();
  RapierPhysicsStrategy.update(3, 0.1);
  expect(strategy.groundContact).toBeDefined();
  strategy.enabled = false;
  expect(strategy.groundContact).toBeUndefined();
});
