import { TriggerComponent } from '../../components/Trigger/TriggerComponent';
import type { Config } from '../../core/Config';
import { PhysicsShape } from '../../definitions/PhysicsShapeType';
import type { ISceneGraphEntity } from '../../helpers';
import { Quaternion, Vector3 } from '../../math';
import type { Engine } from '../../system/Engine';
import type { PhysicsPropertyInner } from '../PhysicsProperty';
import { PhysicsWorldQuery } from '../PhysicsWorldQuery';
import { type RapierPhysicsModuleLike, RapierPhysicsStrategy } from './RapierPhysicsStrategy';
import { RapierPhysicsWorldQueryStrategy } from './RapierPhysicsWorldQueryStrategy';

class FakeRigidBodyDesc {
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };
  linearVelocity = { x: 0, y: 0, z: 0 };
  angularVelocity = { x: 0, y: 0, z: 0 };
  gravityScale = 1;

  constructor(readonly kind: 'dynamic' | 'fixed' | 'kinematic' = 'dynamic') {}

  setTranslation(x: number, y: number, z: number): FakeRigidBodyDesc {
    this.translation = { x, y, z };
    return this;
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }): FakeRigidBodyDesc {
    this.rotation = rotation;
    return this;
  }

  setLinvel(x: number, y: number, z: number): FakeRigidBodyDesc {
    this.linearVelocity = { x, y, z };
    return this;
  }

  setAngvel(velocity: { x: number; y: number; z: number }): FakeRigidBodyDesc {
    this.angularVelocity = { ...velocity };
    return this;
  }

  setGravityScale(factor: number): FakeRigidBodyDesc {
    this.gravityScale = factor;
    return this;
  }
}

class FakeColliderDesc {
  density = 0;
  friction = 0;
  restitution = 0;
  translation = { x: 0, y: 0, z: 0 };
  rotation = { x: 0, y: 0, z: 0, w: 1 };
  collisionGroups = 0xffffffff;
  sensor = false;
  activeEvents = 0;
  activeCollisionTypes = 0;
  handle?: number;

  constructor(
    readonly type: 'ball' | 'cuboid' | 'capsule' | 'cylinder',
    readonly size: number[]
  ) {}

  setDensity(density: number): FakeColliderDesc {
    this.density = density;
    return this;
  }

  setFriction(friction: number): FakeColliderDesc {
    this.friction = friction;
    return this;
  }

  setRestitution(restitution: number): FakeColliderDesc {
    this.restitution = restitution;
    return this;
  }

  setTranslation(x: number, y: number, z: number): FakeColliderDesc {
    this.translation = { x, y, z };
    return this;
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }): FakeColliderDesc {
    this.rotation = rotation;
    return this;
  }

  setCollisionGroups(groups: number): FakeColliderDesc {
    this.collisionGroups = groups;
    return this;
  }

  setSensor(sensor: boolean): FakeColliderDesc {
    this.sensor = sensor;
    return this;
  }

  isSensor(): boolean {
    return this.sensor;
  }

  setActiveEvents(events: number): FakeColliderDesc {
    this.activeEvents = events;
    return this;
  }

  setActiveCollisionTypes(types: number): FakeColliderDesc {
    this.activeCollisionTypes = types;
    return this;
  }
}

class FakeRigidBody {
  translationValue: { x: number; y: number; z: number };
  rotationValue: { x: number; y: number; z: number; w: number };
  nextTranslationValue?: { x: number; y: number; z: number };
  nextRotationValue?: { x: number; y: number; z: number; w: number };

  constructor(desc: FakeRigidBodyDesc) {
    this.translationValue = { ...desc.translation };
    this.rotationValue = { ...desc.rotation };
    this.kind = desc.kind;
    this.linearVelocity = { ...desc.linearVelocity };
    this.angularVelocity = { ...desc.angularVelocity };
    this.gravityScale = desc.gravityScale;
  }

  readonly kind: 'dynamic' | 'fixed' | 'kinematic';
  readonly linearVelocity: { x: number; y: number; z: number };
  readonly angularVelocity: { x: number; y: number; z: number };
  readonly gravityScale: number;
  recomputeMassPropertiesCount = 0;
  additionalMassProperties?: {
    mass: number;
    centerOfMass: { x: number; y: number; z: number };
    inertia: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
  };

  translation() {
    return this.translationValue;
  }

  rotation() {
    return this.rotationValue;
  }

  setTranslation(translation: { x: number; y: number; z: number }, _wakeUp: boolean): void {
    this.translationValue = { ...translation };
  }

  setRotation(rotation: { x: number; y: number; z: number; w: number }, _wakeUp: boolean): void {
    this.rotationValue = { ...rotation };
  }

  setNextKinematicTranslation(translation: { x: number; y: number; z: number }): void {
    this.nextTranslationValue = { ...translation };
  }

  setNextKinematicRotation(rotation: { x: number; y: number; z: number; w: number }): void {
    this.nextRotationValue = { ...rotation };
  }

  mass(): number {
    return 12;
  }

  localCom() {
    return { x: 1, y: 2, z: 3 };
  }

  principalInertia() {
    return { x: 4, y: 5, z: 6 };
  }

  principalInertiaLocalFrame() {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  recomputeMassPropertiesFromColliders(): void {
    this.recomputeMassPropertiesCount++;
  }

  setAdditionalMassProperties(
    mass: number,
    centerOfMass: { x: number; y: number; z: number },
    inertia: { x: number; y: number; z: number },
    orientation: { x: number; y: number; z: number; w: number },
    _wakeUp: boolean
  ): void {
    this.additionalMassProperties = {
      mass,
      centerOfMass: { ...centerOfMass },
      inertia: { ...inertia },
      orientation: { ...orientation },
    };
  }
}

class FakeWorld {
  bodies: FakeRigidBody[] = [];
  colliders: FakeColliderDesc[] = [];
  removedBodies = 0;
  lastRaycast?: { maxToi: number; solid: boolean; filterFlags?: number; filterGroups?: number };
  lastSpherecast?: { targetDistance: number; maxToi: number; stopAtPenetration: boolean; filterFlags?: number };

  constructor(readonly gravity: { x: number; y: number; z: number }) {
    lastWorld = this;
  }

  step(): void {
    for (const body of this.bodies) {
      body.translationValue = {
        x: body.translationValue.x,
        y: body.translationValue.y - 1,
        z: body.translationValue.z,
      };
    }
  }

  createRigidBody(desc: FakeRigidBodyDesc): FakeRigidBody {
    const body = new FakeRigidBody(desc);
    this.bodies.push(body);
    return body;
  }

  createCollider(desc: FakeColliderDesc, _rigidBody?: FakeRigidBody): FakeColliderDesc {
    desc.handle = this.colliders.length;
    this.colliders.push(desc);
    return desc;
  }

  removeRigidBody(rigidBody: FakeRigidBody): void {
    this.removedBodies++;
    this.bodies = this.bodies.filter(body => body !== rigidBody);
  }

  castRayAndGetNormal(
    _ray: unknown,
    maxToi: number,
    solid: boolean,
    filterFlags?: number,
    filterGroups?: number,
    _excludeCollider?: FakeColliderDesc,
    _excludeRigidBody?: FakeRigidBody,
    predicate?: (collider: FakeColliderDesc) => boolean
  ) {
    this.lastRaycast = { maxToi, solid, filterFlags, filterGroups };
    const collider = this.colliders.find(item => predicate?.(item) ?? true);
    return collider == null ? null : { collider, timeOfImpact: Math.min(2, maxToi), normal: { x: 0, y: 1, z: 0 } };
  }

  castShape(
    _origin: unknown,
    _rotation: unknown,
    _direction: unknown,
    _shape: unknown,
    targetDistance: number,
    maxToi: number,
    stopAtPenetration: boolean,
    filterFlags?: number,
    _filterGroups?: number,
    _excludeCollider?: FakeColliderDesc,
    _excludeRigidBody?: FakeRigidBody,
    predicate?: (collider: FakeColliderDesc) => boolean
  ) {
    this.lastSpherecast = { targetDistance, maxToi, stopAtPenetration, filterFlags };
    const collider = this.colliders.find(item => predicate?.(item) ?? true);
    return collider == null
      ? null
      : {
          collider,
          time_of_impact: Math.min(1, maxToi),
          normal1: { x: 0, y: 1, z: 0 },
          witness1: { x: 1, y: 3.5, z: 3 },
          normal2: { x: 0, y: -1, z: 0 },
          witness2: { x: 0, y: -0.5, z: 0 },
        };
  }
}

let lastWorld: FakeWorld | undefined;
let lastEventQueue: FakeEventQueue | undefined;

class FakeEventQueue {
  private __events: Array<[number, number, boolean]> = [];

  constructor(_autoDrain: boolean) {
    lastEventQueue = this;
  }

  emit(handle1: number, handle2: number, started: boolean): void {
    this.__events.push([handle1, handle2, started]);
  }

  drainCollisionEvents(callback: (handle1: number, handle2: number, started: boolean) => void): void {
    for (const [handle1, handle2, started] of this.__events.splice(0)) {
      callback(handle1, handle2, started);
    }
  }
}

class FakeRay {
  constructor(
    readonly origin: { x: number; y: number; z: number },
    readonly direction: { x: number; y: number; z: number }
  ) {}
}

class FakeBall {
  constructor(readonly radius: number) {}
}

function createFakeRapier(onInit?: () => void): RapierPhysicsModuleLike {
  return {
    init: () => {
      onInit?.();
    },
    World: FakeWorld,
    RigidBodyDesc: {
      dynamic: () => new FakeRigidBodyDesc('dynamic'),
      fixed: () => new FakeRigidBodyDesc('fixed'),
      kinematicPositionBased: () => new FakeRigidBodyDesc('kinematic'),
    },
    ColliderDesc: {
      cuboid: (x: number, y: number, z: number) => new FakeColliderDesc('cuboid', [x, y, z]),
      ball: (radius: number) => new FakeColliderDesc('ball', [radius]),
      capsule: (halfHeight: number, radius: number) => new FakeColliderDesc('capsule', [halfHeight, radius]),
      cylinder: (halfHeight: number, radius: number) => new FakeColliderDesc('cylinder', [halfHeight, radius]),
    },
    ActiveEvents: { COLLISION_EVENTS: 1 },
    ActiveCollisionTypes: { ALL: 0xffff },
    QueryFilterFlags: { EXCLUDE_SENSORS: 8 },
    Ray: FakeRay,
    Ball: FakeBall,
    EventQueue: FakeEventQueue,
  };
}

const defaultEngine = {} as Engine;

function createSceneGraphEntity(entityUID = nextEntityUID++, engine = defaultEngine) {
  const state = {
    position: Vector3.zero(),
    rotation: Quaternion.identity(),
  };

  return {
    entity: {
      engine,
      entityUID,
      getSceneGraph: () => ({
        get position() {
          return state.position;
        },
        eulerAngles: Vector3.zero(),
        scale: Vector3.one(),
        getQuaternionRecursively: () => state.rotation,
        setPositionWithoutPhysics: (position: Vector3) => {
          state.position = position;
        },
        setRotationWithoutPhysics: (rotation: Quaternion) => {
          state.rotation = rotation;
        },
      }),
    } as unknown as ISceneGraphEntity,
    state,
  };
}

let nextEntityUID = 1;

function createPhysicsProperty(type = PhysicsShape.Box): PhysicsPropertyInner {
  return {
    type,
    size: Vector3.fromCopy3(2, 4, 6),
    position: Vector3.fromCopy3(1, 3, 5),
    rotation: Vector3.fromCopy3(0, 0, 0),
    move: true,
    density: 2,
    friction: 0.4,
    restitution: 0.6,
  };
}

test('RapierPhysicsStrategy initializes from an externally injected module', async () => {
  let initCalled = false;
  await RapierPhysicsStrategy.initialize(
    createFakeRapier(() => {
      initCalled = true;
    })
  );

  expect(initCalled).toBe(true);
  expect(RapierPhysicsStrategy.isInitialized).toBe(true);
  expect(lastWorld?.gravity.x).toBe(0);
  expect(lastWorld?.gravity.y).toBeCloseTo(-9.8);
  expect(lastWorld?.gravity.z).toBe(0);
});

test('RapierPhysicsStrategy syncs Rapier body transforms to the scene graph entity', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity, state } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity);
  RapierPhysicsStrategy.update();
  strategy.update({} as Config);

  expect(state.position.isEqual(Vector3.fromCopy3(1, 2, 5))).toBe(true);
});

test('RapierPhysicsStrategy scopes stay events to the processed engine', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const engine = {} as Engine;
  const publishStayEventsSpy = vi.spyOn(TriggerComponent, '_publishStayEvents');
  try {
    RapierPhysicsStrategy.update(1, 1 / 60, engine);
    expect(publishStayEventsSpy).toHaveBeenCalledWith(engine);
  } finally {
    publishStayEventsSpy.mockRestore();
  }
});

test('RapierPhysicsWorldQueryStrategy resolves hits through collider metadata and filters', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const physics = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  physics.setShape(createPhysicsProperty(), entity);
  const query = new PhysicsWorldQuery(new RapierPhysicsWorldQueryStrategy());

  const hit = query.castRay(Vector3.fromCopy3(1, 5, 3), Vector3.fromCopy3(0, -4, 0), 5, {
    collisionGroup: 2,
    collisionMask: 4,
  });

  expect(hit?.entity).toBe(entity);
  expect(hit?.distance).toBe(2);
  expect(hit?.fraction).toBe(0.4);
  expect(hit?.position.isEqual(Vector3.fromCopy3(1, 3, 3))).toBe(true);
  expect(hit?.normal.isEqual(Vector3.fromCopy3(0, 1, 0))).toBe(true);
  expect(lastWorld?.lastRaycast).toEqual({ maxToi: 5, solid: true, filterFlags: 8, filterGroups: 0x00020004 });
  expect(query.castRay(Vector3.zero(), Vector3.fromCopy3(0, -1, 0), 5, { excludeEntities: [entity] })).toBe(undefined);
  expect(query.castRay(Vector3.zero(), Vector3.fromCopy3(0, -1, 0), 5, { predicate: () => false })).toBeUndefined();

  const sphereHit = query.castSphere(Vector3.fromCopy3(1, 5, 3), 0.5, Vector3.fromCopy3(0, -2, 0), 4);
  expect(sphereHit?.entity).toBe(entity);
  expect(sphereHit?.distance).toBe(1);
  expect(sphereHit?.fraction).toBe(0.25);
  expect(sphereHit?.position.isEqual(Vector3.fromCopy3(1, 3.5, 3))).toBe(true);
  expect(sphereHit?.normal.isEqual(Vector3.fromCopy3(0, 1, 0))).toBe(true);
  expect(lastWorld?.lastSpherecast).toEqual({
    targetDistance: 0,
    maxToi: 4,
    stopAtPenetration: true,
    filterFlags: 8,
  });
});

test('RapierPhysicsWorldQueryStrategy distinguishes exclusion targets with identical UIDs', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const excludedPhysics = new RapierPhysicsStrategy();
  const candidatePhysics = new RapierPhysicsStrategy();
  const { entity: excludedEntity } = createSceneGraphEntity(12345);
  const { entity: candidateEntity } = createSceneGraphEntity(12345);
  const createBinding = () => ({
    bindingId: 7,
    shape: {
      shape: { type: 'box' as const, size: Vector3.one() },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    body: { move: false, density: 1 },
    collider: { friction: 0.5, restitution: 0 },
  });
  excludedPhysics.setShapeInstances([createBinding()], excludedEntity);
  candidatePhysics.setShapeInstances([createBinding()], candidateEntity);
  const query = new PhysicsWorldQuery(new RapierPhysicsWorldQueryStrategy());

  const entityFilteredHit = query.castRay(Vector3.zero(), Vector3.fromCopy3(0, -1, 0), 5, {
    excludeEntities: [excludedEntity],
  });
  const colliderFilteredHit = query.castRay(Vector3.zero(), Vector3.fromCopy3(0, -1, 0), 5, {
    excludeColliders: [{ entity: excludedEntity, bindingId: 7 }],
  });

  expect(entityFilteredHit?.entity).toBe(candidateEntity);
  expect(colliderFilteredHit?.entity).toBe(candidateEntity);
});

test('RapierPhysicsStrategy recreates the collider when scale changes', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity);
  strategy.setScale(Vector3.fromCopy3(2, 3, 4));

  expect(lastWorld).toBeDefined();
  const world = lastWorld!;
  expect(world.removedBodies).toBe(1);
  expect(world.colliders[world.colliders.length - 1]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy applies absolute initial scale to a collider', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShape(createPhysicsProperty(), entity, Vector3.fromCopy3(-2, 3, -4));

  expect(lastWorld?.colliders[0]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy disables and recreates a collider across zero scale', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShape(createPhysicsProperty(), entity);
  const world = lastWorld!;

  strategy.setScale(Vector3.fromCopy3(0, 1, 1));
  expect(world.removedBodies).toBe(1);
  expect(world.colliders).toHaveLength(1);

  strategy.setScale(Vector3.fromCopy3(2, 3, 4));
  expect(world.colliders).toHaveLength(2);
  expect(world.colliders[1]?.size).toEqual([2, 6, 12]);
});

test('RapierPhysicsStrategy consumes a generic shape instance with a local transform', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShapeInstance(
    {
      shape: { type: 'box', size: Vector3.fromCopy3(2, 4, 6) },
      localPosition: Vector3.fromCopy3(1, 2, 3),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0.1 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastWorld?.colliders[0]?.size).toEqual([2, 6, 12]);
  expect(lastWorld?.colliders[0]?.translation).toEqual({ x: 2, y: 6, z: 12 });
});

test('RapierPhysicsStrategy converts cylinder and capsule shapes conservatively', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const { entity } = createSceneGraphEntity();
  const cylinder = new RapierPhysicsStrategy();
  cylinder.setShapeInstance(
    {
      shape: { type: 'cylinder', height: 0.5, radiusBottom: 0.25, radiusTop: 0.5 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );
  const capsule = new RapierPhysicsStrategy();
  capsule.setShapeInstance(
    {
      shape: { type: 'capsule', height: 1, radiusBottom: 0.2, radiusTop: 0.3 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: false, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.fromCopy3(2, 3, 4)
  );

  expect(lastWorld?.colliders[0]?.type).toBe('cylinder');
  expect(lastWorld?.colliders[0]?.size).toEqual([0.75, 2]);
  expect(lastWorld?.colliders[1]?.type).toBe('capsule');
  expect(lastWorld?.colliders[1]?.size[0]).toBeCloseTo(1.5);
  expect(lastWorld?.colliders[1]?.size[1]).toBeCloseTo(1.2);
});

test('RapierPhysicsStrategy creates one body with multiple colliders and rebuilds them together', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  const bindings = [
    {
      shape: {
        shape: { type: 'box' as const, size: Vector3.fromCopy3(2, 4, 6) },
        localPosition: Vector3.fromCopy3(1, 2, 3),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 1 },
      collider: { friction: 0.2, restitution: 0.1, collisionGroup: 1, collisionMask: 0x8002 },
    },
    {
      shape: {
        shape: { type: 'sphere' as const, radius: 0.5 },
        localPosition: Vector3.fromCopy3(-1, 0, 0),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 2 },
      collider: { friction: 0.4, restitution: 0.3, collisionGroup: 2, collisionMask: 0x8001 },
    },
    {
      shape: {
        shape: { type: 'capsule' as const, height: 1, radiusBottom: 0.25, radiusTop: 0.25 },
        localPosition: Vector3.zero(),
        localRotation: Quaternion.identity(),
      },
      body: { move: false, density: 3 },
      collider: { friction: 0.6, restitution: 0.5 },
    },
  ];

  strategy.setShapeInstances(bindings, entity);
  const world = lastWorld!;
  expect(world.bodies).toHaveLength(1);
  expect(world.colliders).toHaveLength(3);
  expect(world.colliders.map(collider => collider.density)).toEqual([1, 2, 3]);
  expect(world.colliders.map(collider => collider.friction)).toEqual([0.2, 0.4, 0.6]);
  expect(world.colliders.map(collider => collider.collisionGroups)).toEqual([0x00018002, 0x00028001, 0xffffffff]);
  expect(world.colliders[0].translation).toEqual({ x: 1, y: 2, z: 3 });

  strategy.setScale(Vector3.fromCopy3(2, 3, 4));
  expect(world.removedBodies).toBe(1);
  expect(world.bodies).toHaveLength(1);
  expect(world.colliders).toHaveLength(6);
  expect(world.colliders[3].size).toEqual([2, 6, 12]);
  expect(world.colliders[3].translation).toEqual({ x: 2, y: 6, z: 12 });
  expect(world.colliders[3].collisionGroups).toBe(0x00018002);

  const bodyBeforeInvalidUpdate = world.bodies[0];
  expect(() =>
    strategy.setShapeInstances([bindings[0], { ...bindings[1], body: { ...bindings[1].body, move: true } }], entity)
  ).toThrow('same body.move');
  expect(world.bodies[0]).toBe(bodyBeforeInvalidUpdate);
  expect(world.removedBodies).toBe(1);

  strategy.clearShapeInstances();
  expect(world.bodies).toHaveLength(0);
  expect(world.removedBodies).toBe(2);
});

test('RapierPhysicsStrategy creates a position-based kinematic compound body', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();

  strategy.setShapeInstances(
    [
      {
        shape: {
          shape: { type: 'box', size: Vector3.one() },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: true, isKinematic: true, density: 1 },
        collider: { friction: 0.5, restitution: 0 },
      },
    ],
    entity
  );

  const body = lastWorld?.bodies[0];
  expect(body?.kind).toBe('kinematic');

  const nextPosition = Vector3.fromCopy3(2, 3, 4);
  const nextRotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  strategy.setPosition(nextPosition);
  strategy.setRotation(nextRotation);

  expect(body?.translationValue).toEqual({ x: 0, y: 0, z: 0 });
  expect(body?.nextTranslationValue).toEqual({ x: 2, y: 3, z: 4 });
  expect(body?.rotationValue).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  expect(body?.nextRotationValue?.x).toBeCloseTo(nextRotation.x);
  expect(body?.nextRotationValue?.y).toBeCloseTo(nextRotation.y);
  expect(body?.nextRotationValue?.z).toBeCloseTo(nextRotation.z);
  expect(body?.nextRotationValue?.w).toBeCloseTo(nextRotation.w);

  strategy.setScale(Vector3.fromCopy3(2, 3, 4));

  const rebuiltBody = lastWorld?.bodies[0];
  expect(rebuiltBody).not.toBe(body);
  expect(rebuiltBody?.translationValue).toEqual({ x: 0, y: 0, z: 0 });
  expect(rebuiltBody?.nextTranslationValue).toEqual({ x: 2, y: 3, z: 4 });
  expect(rebuiltBody?.rotationValue).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  expect(rebuiltBody?.nextRotationValue?.x).toBeCloseTo(nextRotation.x);
  expect(rebuiltBody?.nextRotationValue?.y).toBeCloseTo(nextRotation.y);
  expect(rebuiltBody?.nextRotationValue?.z).toBeCloseTo(nextRotation.z);
  expect(rebuiltBody?.nextRotationValue?.w).toBeCloseTo(nextRotation.w);
});

test('RapierPhysicsStrategy applies explicit total mass, local velocities, and gravity factor', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity, state } = createSceneGraphEntity();
  state.rotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2);
  const box = {
    shape: { type: 'box' as const, size: Vector3.one() },
    localPosition: Vector3.zero(),
    localRotation: Quaternion.identity(),
  };

  strategy.setShapeInstances(
    [
      { shape: box, body: { move: true, density: 99 }, collider: { friction: 0.5, restitution: 0 } },
      {
        shape: { ...box, localPosition: Vector3.fromCopy3(2, 0, 0) },
        body: { move: true, density: 99 },
        collider: { friction: 0.5, restitution: 0 },
      },
    ],
    entity,
    Vector3.one(),
    {
      move: true,
      mass: 10,
      linearVelocity: Vector3.fromCopy3(1, 0, 0),
      angularVelocity: Vector3.fromCopy3(0, 0, 2),
      gravityFactor: -0.5,
    }
  );

  expect(lastWorld?.colliders.map(collider => collider.density)).toEqual([5, 5]);
  expect(lastWorld?.bodies[0].linearVelocity.x).toBeCloseTo(0);
  expect(lastWorld?.bodies[0].linearVelocity.z).toBeCloseTo(-1);
  expect(lastWorld?.bodies[0].angularVelocity.x).toBeCloseTo(2);
  expect(lastWorld?.bodies[0].gravityScale).toBe(-0.5);
});

test('RapierPhysicsStrategy merges explicit and automatically computed complete mass properties', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShapeInstances(
    [
      {
        shape: {
          shape: { type: 'box', size: Vector3.one() },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: true, density: 2 },
        collider: { friction: 0.5, restitution: 0 },
      },
    ],
    entity,
    Vector3.one(),
    {
      move: true,
      centerOfMass: Vector3.fromCopy3(7, 8, 9),
      inertiaOrientation: Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), Math.PI / 2),
    }
  );

  const body = lastWorld!.bodies[0];
  expect(lastWorld?.colliders[0].density).toBe(0);
  expect(body.recomputeMassPropertiesCount).toBe(2);
  expect(body.additionalMassProperties?.mass).toBe(12);
  expect(body.additionalMassProperties?.centerOfMass).toEqual({ x: 7, y: 8, z: 9 });
  expect(body.additionalMassProperties?.inertia).toEqual({ x: 4, y: 5, z: 6 });
  expect(body.additionalMassProperties?.orientation.y).toBeCloseTo(Math.SQRT1_2);

  strategy.setScale(Vector3.fromCopy3(2, 2, 2));
  expect(lastWorld?.bodies[0].additionalMassProperties?.centerOfMass).toEqual({ x: 7, y: 8, z: 9 });
  expect(lastWorld?.colliders.at(-1)?.density).toBe(0);
});

test('RapierPhysicsStrategy represents mass zero without converting the body to kinematic', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShapeInstance(
    {
      shape: { type: 'sphere', radius: 1 },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    { move: true, density: 1 },
    { friction: 0.5, restitution: 0 },
    entity,
    Vector3.one(),
    {
      move: true,
      mass: 0,
      inertiaDiagonal: Vector3.fromCopy3(0, 2, 0),
      linearVelocity: Vector3.fromCopy3(1, 0, 0),
    }
  );

  const body = lastWorld!.bodies[0];
  expect(body.kind).toBe('dynamic');
  expect(body.additionalMassProperties?.mass).toBe(0);
  expect(body.additionalMassProperties?.inertia).toEqual({ x: 0, y: 2, z: 0 });
  expect(lastWorld?.colliders[0].density).toBe(0);
});

test('RapierPhysicsStrategy configures sensors with collision events and binding metadata', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShapeInstances(
    [
      {
        bindingId: 42,
        shape: {
          shape: { type: 'box', size: Vector3.one() },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: false, density: 1 },
        collider: { friction: 0, restitution: 0, isSensor: true },
      },
    ],
    entity
  );

  expect(lastWorld?.colliders[0].sensor).toBe(true);
  expect(lastWorld?.colliders[0].activeEvents).toBe(1);
  expect(lastWorld?.colliders[0].activeCollisionTypes).toBe(0xffff);
});

test('RapierPhysicsStrategy suspends sensor overlaps during rebuilds and deactivates them on removal', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  const binding = {
    bindingId: 42,
    shape: {
      shape: { type: 'box' as const, size: Vector3.one() },
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
    },
    body: { move: false, density: 1 },
    collider: { friction: 0, restitution: 0, isSensor: true },
  };
  const suspendSensorSpy = vi.spyOn(TriggerComponent, '_suspendSensorBinding');
  const suspendOtherSpy = vi.spyOn(TriggerComponent, '_suspendOtherBinding');
  const deactivateSensorSpy = vi.spyOn(TriggerComponent, '_deactivateSensorBinding');
  const deactivateOtherSpy = vi.spyOn(TriggerComponent, '_deactivateOtherBinding');
  try {
    strategy.setShapeInstances([binding], entity);
    strategy.setShapeInstances([binding], entity);

    expect(suspendSensorSpy).toHaveBeenCalledWith(entity.engine, entity.entityUID, 42);
    expect(suspendOtherSpy).toHaveBeenCalledWith(entity, 42, 0);
    expect(deactivateSensorSpy).not.toHaveBeenCalled();
    expect(deactivateOtherSpy).not.toHaveBeenCalled();

    strategy.clearShapeInstances();
    expect(deactivateSensorSpy).toHaveBeenCalledWith(entity.engine, entity.entityUID, 42);
    expect(deactivateOtherSpy).toHaveBeenCalledWith(entity, 42, 1);
  } finally {
    suspendSensorSpy.mockRestore();
    suspendOtherSpy.mockRestore();
    deactivateSensorSpy.mockRestore();
    deactivateOtherSpy.mockRestore();
  }
});

test('RapierPhysicsStrategy excludes sensors from dynamic body mass properties', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  strategy.setShapeInstances(
    [
      {
        shape: {
          shape: { type: 'box', size: Vector3.one() },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: true, density: 99 },
        collider: { friction: 0, restitution: 0 },
      },
      {
        shape: {
          shape: { type: 'box', size: Vector3.fromCopy3(2, 2, 2) },
          localPosition: Vector3.zero(),
          localRotation: Quaternion.identity(),
        },
        body: { move: true, density: 99 },
        collider: { friction: 0, restitution: 0, isSensor: true },
      },
    ],
    entity,
    Vector3.one(),
    { move: true, mass: 10 }
  );

  expect(lastWorld?.colliders.map(collider => collider.density)).toEqual([10, 0]);
});

test('RapierPhysicsStrategy ignores collision events between different engines', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const firstEngine = {} as Engine;
  const secondEngine = {} as Engine;
  const sensorStrategy = new RapierPhysicsStrategy();
  const crossEngineStrategy = new RapierPhysicsStrategy();
  const sameEngineStrategy = new RapierPhysicsStrategy();
  const { entity: sensorEntity } = createSceneGraphEntity(1001, firstEngine);
  const { entity: crossEngineEntity } = createSceneGraphEntity(1002, secondEngine);
  const { entity: sameEngineEntity } = createSceneGraphEntity(1003, firstEngine);
  const shape = {
    shape: { type: 'box' as const, size: Vector3.one() },
    localPosition: Vector3.zero(),
    localRotation: Quaternion.identity(),
  };

  sensorStrategy.setShapeInstances(
    [
      {
        bindingId: 42,
        shape,
        body: { move: false, density: 1 },
        collider: { friction: 0, restitution: 0, isSensor: true },
      },
    ],
    sensorEntity
  );
  crossEngineStrategy.setShapeInstances(
    [{ shape, body: { move: false, density: 1 }, collider: { friction: 0, restitution: 0 } }],
    crossEngineEntity
  );
  sameEngineStrategy.setShapeInstances(
    [{ shape, body: { move: false, density: 1 }, collider: { friction: 0, restitution: 0 } }],
    sameEngineEntity
  );

  const processOverlapSpy = vi.spyOn(TriggerComponent, '_processOverlap');
  try {
    lastEventQueue?.emit(0, 1, true);
    RapierPhysicsStrategy.update();
    expect(processOverlapSpy).not.toHaveBeenCalled();

    lastEventQueue?.emit(0, 2, true);
    RapierPhysicsStrategy.update();
    expect(processOverlapSpy).toHaveBeenCalledTimes(1);
    expect(processOverlapSpy).toHaveBeenCalledWith(firstEngine, 1001, 42, sameEngineEntity, undefined, true, 2);
  } finally {
    processOverlapSpy.mockRestore();
  }
});

test('RapierPhysicsStrategy deactivates overlaps when a non-sensor collider is removed', async () => {
  await RapierPhysicsStrategy.initialize(createFakeRapier());
  const strategy = new RapierPhysicsStrategy();
  const { entity } = createSceneGraphEntity();
  const deactivateSpy = vi.spyOn(TriggerComponent, '_deactivateOtherBinding');
  try {
    strategy.setShapeInstances(
      [
        {
          bindingId: 42,
          shape: {
            shape: { type: 'box', size: Vector3.one() },
            localPosition: Vector3.zero(),
            localRotation: Quaternion.identity(),
          },
          body: { move: false, density: 1 },
          collider: { friction: 0.5, restitution: 0 },
        },
      ],
      entity
    );

    strategy.clearShapeInstances();

    expect(deactivateSpy).toHaveBeenCalledTimes(1);
    expect(deactivateSpy).toHaveBeenCalledWith(entity, 42, 0);
  } finally {
    deactivateSpy.mockRestore();
  }
});
